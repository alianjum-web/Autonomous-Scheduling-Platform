"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { Bot, MessageCircle, Sparkles } from "lucide-react";

import { useReduxForm } from "@/components/common/hooks/useReduxForm";
import { useAppDispatch, useAppSelector } from "@/components/common/store/hooks";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EmergencyBanner } from "@/components/patient-triage/atoms/EmergencyBanner";
import { StatusBadge } from "@/components/patient-triage/atoms/StatusBadge";
import { TypingIndicator } from "@/components/patient-triage/atoms/TypingIndicator";
import { InlineSlotPicker } from "@/components/patient-triage/molecules/InlineSlotPicker";
import { MessageRow } from "@/components/patient-triage/molecules/MessageRow";
import { TriageStatusBar } from "@/components/patient-triage/molecules/TriageStatusBar";
import { SlotBookingDrawer } from "@/components/patient-triage/organisms/SlotBookingDrawer";
import { BookingConfirmation } from "@/components/patient-triage/molecules/BookingConfirmation";
import type { GuestVisit } from "@/lib/booking/guestVisit";
import { usePublicStreamingChat } from "@/components/booking/hooks/usePublicStreamingChat";
import { useStreamingChat } from "@/components/patient-triage/hooks/useStreamingChat";
import {
  selectAvailableSlots,
  selectBookingComplete,
  selectBookingDrawerOpen,
  selectBookingStep,
  selectConfirmationCode,
  selectSelectedSlot,
  selectSlotsKey,
} from "@/components/patient-triage/store/bookingSelectors";
import { selectSlot, setDismissedSlotsKey } from "@/components/patient-triage/store/bookingSlice";
import {
  addUserMessage,
  clearDraftMessage,
  setDraftMessage,
  setEmergencyDetected,
} from "@/components/patient-triage/store/triageSlice";
import {
  selectDraftMessage,
  selectEmergencyDetected,
  selectTriageError,
  selectTriageIsStreaming,
  selectTriageMessages,
  selectTriageSessionId,
  selectTriageStatus,
} from "@/components/patient-triage/store/triageSelectors";
import { detectEmergencyKeywords } from "@/lib/emergencyKeywords";

interface ChatMessageForm {
  message: string;
}

interface LiveChatPanelProps {
  disabled?: boolean;
  /** Public patient visit — no Supabase workspace membership. */
  publicVisit?: GuestVisit;
  /** Send intake chief complaint as the opening triage message. */
  autoStartPublicVisit?: boolean;
  /** After slot pick on public booking — go to patient details (no auth). */
  onPublicSlotSelected?: (iso: string) => void;
}

