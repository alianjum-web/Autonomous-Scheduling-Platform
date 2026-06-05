import { describe, expect, it } from "vitest";

import triageReducer, {
  addUserMessage,
  appendToken,
  finishAssistantMessage,
  resetTriage,
  setSessionId,
  setStatus,
  startAssistantMessage,
  type TriageState,
} from "./triageSlice";

const initial: TriageState = {
  messages: [],
  status: "idle",
  sessionId: null,
  isStreaming: false,
  error: null,
  emergencyDetected: false,
};

describe("triageSlice", () => {
  it("sets session id", () => {
    const state = triageReducer(initial, setSessionId("sess-1"));
    expect(state.sessionId).toBe("sess-1");
  });

  it("transitions status and streaming flag", () => {
    const state = triageReducer(initial, setStatus("streaming"));
    expect(state.status).toBe("streaming");
    expect(state.isStreaming).toBe(true);
  });

  it("adds user messages", () => {
    const state = triageReducer(initial, addUserMessage("Hello"));
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[0].content).toBe("Hello");
  });

  it("streams assistant tokens", () => {
    let state = triageReducer(initial, startAssistantMessage());
    expect(state.isStreaming).toBe(true);
    state = triageReducer(state, appendToken("Hello "));
    state = triageReducer(state, appendToken("world"));
    expect(state.messages[0].content).toBe("Hello world");
    state = triageReducer(state, finishAssistantMessage());
    expect(state.isStreaming).toBe(false);
    expect(state.status).toBe("completed");
    expect(state.messages[0].streaming).toBe(false);
  });

  it("resets to initial state", () => {
    let state = triageReducer(initial, setSessionId("sess-1"));
    state = triageReducer(state, addUserMessage("Hi"));
    state = triageReducer(state, resetTriage());
    expect(state).toEqual(initial);
  });
});
