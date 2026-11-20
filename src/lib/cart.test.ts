import { describe, expect, it } from "vitest";
import {
  addBundle,
  cartCount,
  cartSubtotal,
  parseStoredCart,
  removeLine,
  setQuantity,
} from "@/lib/cart";
import { MAX_QTY_PER_LINE } from "@/lib/constants";
import type { DataBundle } from "@/types";

function bundle(id: string, pricePesewas = 450, name = `${id} bundle`): DataBundle {
  return { id, networkId: "mtn", name, dataMb: 1024, pricePesewas };
}

describe("addBundle — one-bundle rule", () => {
  it("adds the first bundle as a single line with snapshots", () => {
    const { lines, replaced } = addBundle([], bundle("a", 450, "MTN 1GB Data"));
    expect(replaced).toBeNull();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      bundleId: "a",
      quantity: 1,
      nameSnapshot: "MTN 1GB Data",
      pricePesewasSnapshot: 450,
      dataMbSnapshot: 1024,
    });
  });

  it("increments quantity when the same bundle is added again", () => {
    const first = addBundle([], bundle("a")).lines;
    const { lines, replaced } = addBundle(first, bundle("a"));
    expect(replaced).toBeNull();
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
  });

  it("caps the planning quantity at MAX_QTY_PER_LINE", () => {
    let lines = addBundle([], bundle("a")).lines;
    for (let i = 0; i < MAX_QTY_PER_LINE + 5; i++) lines = addBundle(lines, bundle("a")).lines;
    expect(lines[0].quantity).toBe(MAX_QTY_PER_LINE);
  });

  it("REPLACES a different bundle and reports the replaced line", () => {
    const first = addBundle([], bundle("a", 450, "MTN 1GB Data")).lines;
    const { lines, replaced } = addBundle(first, bundle("b", 2100, "Telecel 5GB Data"));
    expect(lines).toHaveLength(1);
    expect(lines[0].bundleId).toBe("b");
    expect(lines[0].pricePesewasSnapshot).toBe(2100);
    expect(replaced?.bundleId).toBe("a");
    expect(replaced?.nameSnapshot).toBe("MTN 1GB Data");
  });

  it("rejects bundles with invalid prices without touching the cart", () => {
    const first = addBundle([], bundle("a")).lines;
    for (const bad of [0, -5, 4.5, Number.NaN]) {
      const { lines, replaced } = addBundle(first, bundle("bad", bad));
      expect(lines).toBe(first);
      expect(replaced).toBeNull();
    }
  });
});

describe("removeLine / setQuantity", () => {
  it("removes by bundle id", () => {
    const lines = addBundle([], bundle("a")).lines;
    expect(removeLine(lines, "a")).toEqual([]);
    expect(removeLine(lines, "other")).toHaveLength(1);
  });

  it("floors and caps quantities, removes at <= 0", () => {
    const lines = addBundle([], bundle("a")).lines;
    expect(setQuantity(lines, "a", 3.9)[0].quantity).toBe(3);
    expect(setQuantity(lines, "a", 999)[0].quantity).toBe(MAX_QTY_PER_LINE);
    expect(setQuantity(lines, "a", 0)).toEqual([]);
    expect(setQuantity(lines, "a", -2)).toEqual([]);
  });
});

describe("totals come from snapshots", () => {
  it("counts planning quantity and sums snapshot pesewas", () => {
    let lines = addBundle([], bundle("a", 450)).lines;
    lines = setQuantity(lines, "a", 3);
    expect(cartCount(lines)).toBe(3);
    expect(cartSubtotal(lines)).toBe(1350);
    expect(cartSubtotal([])).toBe(0);
    expect(cartCount([])).toBe(0);
  });
});

describe("parseStoredCart", () => {
  it("returns [] for non-arrays and garbage", () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart({})).toEqual([]);
    expect(parseStoredCart("nope")).toEqual([]);
    expect(parseStoredCart([null, 42, { bundleId: "x" }])).toEqual([]);
  });

  it("clamps quantity into [1, MAX_QTY_PER_LINE]", () => {
    const stored = [
      { bundleId: "a", quantity: 0, nameSnapshot: "A", pricePesewasSnapshot: 450, dataMbSnapshot: 1024 },
    ];
    expect(parseStoredCart(stored)[0].quantity).toBe(1);
    stored[0].quantity = 999;
    expect(parseStoredCart(stored)[0].quantity).toBe(MAX_QTY_PER_LINE);
  });

  it("collapses a legacy multi-line cart to the first valid line", () => {
    const stored = [
      { bundleId: "a", quantity: 1, nameSnapshot: "A", pricePesewasSnapshot: 450 },
      { bundleId: "b", quantity: 2, nameSnapshot: "B", pricePesewasSnapshot: 900 },
    ];
    const lines = parseStoredCart(stored);
    expect(lines).toHaveLength(1);
    expect(lines[0].bundleId).toBe("a");
    expect(lines[0].dataMbSnapshot).toBe(0); // missing snapshot defaults safely
  });
});