export function LiveChatPanel({
  disabled = false,
  publicVisit,
  autoStartPublicVisit = false,
  onPublicSlotSelected,
}: LiveChatPanelProps) {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(selectTriageMessages);
  const status = useAppSelector(selectTriageStatus);
  const isStreaming = useAppSelector(selectTriageIsStreaming);
  const error = useAppSelector(selectTriageError);
  const sessionId = useAppSelector(selectTriageSessionId);
  const emergencyDetected = useAppSelector(selectEmergencyDetected);
  const draftMessage = useAppSelector(selectDraftMessage);
  const bookingStep = useAppSelector(selectBookingStep);
  const availableSlots = useAppSelector(selectAvailableSlots);
  const confirmationCode = useAppSelector(selectConfirmationCode);
  const selectedSlot = useAppSelector(selectSelectedSlot);
  const slotsKey = useAppSelector(selectSlotsKey);
  const drawerOpen = useAppSelector(selectBookingDrawerOpen);
  const bookingComplete = useAppSelector(selectBookingComplete);
  const staffChat = useStreamingChat();
  const publicChat = usePublicStreamingChat(publicVisit ?? null);
  const { startChat, sendMessage } = publicVisit ? publicChat : staffChat;
  const scrollRef = useRef<HTMLDivElement>(null);

  const formValues = useMemo(() => ({ message: draftMessage }), [draftMessage]);
  const form = useReduxForm<ChatMessageForm>(formValues);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const publicStartedRef = useRef(false);
  useEffect(() => {
    if (!publicVisit || !autoStartPublicVisit || publicStartedRef.current) return;
    publicStartedRef.current = true;
    const complaint = publicVisit.intake.chiefComplaint?.trim() ?? "";
    void startChat().then(() => {
      if (complaint) {
        dispatch(addUserMessage(complaint));
        void sendMessage(complaint);
      }
    });
  }, [autoStartPublicVisit, dispatch, publicVisit, sendMessage, startChat]);

  const handleMessageChange = useCallback(
    (value: string) => {
      dispatch(setDraftMessage(value));
      dispatch(setEmergencyDetected(detectEmergencyKeywords(value)));
    },
    [dispatch],
  );

  const handleSlotSelect = useCallback(
    async (iso: string) => {
      if (!sessionId || isStreaming) return;
      if (publicVisit && onPublicSlotSelected) {
        onPublicSlotSelected(iso);
        return;
      }
      const label =
        availableSlots.find((slot) => slot.iso === iso)?.label ??
        new Date(iso).toLocaleString();
      dispatch(selectSlot(iso));
      dispatch(addUserMessage(`I'd like ${label}`));
      await sendMessage(iso, { action: "select_slot", selected_slot: iso });
    },
    [
      availableSlots,
      dispatch,
      isStreaming,
      onPublicSlotSelected,
      publicVisit,
      sendMessage,
      sessionId,
    ],
  );

  const onSubmit = form.handleSubmit(async ({ message }) => {
    const value = message.trim();
    if (!value || !sessionId) return;

    if (detectEmergencyKeywords(value)) {
      dispatch(setEmergencyDetected(true));
    }

    dispatch(addUserMessage(value));
    dispatch(clearDraftMessage());
    await sendMessage(value);
  });

  if (bookingComplete && confirmationCode && selectedSlot) {
    return (
      <BookingConfirmation
        confirmationCode={confirmationCode}
        slotStart={selectedSlot}
        onClose={() => dispatch(setDismissedSlotsKey(slotsKey))}
      />
    );
  }

  return (
    <>
      <div className="flex h-full min-h-128 flex-col dashboard-card overflow-hidden">
        <header className="space-y-3 border-b border-border/40 bg-linear-to-r from-primary/5 via-transparent to-info/5 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Bot className="size-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Intake Assistant</h2>
                <p className="text-xs text-muted-foreground">AI triage · Live scheduling</p>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
          <TriageStatusBar bookingStep={bookingStep} hasSlots={availableSlots.length > 0} />
        </header>

        <div className="px-4 pt-3 sm:px-6">
          <EmergencyBanner active={emergencyDetected} />
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
                <MessageCircle className="size-7" aria-hidden />
              </div>
              <div className="max-w-xs space-y-2">
                <p className="font-medium">Welcome — how can we help today?</p>
                <p className="text-sm text-muted-foreground">
                  Ask about appointments, clinic hours, or describe what brings you in. I&apos;m here
                  to assist.
                </p>
              </div>
              {disabled ? (
                <p className="text-xs text-muted-foreground">Sign in above to start a session.</p>
              ) : null}
            </div>
          ) : (
            messages.map((msg) => <MessageRow key={msg.id} message={msg} />)
          )}
          {isStreaming && messages[messages.length - 1]?.content === "" ? <TypingIndicator /> : null}
          {!bookingComplete && availableSlots.length > 0 ? (
            <InlineSlotPicker
              slots={availableSlots}
              selectedSlot={selectedSlot}
              disabled={isStreaming || disabled}
              onSelect={(iso) => void handleSlotSelect(iso)}
            />
          ) : null}
        </div>

        {error ? (
          <div className="mx-4 mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-6">
            {error}
          </div>
        ) : null}

        <footer className="flex gap-2 border-t border-border/60 bg-muted/20 p-4 sm:px-6">
          {!sessionId ? (
            <Button
              className="w-full gap-2 shadow-sm"
              onClick={() => startChat()}
              disabled={disabled}
            >
              <Sparkles className="size-4" aria-hidden />
              Start Chat Session
            </Button>
          ) : (
            <>
              {availableSlots.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => dispatch(setDismissedSlotsKey(null))}
                >
                  Form
                </Button>
              ) : null}
              <Form {...form}>
                <form onSubmit={onSubmit} className="flex flex-1 gap-2">
                  <FormField
                    control={form.control}
                    name="message"
                    rules={{ required: false }}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Type your message..."
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleMessageChange(e.target.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void onSubmit();
                              }
                            }}
                            disabled={
                              status === "connecting" || status === "reconnecting" || isStreaming
                            }
                            aria-describedby={emergencyDetected ? "emergency-alert" : undefined}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isStreaming}>
                    Send
                  </Button>
                </form>
              </Form>
            </>
          )}
        </footer>
      </div>

      <SlotBookingDrawer
        open={drawerOpen}
        onClose={() => dispatch(setDismissedSlotsKey(slotsKey))}
        sessionId={sessionId}
      />
    </>
  );
}
