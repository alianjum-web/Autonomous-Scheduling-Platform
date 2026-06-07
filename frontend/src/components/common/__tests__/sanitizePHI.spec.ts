import { describe, expect, it } from "vitest";

import { sanitizePHI } from "@/lib/sanitizePHI";

describe("sanitizePHI", () => {
  it("redacts phone numbers", () => {
    expect(sanitizePHI("Call me at 555-123-4567")).toBe("Call me at[PHONE_REDACTED]");
  });

  it("redacts email addresses", () => {
    expect(sanitizePHI("Contact jane.doe@clinic.org")).toBe("Contact [EMAIL_REDACTED]");
  });

  it("leaves non-PHI text unchanged", () => {
    expect(sanitizePHI("Appointment confirmed for Tuesday")).toBe("Appointment confirmed for Tuesday");
  });
});
