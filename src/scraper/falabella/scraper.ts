import { ProductScraper, ScrapedProduct } from "../core/types";
import { parseFalabellaHtml } from "./parser";
import { isFalabellaChileUrl } from "@/lib/validators/product.validator";
import type { Browser } from "playwright";

export class FalabellaScraper implements ProductScraper {
  canHandle(url: string): boolean {
    return isFalabellaChileUrl(url);
  }

  async scrape(url: string): Promise<ScrapedProduct> {
    if (!this.canHandle(url)) {
      throw new Error(`FalabellaScraper no soporta la URL provista: ${url}`);
    }

    // Tier 1: Fast HTTP Fetch with realistic browser headers
    try {
      const scrapedData = await this.scrapeViaFetch(url);
      if (scrapedData) {
        return scrapedData;
      }
    } catch (fetchErr) {
      console.warn(`[FalabellaScraper] Fetch directo falló o fue bloqueado, utilizando Playwright fallback: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
    }

    // Tier 2: Playwright Headless Browser Fallback
    return await this.scrapeViaPlaywright(url);
  }

  private async scrapeViaFetch(url: string): Promise<ScrapedProduct | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for fetch

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return parseFalabellaHtml(html, url);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  private async scrapeViaPlaywright(url: string): Promise<ScrapedProduct> {
    // Dynamic import of playwright to keep server lightweight when fetch succeeds
    const { chromium } = await import("playwright");
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });

      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 },
        locale: "es-CL",
      });

      const page = await context.newPage();
      
      // Block useless image/css/font assets if needed to speed up load, but keep images if needed
      await page.route("**/*.{png,jpg,jpeg,svg,gif,webp,woff,woff2,ttf,css}", (route) => route.abort());

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      
      const html = await page.content();
      await browser.close();
      browser = null;

      return parseFalabellaHtml(html, url);
    } catch (err) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      throw new Error(`Scraping con Playwright falló para ${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
