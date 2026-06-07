"use client";

import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { EventSourcePolyfill } from "event-source-polyfill";

import { addEscalation } from "@/components/appointments/store/appointmentsSlice";
import { useAuthSession } from "@/components/common/hooks/useAuthSession";
import type { RootState } from "@/components/common/store";
import { showToast } from "@/components/ui/toast";
import { setAvailableSlots } from "@/components/patient-triage/store/bookingSlice";
import { useCreateTriageSessionMutation } from "@/components/patient-triage/store/triageApi";
import {
  appendToken,
  finishAssistantMessage,
  setEmergencyDetected,
  setError,
  setSessionId,
  setStatus,
  startAssistantMessage,
} from "@/components/patient-triage/store/triageSlice";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const USE_WEBSOCKET = process.env.NEXT_PUBLIC_USE_TRIAGE_WS === "1";

async function* readSseStream(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data: "));
      if (line) yield line.slice(6);
    }
  }
}

export function useStreamingChat() {
  const dispatch = useDispatch();
  const { accessToken, refreshSession } = useAuthSession();
  const [createSession] = useCreateTriageSessionMutation();
  const sessionId = useSelector((state: RootState) => state.triage.sessionId);
  const messages = useSelector((state: RootState) => state.triage.messages);
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const closeStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const handleStreamData = useCallback(
    (data: string, activeSessionId: string | null) => {
      if (data === "[DONE]") {
        dispatch(finishAssistantMessage());
        return "done";
      }
      if (data.startsWith("[META]")) {
        try {
          const meta = JSON.parse(data.slice(6)) as {
            available_slots?: string[];
            should_escalate?: boolean;
            is_emergency?: boolean;
            intent?: string;
          };
          if (meta.available_slots?.length) {
            dispatch(setAvailableSlots(meta.available_slots));
          }
          if (meta.is_emergency) {
            dispatch(setEmergencyDetected(true));
            showToast({
              title: "Emergency Detected",
              description: "Call 911 immediately. This AI cannot provide medical advice.",
              variant: "destructive",
            });
          }
          if (meta.should_escalate && activeSessionId) {
            dispatch(
              addEscalation({
                id: activeSessionId,
                tenant_id: "",
                current_triage_status: "escalated_to_human",
                status: "active",
              }),
            );
            showToast({
              title: "Escalation Triggered",
              description: "Connecting patient with care coordinator.",
              variant: "destructive",
            });
          }
        } catch {
          /* ignore malformed meta */
        }
        return "meta";
      }
      dispatch(appendToken(data));
      return "token";
    },
    [dispatch],
  );

  const streamViaFetch = useCallback(
    async (id: string, message: string, token: string) => {
      abortRef.current = new AbortController();
      dispatch(startAssistantMessage());

      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch(`${API_BASE}/v1/triage/message/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message, history }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream failed: ${response.status}`);
      }

      for await (const data of readSseStream(response)) {
        const result = handleStreamData(data, id);
        if (result === "done") break;
      }
      dispatch(finishAssistantMessage());
    },
    [dispatch, handleStreamData, messages],
  );

  const streamViaWebSocket = useCallback(
    async (id: string, message: string, token: string) => {
      return new Promise<void>((resolve, reject) => {
        const wsBase = API_BASE.replace(/^http/, "ws");
        const ws = new WebSocket(`${wsBase}/v1/triage/ws/${id}`, []);
        wsRef.current = ws;
        dispatch(startAssistantMessage());

        ws.onopen = () => {
          ws.send(JSON.stringify({
            message,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
            authorization: `Bearer ${token}`,
          }));
        };

        ws.onmessage = (event) => {
          const payload = JSON.parse(event.data as string) as { token?: string; done?: boolean; error?: string };
          if (payload.error) {
            reject(new Error(payload.error));
            return;
          }
          if (payload.done) {
            dispatch(finishAssistantMessage());
            resolve();
            return;
          }
          if (payload.token) dispatch(appendToken(payload.token));
        };

        ws.onerror = () => reject(new Error("WebSocket error"));
      });
    },
    [dispatch, messages],
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!sessionId) return;
      let token = accessToken;
      if (!token) {
        const refreshed = await refreshSession();
        token = refreshed?.access_token ?? null;
      }
      if (!token) {
        dispatch(setError("Authentication required."));
        return;
      }

      try {
        dispatch(setError(null));
        dispatch(setStatus("streaming"));
        if (USE_WEBSOCKET) {
          await streamViaWebSocket(sessionId, message, token);
        } else {
          await streamViaFetch(sessionId, message, token);
        }
      } catch {
        dispatch(setError("Failed to get response. Please try again."));
      }
    },
    [accessToken, dispatch, refreshSession, sessionId, streamViaFetch, streamViaWebSocket],
  );

  const startChat = useCallback(async () => {
    try {
      dispatch(setError(null));
      const result = await createSession({}).unwrap();
      dispatch(setSessionId(result.session_id));
    } catch {
      dispatch(setError("Failed to start chat session."));
    }
  }, [createSession, dispatch]);

  const resumeStream = useCallback(async () => {
    dispatch(setError(null));
  }, [dispatch]);

  return { startChat, sendMessage, resumeStream, closeStream };
}
