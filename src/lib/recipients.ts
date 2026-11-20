import {
  MAX_RECENT_RECIPIENTS,
  RECIPIENTS_STORAGE_KEY,
} from "@/lib/constants";
import { networkHintForE164, normaliseGhanaPhone, type PhonePrefixNetwork } from "@/lib/phone";

/**
 * Recent recipients — a device-local convenience list (localStorage only).
 * blink never uploads it; it exists so a reseller buying for the same few
 * numbers doesn't retype them. Entries are deduped by phone, most-recent
 * first, capped at MAX_RECENT_RECIPIENTS.
 *
 * All storage access is wrapped: private mode / blocked storage degrades to
 * an empty list, never an error. Call only from effects or event handlers.
 */

export interface RecentRecipient {
  /** 10-digit national format, e.g. 0541234567. */
  phone: string;
  email?: string;
  network: PhonePrefixNetwork;
  lastUsedAt: number;
}

export function parseRecipients(raw: unknown): RecentRecipient[] {
  if (!Array.isArray(raw)) return [];
  const out: RecentRecipient[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const r = entry as Partial<RecentRecipient>;
    if (typeof r.phone !== "string" || !/^0\d{9}$/.test(r.phone)) continue;
    if (seen.has(r.phone)) continue;
    seen.add(r.phone);
    out.push({
      phone: r.phone,
      email: typeof r.email === "string" && r.email.trim() !== "" ? r.email : undefined,
      network: networkHintForE164(`+233${r.phone.slice(1)}`),
      lastUsedAt: typeof r.lastUsedAt === "number" ? r.lastUsedAt : 0,
    });
    if (out.length >= MAX_RECENT_RECIPIENTS) break;
  }
  return out.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

export function readRecipients(): RecentRecipient[] {
  try {
    const raw = window.localStorage.getItem(RECIPIENTS_STORAGE_KEY);
    if (!raw) return [];
    return parseRecipients(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeRecipients(list: RecentRecipient[]): void {
  try {
    window.localStorage.setItem(RECIPIENTS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full/blocked: the list just won't persist.
  }
}

/** Record a successful checkout start; returns the updated list. */
export function saveRecipient(phone: string, email?: string): RecentRecipient[] {
  const parsed = normaliseGhanaPhone(phone);
  if (!parsed.ok) return readRecipients();
  const national = `0${parsed.e164.replace(/\D/g, "").slice(-9)}`;
  const trimmedEmail = email?.trim();
  const entry: RecentRecipient = {
    phone: national,
    email: trimmedEmail && trimmedEmail.length > 0 ? trimmedEmail : undefined,
    network: networkHintForE164(parsed.e164),
    lastUsedAt: Date.now(),
  };
  const rest = readRecipients().filter((r) => r.phone !== national);
  const next = [entry, ...rest].slice(0, MAX_RECENT_RECIPIENTS);
  writeRecipients(next);
  return next;
}

export function removeRecipient(phone: string): RecentRecipient[] {
  const next = readRecipients().filter((r) => r.phone !== phone);
  writeRecipients(next);
  return next;
}

export function clearRecipients(): void {
  try {
    window.localStorage.removeItem(RECIPIENTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}