export interface RawPrices {
  normalPrice?: number;
  offerPrice?: number;
  cardPrice?: number;
}

export interface ScrapedProduct {
  name: string;
  url: string;
  imageUrl: string | null;
  currentPrice: number;
  previousPrice: number | null;
  inStock: boolean;
  rawPrices?: RawPrices;
}

export interface ScraperOptions {
  /**
   * Maximum duration in milliseconds before timing out an HTTP request or navigation (default: 30000ms).
   */
  timeoutMs?: number;

  /**
   * Timeout / pause duration in milliseconds after page load to allow Cloudflare anti-bot
   * checks and dynamic client-side hydration to complete, avoiding 403 responses (default: 3000ms).
   */
  waitDelayMs?: number;

  /**
   * Number of retry attempts in case of transient or rate-limited errors (default: 2).
   */
  retries?: number;

  /**
   * Preferred mechanism for fetching pages:
   * - "browser": Directly use the stealth browser (bypasses 403 on Cloudflare-protected stores like Falabella).
   * - "fetch": Directly use HTTP fetch (faster for open endpoints like Paris).
   * - "auto": Use the scraper's optimal default.
   */
  preferredTransport?: "browser" | "fetch" | "auto";
}

export interface ProductScraper {
  canHandle(url: string): boolean;
  scrape(url: string, options?: ScraperOptions): Promise<ScrapedProduct>;
}

export interface ScrapedCategoryProduct {
  name: string;
  url: string;
  imageUrl: string | null;
  currentPrice: number;
  previousPrice: number | null;
  inStock: boolean;
}

export interface ScrapedCategoryData {
  categoryName: string;
  categoryUrl: string;
  store: string;
  totalProductsInStore: number;
  products: ScrapedCategoryProduct[];
}

export interface CategoryScraper {
  canHandle(url: string): boolean;
  scrapeCategory(
    url: string,
    maxPages?: number,
    options?: ScraperOptions
  ): Promise<ScrapedCategoryData>;
}
