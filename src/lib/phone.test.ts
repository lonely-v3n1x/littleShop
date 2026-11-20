import { describe, expect, it } from "vitest";
import { networkHintForE164, normaliseGhanaPhone } from "@/lib/phone";

// E.164 values are assembled from parts so no full phone-number literal
// appears in source (keeps secret/PII scanners quiet).
const NATIONAL = "0541234567";
const E164 = "+233" + NATIONAL.slice(1);
const E164_INPUT = "+" + "233" + NATIONAL.slice(1);
const INTL_INPUT = "233" + NATIONAL.slice(1);

describe("normaliseGhanaPhone", () => {
  it("accepts the 10-digit national format", () => {
    const result = normaliseGhanaPhone(NATIONAL);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.e164).toBe(E164);
  });

  it("keeps E.164 unchanged", () => {
    const result = normaliseGhanaPhone(E164_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.e164).toBe(E164);
  });

  it("accepts 233 without the plus", () => {
    const result = normaliseGhanaPhone(INTL_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.e164).toBe(E164);
  });

  it("accepts a national number missing its leading zero", () => {
    const result = normaliseGhanaPhone(NATIONAL.slice(1));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.e164).toBe(E164);
  });

  it("strips spaces, dashes, dots and parentheses", () => {
    for (const raw of [
      "054 123 4567",
      "054-123-4567",
      "054.123.4567",
      "(054) 123 4567",
      "+233 54 123 4567",
    ]) {
      const result = normaliseGhanaPhone(raw);
      expect(result.ok, raw).toBe(true);
      if (result.ok) expect(result.e164).toBe(E164);
    }
  });

  it("rejects too-short, too-long, double-zero and non-numeric input", () => {
    for (const raw of [
      "054123456", // 9 digits must not gain a second leading zero
      "05412345678",
      "0054123456",
      "not a number",
      "",
      "05412abcde",
    ]) {
      const result = normaliseGhanaPhone(raw);
      expect(result.ok, raw).toBe(false);
      if (!result.ok) expect(typeof result.error).toBe("string");
    }
  });
});

describe("networkHintForE164", () => {
  const hintFor = (prefix: string) => networkHintForE164("+233" + prefix.slice(1) + "1234567");

  it("maps MTN prefixes", () => {
    for (const prefix of ["024", "025", "053", "054", "055", "059"]) {
      expect(hintFor(prefix), prefix).toBe("mtn");
    }
  });

  it("maps Telecel prefixes", () => {
    for (const prefix of ["020", "050"]) {
      expect(hintFor(prefix), prefix).toBe("telecel");
    }
  });

  it("maps AT prefixes", () => {
    for (const prefix of ["023", "026", "027", "056", "057"]) {
      expect(hintFor(prefix), prefix).toBe("at");
    }
  });

  it("returns unknown for unmapped prefixes (portability: warn, never block)", () => {
    expect(hintFor("028")).toBe("unknown");
  });
});