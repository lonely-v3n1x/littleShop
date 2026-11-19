/**
 * Ghana recipient-number normalisation. Client-side only: this is UX, not security.
 * Number portability exists, so a prefix mismatch is a soft warning and NEVER a block.
 */

export type PhonePrefixNetwork = "mtn" | "telecel" | "at" | "unknown";

const PREFIXES: Record<string, PhonePrefixNetwork> = {
  "024": "mtn", "025": "mtn", "053": "mtn", "054": "mtn", "055": "mtn", "059": "mtn",
  "020": "telecel", "050": "telecel",
  "023": "at", "026": "at", "027": "at", "056": "at", "057": "at",
};

export type PhoneResult =
  | { ok: true; e164: string }
  | { ok: false; error: string };

/** Accepts 0XXXXXXXXX, +233XXXXXXXXX, or 233XXXXXXXXX. Returns +233XXXXXXXXX. */
export function normaliseGhanaPhone(raw: string): PhoneResult {
  const digits = raw.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  let local: string;

  if (/^233\d{9}$/.test(digits)) local = `0${digits.slice(3)}`;
  else if (/^0\d{9}$/.test(digits)) local = digits;
  else local = `0${digits}`;

  if (!/^0\d{9}$/.test(local)) {
    return { ok: false, error: "Enter a 10-digit Ghana number, e.g. 054 123 4567." };
  }
  return { ok: true, e164: `+233${local.slice(1)}` };
}

/** Best guess from the prefix — a warning, never a gate. */
export function networkHintForE164(e164: string): PhonePrefixNetwork {
  // E.164 "+233241234567" -> national digits "241234567" -> prefix "024".
  return PREFIXES[`0${e164.slice(4, 6)}`] ?? "unknown";
}
