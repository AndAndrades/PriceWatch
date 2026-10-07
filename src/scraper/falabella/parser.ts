import { ScrapedProduct } from "../core/types";

/**
 * Parses raw HTML string from a Falabella Chile product page.
 * Extracts title, image, prices, and stock availability from JSON-LD, __NEXT_DATA__, or meta tags.
 */
export function parseFalabellaHtml(html: string, pageUrl: string): ScrapedProduct {
  let name: string | null = null;
  let imageUrl: string | null = null;
  let currentPrice: number | null = null;
  let previousPrice: number | null = null;
  let inStock = true;

  // 1. Try JSON-LD parsing (<script type="application/ld+json">)
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const content = match.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
        const json = JSON.parse(content);
        const item = Array.isArray(json) ? json.find((i) => i["@type"] === "Product") : (json["@type"] === "Product" ? json : null);
        
        if (item) {
          if (!name && item.name) name = item.name;
          if (!imageUrl && item.image) {
            imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
          }
          if (item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offer.price) {
              const parsedP = parsePriceNumber(offer.price);
              if (parsedP && parsedP > 0) currentPrice = parsedP;
            }
            if (offer.availability) {
              inStock = String(offer.availability).includes("InStock");
            }
          }
        }
      } catch {
        // Continue to next JSON-LD block
      }
    }
  }

  // 2. Try __NEXT_DATA__ block parsing
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch && nextDataMatch[1]) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const productData = nextData?.props?.pageProps?.productData || nextData?.props?.pageProps?.initialData?.product;

      if (productData) {
        if (!name) name = productData.displayName || productData.name || null;
        if (!imageUrl && productData.mediaUrls && productData.mediaUrls.length > 0) {
          imageUrl = productData.mediaUrls[0];
        }
        
        if (productData.prices && Array.isArray(productData.prices)) {
          const pricesArr = productData.prices;
          const extractedPrices: number[] = [];
          for (const pObj of pricesArr) {
            if (pObj.price && Array.isArray(pObj.price)) {
              for (const pStr of pObj.price) {
                const num = parsePriceNumber(pStr);
                if (num && num > 0) extractedPrices.push(num);
              }
            } else if (pObj.originalPrice) {
              const num = parsePriceNumber(pObj.originalPrice);
              if (num && num > 0) extractedPrices.push(num);
            }
          }
          if (extractedPrices.length > 0) {
            extractedPrices.sort((a, b) => a - b);
            if (!currentPrice) currentPrice = extractedPrices[0]; // lowest active price
            if (extractedPrices.length > 1) previousPrice = extractedPrices[extractedPrices.length - 1]; // highest list price
          }
        }

        if (typeof productData.inStock === "boolean") {
          inStock = productData.inStock;
        }
      }
    } catch {
      // Continue to regex / meta parsing
    }
  }

  // 3. Regex & OpenGraph Meta Tag Fallback
  if (!name) {
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      name = titleMatch[1].replace(/\s*\|\s*Falabella.*$/i, "").trim();
    }
  }

  if (!imageUrl) {
    const imgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
  }

  // Price Regex Fallback if still null (e.g. $89.990)
  if (!currentPrice) {
    const priceMatches = html.match(/\$\s*(\d{1,3}(\.\d{3})+|\d+)/g);
    if (priceMatches && priceMatches.length > 0) {
      const numbers = priceMatches
        .map((p) => parsePriceNumber(p))
        .filter((n): n is number => n !== null && n > 500); // Filter out trivial values
      if (numbers.length > 0) {
        numbers.sort((a, b) => a - b);
        currentPrice = numbers[0];
        if (numbers.length > 1 && numbers[numbers.length - 1] > currentPrice) {
          previousPrice = numbers[numbers.length - 1];
        }
      }
    }
  }

  if (!name) {
    throw new Error("No se pudo extraer el nombre del producto de la página de Falabella");
  }

  if (!currentPrice || currentPrice <= 0) {
    throw new Error("No se pudo extraer el precio del producto de la página de Falabella");
  }

  // Sanitize image URL if relative
  if (imageUrl && imageUrl.startsWith("//")) {
    imageUrl = "https:" + imageUrl;
  }

  return {
    name,
    url: pageUrl,
    imageUrl,
    currentPrice,
    previousPrice,
    inStock,
  };
}

/**
 * Utility to parse price strings such as "$89.990", "$ 129.990", "89990", "89.990" into numeric CLP (89990).
 */
export function parsePriceNumber(val: string | number): number | null {
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (!val) return null;

  // Remove currency symbols, non-numeric except dot and comma
  const cleanStr = String(val).replace(/\$/g, "").replace(/\s/g, "").trim();

  // In Chile CLP format: 89.990 -> dot is thousands separator
  const numericOnly = cleanStr.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(numericOnly);
  return isNaN(num) ? null : Math.round(num);
}
