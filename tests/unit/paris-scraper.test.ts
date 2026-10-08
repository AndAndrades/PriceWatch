import { describe, it, expect } from "vitest";
import { parseParisHtml } from "../../src/scraper/paris/parser";
import { ParisScraper } from "../../src/scraper/paris/scraper";
import { ParisCategoryScraper } from "../../src/scraper/paris/category-scraper";
import { FalabellaScraper } from "../../src/scraper/falabella/scraper";
import { FalabellaCategoryScraper } from "../../src/scraper/falabella/category-scraper";
import { ScraperFactory, CategoryScraperFactory } from "../../src/scraper/core/scraper-factory";
import {
  isParisChileUrl,
  isSupportedStoreUrl,
  isFalabellaChileUrl,
} from "../../src/lib/validators/product.validator";

describe("Paris URL Validator", () => {
  it("should validate Paris Chile URLs correctly", () => {
    expect(isParisChileUrl("https://www.paris.cl/tecnologia/")).toBe(true);
    expect(
      isParisChileUrl("https://www.paris.cl/smartphone-galaxy-s25-256gb-62-navy-liberado-924050999.html")
    ).toBe(true);
    expect(isParisChileUrl("https://paris.cl/algo")).toBe(true);
  });

  it("should support both Falabella and Paris in isSupportedStoreUrl", () => {
    expect(isSupportedStoreUrl("https://www.paris.cl/tecnologia/")).toBe(true);
    expect(
      isSupportedStoreUrl("https://www.falabella.com/falabella-cl/product/123/test")
    ).toBe(true);
    expect(isSupportedStoreUrl("https://www.amazon.com/dp/123")).toBe(false);
  });

  it("should keep Falabella URL validation completely untouched", () => {
    expect(
      isFalabellaChileUrl("https://www.falabella.com/falabella-cl/product/123/test")
    ).toBe(true);
    expect(isFalabellaChileUrl("https://www.paris.cl/tecnologia/")).toBe(false);
  });
});

describe("ScraperFactory & CategoryScraperFactory Multi-Store Support", () => {
  it("should return FalabellaScraper for Falabella URLs without conflict", () => {
    const scraper = ScraperFactory.getScraperForUrl(
      "https://www.falabella.com/falabella-cl/product/123/test"
    );
    expect(scraper).toBeInstanceOf(FalabellaScraper);
  });

  it("should return ParisScraper for Paris product URLs", () => {
    const scraper = ScraperFactory.getScraperForUrl(
      "https://www.paris.cl/smartphone-galaxy-s25-256gb-924050999.html"
    );
    expect(scraper).toBeInstanceOf(ParisScraper);
  });

  it("should return FalabellaCategoryScraper for Falabella category URLs", () => {
    const scraper = CategoryScraperFactory.getScraperForUrl(
      "https://www.falabella.com/falabella-cl/category/cat720161/Smartphones"
    );
    expect(scraper).toBeInstanceOf(FalabellaCategoryScraper);
  });

  it("should return ParisCategoryScraper for Paris category URLs", () => {
    const scraper = CategoryScraperFactory.getScraperForUrl(
      "https://www.paris.cl/tecnologia/"
    );
    expect(scraper).toBeInstanceOf(ParisCategoryScraper);
  });
});

describe("Paris Parser", () => {
  it("should parse product data correctly from JSON-LD snippet", () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Product",
            "name": "Smart TV OLED 55 Pulgadas 4K",
            "image": [
              "https://cl-dam-resizer.ecomm.cencosud.com/sample.jpg"
            ],
            "offers": [
              {
                "@type": "Offer",
                "price": 899990,
                "priceCurrency": "CLP"
              },
              {
                "@type": "Offer",
                "price": 549990,
                "priceCurrency": "CLP"
              },
              {
                "@type": "Offer",
                "price": 499990,
                "priceCurrency": "CLP"
              }
            ]
          }
          </script>
        </head>
        <body></body>
      </html>
    `;

    const product = parseParisHtml(
      mockHtml,
      "https://www.paris.cl/smart-tv-oled-55-pulgadas-4k-123.html"
    );

    expect(product.name).toBe("Smart TV OLED 55 Pulgadas 4K");
    expect(product.currentPrice).toBe(499990); // lowest offer price
    expect(product.previousPrice).toBe(899990); // normal / list price
    expect(product.imageUrl).toBe("https://cl-dam-resizer.ecomm.cencosud.com/sample.jpg");
    expect(product.inStock).toBe(true);
  });
});
