import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRecipients,
  parseRecipients,
  readRecipients,
  removeRecipient,
  saveRecipient,
} from "@/lib/recipients";
import { MAX_RECENT_RECIPIENTS, RECIPIENTS_STORAGE_KEY } from "@/lib/constants";

/** Minimal localStorage stand-in for the node test environment. */
function mockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: mockStorage() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseRecipients", () => {
  it("drops invalid entries, dedupes by phone, sorts most-recent first", () => {
    const raw = [
      { phone: "0541234567", lastUsedAt: 10 },
      { phone: "bad", lastUsedAt: 99 },
      { phone: "0201234567", lastUsedAt: 50 },
      { phone: "0541234567", lastUsedAt: 20 },
      null,
    ];
    const list = parseRecipients(raw);
    expect(list.map((r) => r.phone)).toEqual(["0201234567", "0541234567"]);
    expect(list[1].lastUsedAt).toBe(10);
    expect(list[0].network).toBe("telecel");
    expect(list[1].network).toBe("mtn");
  });

  it("caps the list at MAX_RECENT_RECIPIENTS", () => {
    const raw = Array.from({ length: 12 }, (_, i) => ({
      phone: `05412345${String(i).padStart(2, "0")}`,
      lastUsedAt: i,
    }));
    expect(parseRecipients(raw)).toHaveLength(MAX_RECENT_RECIPIENTS);
  });
});

describe("storage round-trip", () => {
  it("saves, dedupes and re-orders recipients", () => {
    saveRecipient("0541234567", "a@test.local");
    saveRecipient("0201234567");
    const list = saveRecipient("0541234567", "b@test.local");
    expect(list).toHaveLength(2);
    expect(list[0].phone).toBe("0541234567");
    expect(list[0].email).toBe("b@test.local");
    expect(readRecipients()[0].phone).toBe("0541234567");
  });

  it("normalises +233 input to national format before saving", () => {
    const list = saveRecipient("+" + "233" + "541234567");
    expect(list[0].phone).toBe("0541234567");
  });

  it("ignores invalid phone input", () => {
    saveRecipient("123");
    expect(readRecipients()).toEqual([]);
  });

  it("removes and clears", () => {
    saveRecipient("0541234567");
    saveRecipient("0201234567");
    expect(removeRecipient("0541234567").map((r) => r.phone)).toEqual(["0201234567"]);
    clearRecipients();
    expect(readRecipients()).toEqual([]);
    expect(window.localStorage.getItem(RECIPIENTS_STORAGE_KEY)).toBeNull();
  });

  it("survives corrupted storage", () => {
    window.localStorage.setItem(RECIPIENTS_STORAGE_KEY, "{not json");
    expect(readRecipients()).toEqual([]);
  });
});