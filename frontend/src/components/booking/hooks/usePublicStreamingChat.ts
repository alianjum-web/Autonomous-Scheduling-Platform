"use client";

import { useCallback, useEffect, useRef } from "react";

import { addEscalation } from "@/components/appointments/store/appointmentsSlice";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";
import {
  classifySseDataLine,
  parseTriageStreamMeta,
} from "@/lib/api/parsers";
import { showToast } from "@/components/ui/toast";
import { setAvailableSlots, setBookingConfirmed } from "@/components/patient-triage/store/bookingSlice";
import {
  selectTriageMessages,
  selectTriageSessionId,
} from "@/components/patient-triage/store/triageSelectors";
import {
  appendToken,
  finishAssistantMessage,
  setEmergencyDetected,
  setError,
  setSessionId,
  setStatus,
  startAssistantMessage,
} from "@/components/patient-triage/store/triageSlice";
import type { DbChatMessage } from "@/types";
import type { UseStreamingChatReturn } from "@/types/hooks";
import type { SendChatMessageOptions } from "@/types/triage";
import type { GuestVisit } from "@/lib/booking/guestVisit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export function usePublicStreamingChat(visit: GuestVisit | null): UseStreamingChatReturn {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector(selectTriageSessionId);
  const messages = useAppSelector(selectTriageMessages);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (visit?.sessionId) {
      dispatch(setSessionId(visit.sessionId));
    }
  }, [dispatch, visit?.sessionId]);

  const applyStreamMeta = useCallback(
    (metaJson: string, activeSessionId: string | null) => {
      const meta = parseTriageStreamMeta(metaJson);
      if (!meta) return;

      if (meta.available_slots.length) {
        dispatch(setAvailableSlots(meta.available_slots));
      }
      if (meta.booking_confirmed && meta.confirmation_code && meta.booked_slot) {
        dispatch(
          setBookingConfirmed({
            code: meta.confirmation_code,
            slot: meta.booked_slot,
          }),
        );
        showToast({
          title: "Appointment confirmed",
          description: `Confirmation code: ${meta.confirmation_code}`,
        });
      }
      if (meta.is_emergency) {
        dispatch(setEmergencyDetected(true));
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
      }
    },
    [dispatch],
  );

  const sendMessage = useCallback(
    async (message: string, options?: SendChatMessageOptions) => {
      if (!visit) return;
      const id = sessionId ?? visit.sessionId;
      if (!id) return;

      abortRef.current = new AbortController();
      dispatch(setError(null));
      dispatch(setStatus("streaming"));
      dispatch(startAssistantMessage());

      const history: DbChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await fetch(
          `${API_BASE}/v1/public/clinics/${encodeURIComponent(visit.slug)}/triage/message/${id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${visit.guestToken}`,
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify({
              message,
              history,
              action: options?.action,
              selected_slot: options?.selected_slot,
            }),
            signal: abortRef.current.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Stream failed: ${response.status}`);
        }

        for await (const data of readSseStream(response)) {
          const kind = classifySseDataLine(data);
          if (kind === "done") {
            dispatch(finishAssistantMessage());
            break;
          }
          if (kind === "meta") {
            applyStreamMeta(data.slice(6), id);
            continue;
          }
          dispatch(appendToken(data));
        }
        dispatch(finishAssistantMessage());
      } catch {
        dispatch(setError("Failed to get response. Please try again."));
      }
    },
    [applyStreamMeta, dispatch, messages, sessionId, visit?.guestToken, visit?.sessionId, visit?.slug],
  );

  const startChat = useCallback(async () => {
    if (!visit) return;
    dispatch(setSessionId(visit.sessionId));
    dispatch(setError(null));
  }, [dispatch, visit]);

  const closeStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const resumeStream = useCallback(async () => {
    dispatch(setError(null));
  }, [dispatch]);

  return { startChat, sendMessage, resumeStream, closeStream };
}
