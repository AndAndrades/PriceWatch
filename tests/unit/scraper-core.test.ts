import { describe, it, expect, vi } from "vitest";
import { ScraperFactory, sleep, DEFAULT_TIMEOUT_MS, DEFAULT_WAIT_DELAY_MS } from "../../src/scraper/core";
import { FalabellaScraper } from "../../src/scraper/falabella/scraper";

describe("Scraper Core & Configuration", () => {
  it("should provide default timeouts and sleep utility", async () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(30000);
    expect(DEFAULT_WAIT_DELAY_MS).toBe(3000);

    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it("should resolve FalabellaScraper from ScraperFactory for valid URL", () => {
    const scraper = ScraperFactory.getScraperForUrl(
      "https://www.falabella.com/falabella-cl/product/123/test"
    );
    expect(scraper).toBeInstanceOf(FalabellaScraper);
  });

  it("should throw for unsupported URL in ScraperFactory", () => {
    expect(() =>
      ScraperFactory.getScraperForUrl("https://www.ripley.cl/product/test")
    ).toThrow(/No existe un scraper registrado/);
  });

  it("should reject invalid Falabella URLs in scraper directly", async () => {
    const scraper = new FalabellaScraper();
    await expect(scraper.scrape("https://www.amazon.com/dp/123")).rejects.toThrow(
      /FalabellaScraper no soporta la URL provista/
    );
  });
});
