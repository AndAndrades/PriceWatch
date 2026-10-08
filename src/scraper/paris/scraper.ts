import { ProductScraper, ScrapedProduct, ScraperOptions } from "../core/types";
import { fetchPageHtmlWithBrowser, sleep } from "../core/browser-helper";
import { parseParisHtml } from "./parser";
import { isParisChileUrl } from "../../lib/validators/product.validator";

export class ParisScraper implements ProductScraper {
  canHandle(url: string): boolean {
    return isParisChileUrl(url);
  }

  async scrape(url: string, options?: ScraperOptions): Promise<ScrapedProduct> {
    if (!this.canHandle(url)) {
      throw new Error(`ParisScraper no soporta la URL provista: ${url}`);
    }

    const retries = options?.retries ?? 1;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Tier 1: Fast HTTP Fetch
        try {
          const scrapedData = await this.scrapeViaFetch(url, options);
          if (scrapedData) {
            return scrapedData;
          }
        } catch (fetchErr) {
          console.warn(
            `[ParisScraper] Fetch directo falló o fue bloqueado, recurriendo a navegador: ${
              fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
            }`
          );
        }

        // Tier 2: Resilient Stealth Browser Fallback
        return await this.scrapeViaBrowser(url, options);
      } catch (err) {
        if (attempt < retries) {
          const retryDelay = (options?.waitDelayMs ?? 3000) * (attempt + 1);
          console.warn(
            `[ParisScraper] Intento ${attempt + 1} falló para ${url}. Reintentando tras ${retryDelay}ms...`
          );
          await sleep(retryDelay);
        } else {
          throw new Error(
            `ParisScraper falló después de ${retries + 1} intento(s) para ${url}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    }

    throw new Error(`Error inesperado al scrapear ${url}`);
  }

  private async scrapeViaFetch(
    url: string,
    options?: ScraperOptions
  ): Promise<ScrapedProduct | null> {
    const timeoutMs = options?.timeoutMs ?? 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "es-CL,es;q=0.9,en-US;q=0.8",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      if (html.includes("<title>Cloudflare</title>") || html.includes("cf-browser-verification")) {
        throw new Error("HTTP 403 Cloudflare challenge detectado en Paris");
      }

      return parseParisHtml(html, url);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  private async scrapeViaBrowser(
    url: string,
    options?: ScraperOptions
  ): Promise<ScrapedProduct> {
    const html = await fetchPageHtmlWithBrowser(url, options);
    return parseParisHtml(html, url);
  }
}
