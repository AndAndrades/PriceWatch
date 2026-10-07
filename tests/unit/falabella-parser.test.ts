import { describe, it, expect } from "vitest";
import { parseFalabellaHtml, parsePriceNumber } from "../../src/scraper/falabella/parser";

describe("parsePriceNumber", () => {
  it("should parse Chilean CLP price formats correctly", () => {
    expect(parsePriceNumber("$89.990")).toBe(89990);
    expect(parsePriceNumber(" $ 129.990 ")).toBe(129990);
    expect(parsePriceNumber("89990")).toBe(89990);
    expect(parsePriceNumber(89990)).toBe(89990);
  });
});

describe("parseFalabellaHtml", () => {
  it("should parse product metadata from JSON-LD html snippet", () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Product",
            "name": "Samsung Galaxy Buds FE",
            "image": "https://falabella.scene7.com/is/image/Falabella/16843912_1",
            "offers": {
              "@type": "Offer",
              "price": "79990",
              "priceCurrency": "CLP",
              "availability": "https://schema.org/InStock"
            }
          }
          </script>
        </head>
        <body></body>
      </html>
    `;

    const result = parseFalabellaHtml(mockHtml, "https://www.falabella.com/falabella-cl/product/12345/test");
    expect(result.name).toBe("Samsung Galaxy Buds FE");
    expect(result.currentPrice).toBe(79990);
    expect(result.imageUrl).toBe("https://falabella.scene7.com/is/image/Falabella/16843912_1");
    expect(result.inStock).toBe(true);
  });

  it("should parse product metadata from __NEXT_DATA__ block", () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <script id="__NEXT_DATA__" type="application/json">
          {
            "props": {
              "pageProps": {
                "productData": {
                  "displayName": "Notebook Gamer ASUS ROG Strix",
                  "mediaUrls": ["https://falabella.scene7.com/is/image/Falabella/9999_1"],
                  "prices": [
                    { "price": ["$899.990"] },
                    { "originalPrice": "$1.099.990" }
                  ],
                  "inStock": true
                }
              }
            }
          }
          </script>
        </head>
        <body></body>
      </html>
    `;

    const result = parseFalabellaHtml(mockHtml, "https://www.falabella.com/falabella-cl/product/9999/test");
    expect(result.name).toBe("Notebook Gamer ASUS ROG Strix");
    expect(result.currentPrice).toBe(899990);
    expect(result.previousPrice).toBe(1099990);
    expect(result.inStock).toBe(true);
  });
});
