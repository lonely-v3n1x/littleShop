import { describe, expect, it } from "vitest";
import { formatGhs } from "@/lib/money";

describe("formatGhs", () => {
  it("renders integer pesewas as cedis with two decimals", () => {
    expect(formatGhs(1000)).toBe("GH₵10.00");
    expect(formatGhs(450)).toBe("GH₵4.50");
    expect(formatGhs(2100)).toBe("GH₵21.00");
  });

  it("handles zero and single pesewas", () => {
    expect(formatGhs(0)).toBe("GH₵0.00");
    expect(formatGhs(1)).toBe("GH₵0.01");
    expect(formatGhs(99)).toBe("GH₵0.99");
  });

  it("handles large amounts without grouping surprises", () => {
    expect(formatGhs(123456)).toBe("GH₵1234.56");
    expect(formatGhs(18900)).toBe("GH₵189.00");
  });

  it("always uses the GH₵ symbol (the only place it may appear)", () => {
    expect(formatGhs(500).startsWith("GH₵")).toBe(true);
  });
});