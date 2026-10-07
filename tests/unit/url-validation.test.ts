import { describe, it, expect } from "vitest";
import { isFalabellaChileUrl } from "../../src/lib/validators/product.validator";

describe("isFalabellaChileUrl", () => {
  it("should validate correct Falabella Chile product URLs", () => {
    const validUrl1 =
      "https://www.falabella.com/falabella-cl/product/16843912/Samsung-Galaxy-S24-Ultra-256GB/16843913";
    const validUrl2 =
      "https://www.falabella.com/falabella-cl/category/cat720161/Smartphones?facetSelected=true";
    expect(isFalabellaChileUrl(validUrl1)).toBe(true);
    expect(isFalabellaChileUrl(validUrl2)).toBe(true);
  });

  it("should reject non-Falabella or invalid URLs", () => {
    expect(isFalabellaChileUrl("https://www.amazon.com/dp/B08N5WRWNW")).toBe(false);
    expect(isFalabellaChileUrl("https://www.google.com")).toBe(false);
    expect(isFalabellaChileUrl("invalid-url-string")).toBe(false);
  });
});
