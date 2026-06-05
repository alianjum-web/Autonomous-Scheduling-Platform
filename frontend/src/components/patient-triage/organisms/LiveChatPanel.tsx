"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmergencyBanner } from "@/components/patient-triage/atoms/EmergencyBanner";
import { StatusBadge } from "@/components/patient-triage/atoms/StatusBadge";
import { TypingIndicator } from "@/components/patient-triage/atoms/TypingIndicator";
import { MessageRow } from "@/components/patient-triage/molecules/MessageRow";
import { TriageStatusBar } from "@/components/patient-triage/molecules/TriageStatusBar";
import { SlotBookingDrawer } from "@/components/patient-triage/organisms/SlotBookingDrawer";
import { BookingConfirmation } from "@/components/patient-triage/screens/BookingConfirmation";
import { detectEmergencyKeywords } from "@/lib/emergencyKeywords";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { addUserMessage, setEmergencyDetected } from "@/store/triageSlice";
import type { RootState } from "@/store";

export function LiveChatPanel() {
  const dispatch = useDispatch();
  const { messages, status, isStreaming, error, sessionId, emergencyDetected } = useSelector(
    (state: RootState) => state.triage,
  );
  const { bookingStep, availableSlots, confirmationCode, selectedSlot } = useSelector(
    (state: RootState) => state.booking,
  );
  const { startChat, sendMessage } = useStreamingChat();
  const slotsKey = availableSlots.map((s) => s.iso).join("|");
  const [dismissedSlotsKey, setDismissedSlotsKey] = useState<string | null>(null);
  const drawerOpen = slotsKey.length > 0 && dismissedSlotsKey !== slotsKey;
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleInputChange = useCallback(
    (value: string) => {
      const detected = detectEmergencyKeywords(value);
      dispatch(setEmergencyDetected(detected));
    },
    [dispatch],
  );

  const handleSend = async () => {
    const value = inputRef.current?.value.trim();
    if (!value || !sessionId) return;

    if (detectEmergencyKeywords(value)) {
      dispatch(setEmergencyDetected(true));
    }

    dispatch(addUserMessage(value));
    if (inputRef.current) inputRef.current.value = "";
    await sendMessage(value);
  };

  if (bookingStep === "complete" && confirmationCode && selectedSlot) {
    return (
      <BookingConfirmation
        confirmationCode={confirmationCode}
        slotStart={selectedSlot}
        onClose={() => setDismissedSlotsKey(slotsKey)}
      />
    );
  }

  return (
    <>
      <div className="flex h-full min-h-[32rem] flex-col rounded-xl border bg-card shadow-sm">
        <header className="space-y-3 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Patient Intake Chat</h2>
              <p className="text-xs text-muted-foreground">AI triage with live scheduling</p>
            </div>
            <StatusBadge status={status} />
          </div>
          <TriageStatusBar bookingStep={bookingStep} hasSlots={availableSlots.length > 0} />
        </header>

        <div className="px-4 pt-3">
          <EmergencyBanner active={emergencyDetected} />
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Start a session to chat with our intake assistant.
            </p>
          ) : (
            messages.map((msg) => <MessageRow key={msg.id} message={msg} />)
          )}
          {isStreaming && messages[messages.length - 1]?.content === "" ? <TypingIndicator /> : null}
        </div>

        {error ? (
          <div className="mx-4 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <footer className="flex gap-2 border-t p-4">
          {!sessionId ? (
            <Button className="w-full" onClick={() => startChat()}>
              Start Chat Session
            </Button>
          ) : (
            <>
              {availableSlots.length > 0 ? (
                <Button variant="outline" onClick={() => setDismissedSlotsKey(null)}>
                  Book Slot
                </Button>
              ) : null}
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={status === "connecting" || status === "reconnecting" || isStreaming}
                aria-describedby={emergencyDetected ? "emergency-alert" : undefined}
              />
              <Button onClick={handleSend} disabled={isStreaming}>
                Send
              </Button>
            </>
          )}
        </footer>
      </div>

      <SlotBookingDrawer
        open={drawerOpen}
        onClose={() => setDismissedSlotsKey(slotsKey)}
        sessionId={sessionId}
      />
    </>
  );
}
