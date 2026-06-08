import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/components/common/store";

export const selectTriageState = (state: RootState) => state.triage;

export const selectTriageMessages = (state: RootState) => state.triage.messages;
export const selectTriageStatus = (state: RootState) => state.triage.status;
export const selectTriageSessionId = (state: RootState) => state.triage.sessionId;
export const selectTriageIsStreaming = (state: RootState) => state.triage.isStreaming;
export const selectTriageError = (state: RootState) => state.triage.error;
export const selectEmergencyDetected = (state: RootState) => state.triage.emergencyDetected;
export const selectDraftMessage = (state: RootState) => state.triage.draftMessage;

export const selectCanSendMessage = createSelector(
  [selectTriageSessionId, selectTriageStatus, selectTriageIsStreaming],
  (sessionId, status, isStreaming) =>
    Boolean(sessionId) &&
    !isStreaming &&
    status !== "connecting" &&
    status !== "reconnecting",
);
