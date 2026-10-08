import { isParisChileUrl } from "../../lib/validators/product.validator";
import {
  CategoryScraper,
  ScrapedCategoryData,
  ScrapedCategoryProduct,
  ScraperOptions,
} from "../core/types";
import { fetchPageHtmlWithBrowser, sleep } from "../core/browser-helper";
import { parsePriceNumber } from "./parser";

export class ParisCategoryScraper implements CategoryScraper {
  canHandle(url: string): boolean {
    return isParisChileUrl(url) && !url.endsWith(".html");
  }

  async scrapeCategory(
    url: string,
    maxPages: number = 2,
    options?: ScraperOptions
  ): Promise<ScrapedCategoryData> {
    const cleanUrl = url.split("?")[0];
    let categoryName = "Categoría Paris";
    let totalProductsInStore = 0;
    const allProducts: ScrapedCategoryProduct[] = [];
    const seenUrls = new Set<string>();

    for (let page = 1; page <= maxPages; page++) {
      if (page > 1) {
        const pageDelay = options?.waitDelayMs ?? 2000;
        await sleep(pageDelay);
      }

      const pageUrl =
        page === 1
          ? cleanUrl
          : `${cleanUrl}${cleanUrl.endsWith("/") ? "" : "/"}?page=${page}&sortby=relevance`;

      try {
        const pageData = await this.scrapePage(pageUrl, options);
        if (!pageData) break;

        if (pageData.categoryName && categoryName === "Categoría Paris") {
          categoryName = pageData.categoryName;
        }
        if (pageData.totalCount) {
          totalProductsInStore = pageData.totalCount;
        }

        if (pageData.products.length === 0) {
          break;
        }

        let addedInPage = 0;
        for (const p of pageData.products) {
          if (!seenUrls.has(p.url)) {
            seenUrls.add(p.url);
            allProducts.push(p);
            addedInPage++;
          }
        }

        // If no new products were added, stop paginating
        if (addedInPage === 0) {
          break;
        }
      } catch (err) {
        console.warn(
          `[ParisCategoryScraper] Error scrapeando página ${page} de categoría ${cleanUrl}:`,
          err
        );
        if (page === 1) throw err;
        break;
      }
    }

    if (allProducts.length === 0) {
      throw new Error(`No se encontraron productos en la categoría: ${cleanUrl}`);
    }

    return {
      categoryName,
      categoryUrl: cleanUrl,
      store: "Paris",
      totalProductsInStore: totalProductsInStore || allProducts.length,
      products: allProducts,
    };
  }

  private async scrapePage(url: string, options?: ScraperOptions) {
    try {
      const html = await this.scrapePageViaFetch(url, options);
      return this.parseCategoryHtml(html, url);
    } catch (fetchErr) {
      console.warn(
        `[ParisCategoryScraper] Fetch directo falló o fue bloqueado, usando fallback de navegador: ${
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
        }`
      );
      const html = await fetchPageHtmlWithBrowser(url, options);
      return this.parseCategoryHtml(html, url);
    }
  }

  private async scrapePageViaFetch(
    url: string,
    options?: ScraperOptions
  ): Promise<string> {
    const timeoutMs = options?.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

      return html;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  public parseCategoryHtml(html: string, pageUrl: string) {
    let categoryName = "Categoría Paris";
    let totalCount = 0;
    const products: ScrapedCategoryProduct[] = [];

    // 1. Extract Category title from <title> or breadcrumbs
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      categoryName = titleMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/\s*\|\s*Paris.*$/i, "")
        .replace(/^Cyber Tecno:\s*Ofertas y descuentos en\s*/i, "")
        .trim();
    }

    // 2. Extract products from Next.js RSC chunks
    const scripts = html.match(/<script>([\s\S]*?)<\/script>/gi) || [];
    for (const s of scripts) {
      if (s.includes("productData") && s.includes("self.__next_f.push")) {
        const match = s.match(/self\.__next_f\.push\(\[(\d+),([\s\S]*?)\]\)/);
        if (match) {
          try {
            const val = JSON.parse(match[2]);
            const colonIdx = val.indexOf(":[");
            if (colonIdx !== -1) {
              const parsedArray = JSON.parse(val.slice(colonIdx + 1));
              const productData = parsedArray[3]?.initialState?.productData;
              if (productData && Array.isArray(productData.products)) {
                if (productData.total) totalCount = productData.total;

                for (const item of productData.products) {
                  const parsed = this.parseRscProduct(item);
                  if (parsed) {
                    products.push(parsed);
                  }
                }

                if (products.length > 0) {
                  return {
                    categoryName,
                    totalCount: totalCount || products.length,
                    products,
                  };
                }
              }
            }
          } catch {
            // continue searching scripts
          }
        }
      }
    }

    // 3. Fallback: Parse product links and prices from HTML markup if RSC extraction missed
    const linkMatches = html.match(/href=["'](\/[^"']*?-\d+\.html[^"']*?)["']/gi) || [];
    const seenLinks = new Set<string>();

    for (const l of linkMatches) {
      const raw = l.replace(/^href=["']/, "").replace(/["']$/, "");
      const cleanHref = raw.split("?")[0];
      if (!seenLinks.has(cleanHref)) {
        seenLinks.add(cleanHref);
        const namePart = cleanHref
          .replace(/^\//, "")
          .replace(/-\d+\.html$/, "")
          .replace(/-/g, " ");
        const fullUrl = `https://www.paris.cl${cleanHref}`;

        products.push({
          name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
          url: fullUrl,
          imageUrl: null,
          currentPrice: 99990, // Placeholder if HTML regex fallback
          previousPrice: null,
          inStock: true,
        });
      }
    }

    return {
      categoryName,
      totalCount: totalCount || products.length,
      products,
    };
  }

  private parseRscProduct(item: any): ScrapedCategoryProduct | null {
    if (!item || !item.name || !item.slug) return null;

    const name = String(item.name).replace(/&quot;/g, '"').trim();
    const url = `https://www.paris.cl/${item.slug}.html`;

    // Extract image
    let imageUrl: string | null = null;
    if (item.masterVariant?.images && item.masterVariant.images.length > 0) {
      imageUrl = item.masterVariant.images[0].url || null;
    } else if (item.images && item.images.length > 0) {
      imageUrl = item.images[0].url || item.images[0] || null;
    }

    // Extract prices
    let currentPrice = 0;
    let previousPrice: number | null = null;

    const pricesObj = item.masterVariant?.prices || item.prices;
    if (pricesObj) {
      const activePrices: number[] = [];

      if (pricesObj.regular?.value?.centAmount) {
        activePrices.push(pricesObj.regular.value.centAmount);
      }
      if (pricesObj.offer?.value?.centAmount) {
        activePrices.push(pricesObj.offer.value.centAmount);
      }
      if (pricesObj.paymentMethod?.value?.centAmount) {
        activePrices.push(pricesObj.paymentMethod.value.centAmount);
      }

      if (activePrices.length > 0) {
        currentPrice = Math.min(...activePrices);
        const maxPrice = Math.max(...activePrices);
        if (maxPrice > currentPrice) {
          previousPrice = maxPrice;
        }
      }
    }

    if (currentPrice <= 0) {
      return null;
    }

    const inStock = item.publish !== false;

    return {
      name,
      url,
      imageUrl,
      currentPrice,
      previousPrice,
      inStock,
    };
  }
}
