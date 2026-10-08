import { isFalabellaChileUrl } from "../../lib/validators/product.validator";
import {
  CategoryScraper,
  ScrapedCategoryData,
  ScrapedCategoryProduct,
  ScraperOptions,
} from "../core/types";
import { fetchPageHtmlWithBrowser, sleep } from "../core/browser-helper";

export type { ScrapedCategoryProduct, ScrapedCategoryData };

export class FalabellaCategoryScraper implements CategoryScraper {
  canHandle(url: string): boolean {
    return isFalabellaChileUrl(url) && (url.includes("/category/") || url.includes("/falabella-cl/"));
  }

  async scrapeCategory(
    url: string,
    maxPages: number = 2,
    options?: ScraperOptions
  ): Promise<ScrapedCategoryData> {
    const cleanUrl = url.split("?")[0];
    let categoryName = "Categoría Falabella";
    let totalProductsInStore = 0;
    const allProducts: ScrapedCategoryProduct[] = [];
    const seenUrls = new Set<string>();

    for (let page = 1; page <= maxPages; page++) {
      if (page > 1) {
        // Delay between page requests to avoid hitting rate limits and 403 blocks
        const pageDelay = options?.waitDelayMs ?? 2000;
        await sleep(pageDelay);
      }

      const pageUrl = `${cleanUrl}?page=${page}`;
      try {
        const pageData = await this.scrapePage(pageUrl, options);
        if (!pageData) break;

        if (pageData.categoryName && categoryName === "Categoría Falabella") {
          categoryName = pageData.categoryName;
        }
        if (pageData.totalCount) {
          totalProductsInStore = pageData.totalCount;
        }

        if (pageData.products.length === 0) {
          break; // No more products on this page
        }

        for (const p of pageData.products) {
          if (!seenUrls.has(p.url)) {
            seenUrls.add(p.url);
            allProducts.push(p);
          }
        }
      } catch (err) {
        console.warn(`[FalabellaCategoryScraper] Error scraping page ${page} of category ${cleanUrl}:`, err);
        if (page === 1) throw err;
        break; // If page 2 fails, return what we got on page 1
      }
    }

    if (allProducts.length === 0) {
      throw new Error(`No se encontraron productos en la categoría: ${cleanUrl}`);
    }

    return {
      categoryName,
      categoryUrl: cleanUrl,
      store: "Falabella",
      totalProductsInStore: totalProductsInStore || allProducts.length,
      products: allProducts,
    };
  }

  private async scrapePage(url: string, options?: ScraperOptions) {
    if (options?.preferredTransport === "fetch") {
      try {
        const html = await this.scrapePageViaFetch(url, options);
        return this.parseCategoryHtml(html, url);
      } catch {
        // Fallback to browser if fetch fails
      }
    }

    // Direct stealth browser navigation without 403 failure latency
    const html = await fetchPageHtmlWithBrowser(url, options);
    return this.parseCategoryHtml(html, url);
  }

  private async scrapePageViaFetch(url: string, options?: ScraperOptions): Promise<string> {
    const timeoutMs = options?.timeoutMs ?? 12000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7",
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
        throw new Error("HTTP 403 Cloudflare challenge detectado en la página de categoría");
      }

      return html;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  private parseCategoryHtml(html: string, pageUrl: string) {
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!nextDataMatch) {
      throw new Error("No se pudo extraer __NEXT_DATA__ de la página de categoría de Falabella.");
    }

    let nextData: any;
    try {
      nextData = JSON.parse(nextDataMatch[1]);
    } catch (err) {
      throw new Error("Formato JSON inválido en __NEXT_DATA__ de categoría.");
    }

    const pageProps = nextData.props?.pageProps || {};
    const results = pageProps.results || pageProps.searchResult?.results || pageProps.initialState?.search?.results || [];

    let categoryName = "Categoría Falabella";
    
    // Extract category name from breadcrumb data or page metadata
    if (Array.isArray(pageProps.breadCrumbData) && pageProps.breadCrumbData.length > 0) {
      const lastBreadcrumb = pageProps.breadCrumbData[pageProps.breadCrumbData.length - 1];
      if (lastBreadcrumb?.label) {
        categoryName = lastBreadcrumb.label;
      }
    } else if (pageProps.metadata?.title) {
      categoryName = pageProps.metadata.title.replace(/\s*\|.*$/, "").trim();
    } else {
      // Fallback from URL slug
      const urlParts = pageUrl.split("/");
      const lastPart = urlParts[urlParts.length - 1]?.split("?")[0];
      if (lastPart) {
        categoryName = decodeURIComponent(lastPart).replace(/-/g, " ");
      }
    }

    const totalCount = pageProps.pagination?.count || results.length;

    const products: ScrapedCategoryProduct[] = [];

    for (const item of results) {
      const parsed = this.parseProductItem(item);
      if (parsed) {
        products.push(parsed);
      }
    }

    return {
      categoryName,
      totalCount,
      products,
    };
  }

  private parseProductItem(item: any): ScrapedCategoryProduct | null {
    if (!item || !item.url) return null;

    const name = item.displayName || item.title || item.productName;
    if (!name) return null;

    const url = item.url.startsWith("http") ? item.url : `https://www.falabella.com${item.url}`;
    const imageUrl = Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0 ? item.mediaUrls[0] : null;

    let currentPrice = 0;
    let previousPrice: number | null = null;

    if (Array.isArray(item.prices) && item.prices.length > 0) {
      const activePrices: number[] = [];
      const crossedPrices: number[] = [];

      for (const p of item.prices) {
        const priceVal = Array.isArray(p.price) ? p.price[0] : p.price;
        const num = this.parsePriceString(priceVal);
        if (num !== null && num > 0) {
          if (p.crossed) {
            crossedPrices.push(num);
          } else {
            activePrices.push(num);
          }
        }
      }

      if (activePrices.length > 0) {
        currentPrice = Math.min(...activePrices);
      } else if (crossedPrices.length > 0) {
        currentPrice = Math.min(...crossedPrices);
      }

      if (crossedPrices.length > 0) {
        const maxCrossed = Math.max(...crossedPrices);
        if (maxCrossed > currentPrice) {
          previousPrice = maxCrossed;
        }
      }
    }

    if (currentPrice <= 0) {
      return null; // Skip invalid products without prices
    }

    const inStock = item.availability?.isAvailable ?? true;

    return {
      name,
      url,
      imageUrl,
      currentPrice,
      previousPrice,
      inStock,
    };
  }

  private parsePriceString(str: any): number | null {
    if (!str) return null;
    const cleaned = String(str).replace(/[^\d]/g, "");
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
  }
}
