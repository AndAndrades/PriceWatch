import { describe, it, expect } from "vitest";
import { calculatePriceChange } from "../../src/domain/price-change";

describe("calculatePriceChange", () => {
  it("should detect price increase (UP)", () => {
    const result = calculatePriceChange(79990, 89990);
    expect(result.changed).toBe(true);
    expect(result.direction).toBe("UP");
    expect(result.difference).toBe(10000);
    expect(result.percentage).toBe(12.5);
  });

  it("should detect price decrease (DOWN)", () => {
    const result = calculatePriceChange(89990, 79990);
    expect(result.changed).toBe(true);
    expect(result.direction).toBe("DOWN");
    expect(result.difference).toBe(-10000);
    expect(result.percentage).toBe(-11.11);
  });

  it("should detect unchanged price", () => {
    const result = calculatePriceChange(79990, 79990);
    expect(result.changed).toBe(false);
    expect(result.direction).toBe("UNCHANGED");
    expect(result.difference).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("should handle initial product setup without previous price", () => {
    const result = calculatePriceChange(null, 79990);
    expect(result.changed).toBe(false);
    expect(result.direction).toBe("UNCHANGED");
    expect(result.difference).toBe(0);
    expect(result.percentage).toBe(0);
  });
});
