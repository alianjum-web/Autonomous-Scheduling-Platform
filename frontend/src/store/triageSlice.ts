import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type TriageStatus = "idle" | "connecting" | "streaming" | "completed" | "error" | "reconnecting";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  streaming?: boolean;
}

export interface TriageState {
  messages: ChatMessage[];
  status: TriageStatus;
  sessionId: string | null;
  isStreaming: boolean;
  error: string | null;
  emergencyDetected: boolean;
}

const initialState: TriageState = {
  messages: [],
  status: "idle",
  sessionId: null,
  isStreaming: false,
  error: null,
  emergencyDetected: false,
};

const triageSlice = createSlice({
  name: "triage",
  initialState,
  reducers: {
    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
    },
    setStatus(state, action: PayloadAction<TriageStatus>) {
      state.status = action.payload;
      state.isStreaming = action.payload === "streaming";
    },
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    appendToken(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1];
      if (last?.role === "assistant" && last.streaming) {
        last.content += action.payload;
      }
    },
    startAssistantMessage(state) {
      state.messages.push({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        streaming: true,
      });
      state.isStreaming = true;
      state.status = "streaming";
    },
    finishAssistantMessage(state) {
      const last = state.messages[state.messages.length - 1];
      if (last?.role === "assistant") {
        last.streaming = false;
      }
      state.isStreaming = false;
      state.status = "completed";
    },
    addUserMessage(state, action: PayloadAction<string>) {
      state.messages.push({
        id: crypto.randomUUID(),
        role: "user",
        content: action.payload,
      });
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.status = "error";
        state.isStreaming = false;
      }
    },
    setEmergencyDetected(state, action: PayloadAction<boolean>) {
      state.emergencyDetected = action.payload;
    },
    resetTriage() {
      return initialState;
    },
  },
});

export const {
  setSessionId,
  setStatus,
  addMessage,
  appendToken,
  startAssistantMessage,
  finishAssistantMessage,
  addUserMessage,
  setError,
  setEmergencyDetected,
  resetTriage,
} = triageSlice.actions;

export default triageSlice.reducer;
