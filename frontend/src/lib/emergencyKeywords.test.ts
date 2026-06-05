import { describe, expect, it } from "vitest";

import { detectEmergencyKeywords, EMERGENCY_LEGAL_DISCLAIMER } from "./emergencyKeywords";

describe("detectEmergencyKeywords", () => {
  it("includes hardcoded legal disclaimer", () => {
    expect(EMERGENCY_LEGAL_DISCLAIMER).toContain("cannot provide medical advice");
    expect(EMERGENCY_LEGAL_DISCLAIMER).toContain("911");
  });

  it("detects clinical emergency phrases", () => {
    expect(detectEmergencyKeywords("I have chest pain")).toBe(true);
    expect(detectEmergencyKeywords("cannot breathe")).toBe(true);
    expect(detectEmergencyKeywords("call 911")).toBe(true);
  });

  it("does not false-positive on routine messages", () => {
    expect(detectEmergencyKeywords("I need to book an appointment")).toBe(false);
    expect(detectEmergencyKeywords("what are your hours?")).toBe(false);
  });
});
