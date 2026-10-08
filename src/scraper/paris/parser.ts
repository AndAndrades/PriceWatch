import { ScrapedProduct } from "../core/types";

/**
 * Parses raw HTML string from a Paris Chile product page (paris.cl).
 * Extracts title, image, prices, and stock availability from JSON-LD, Next.js RSC data, or meta tags.
 */
export function parseParisHtml(html: string, pageUrl: string): ScrapedProduct {
  let name: string | null = null;
  let imageUrl: string | null = null;
  let currentPrice: number | null = null;
  let previousPrice: number | null = null;
  let inStock = true;

  // 1. Try JSON-LD parsing (<script type="application/ld+json">)
  const jsonLdMatches = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const content = match
          .replace(/<script[^>]*>/i, "")
          .replace(/<\/script>/i, "")
          .trim();
        const json = JSON.parse(content);

        const items = Array.isArray(json) ? json : [json];
        const productItem = items.find((i) => i && i["@type"] === "Product");

        if (productItem) {
          if (!name && productItem.name) {
            name = String(productItem.name).trim();
          }

          if (!imageUrl && productItem.image) {
            imageUrl = Array.isArray(productItem.image)
              ? productItem.image[0]
              : productItem.image;
          }

          if (productItem.offers) {
            const rawOffers = Array.isArray(productItem.offers)
              ? productItem.offers
              : [productItem.offers];

            const extractedPrices: number[] = [];

            for (const off of rawOffers) {
              if (off.price) {
                const num = parsePriceNumber(off.price);
                if (num && num > 0) extractedPrices.push(num);
              }
              if (off.availability) {
                const availStr = String(off.availability);
                if (availStr.includes("OutOfStock")) {
                  inStock = false;
                }
              }
            }

            if (extractedPrices.length > 0) {
              extractedPrices.sort((a, b) => a - b);
              currentPrice = extractedPrices[0]; // lowest offer price
              if (extractedPrices.length > 1) {
                previousPrice = extractedPrices[extractedPrices.length - 1]; // highest regular price
              }
            }
          }
        }
      } catch {
        // Continue to next JSON-LD block
      }
    }
  }

  // 2. Next.js RSC state fallback (masterVariant prices in self.__next_f.push)
  if (!name || !currentPrice) {
    const scripts = html.match(/<script>([\s\S]*?)<\/script>/gi) || [];
    for (const s of scripts) {
      if (s.includes("masterVariant") || s.includes("centAmount")) {
        try {
          const regularMatch = s.match(/"regular"[\s\S]*?"centAmount":\s*(\d+)/);
          const offerMatch = s.match(/"offer"[\s\S]*?"centAmount":\s*(\d+)/);
          const cardMatch = s.match(/"paymentMethod"[\s\S]*?"centAmount":\s*(\d+)/);

          const prices: number[] = [];
          if (regularMatch) prices.push(parseInt(regularMatch[1], 10));
          if (offerMatch) prices.push(parseInt(offerMatch[1], 10));
          if (cardMatch) prices.push(parseInt(cardMatch[1], 10));

          if (prices.length > 0) {
            prices.sort((a, b) => a - b);
            if (!currentPrice) currentPrice = prices[0];
            if (!previousPrice && prices.length > 1) {
              previousPrice = prices[prices.length - 1];
            }
          }

          if (!name) {
            const nameMatch = s.match(/"name":\s*"([^"]+)"/);
            if (nameMatch) name = nameMatch[1];
          }

          if (!imageUrl) {
            const imgMatch = s.match(/"url":\s*"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/);
            if (imgMatch) imageUrl = imgMatch[1];
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // 3. OpenGraph and Meta tags fallback
  if (!name) {
    const ogTitleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<title>([^<]+)<\/title>/i);
    if (ogTitleMatch) {
      name = ogTitleMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/\s*\|\s*Paris.*$/i, "")
        .trim();
    }
  }

  if (!imageUrl) {
    const ogImgMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    );
    if (ogImgMatch) {
      imageUrl = ogImgMatch[1];
    }
  }

  // 4. Regex fallback for CLP price
  if (!currentPrice) {
    const priceMatches = html.match(/\$\s*(\d{1,3}(\.\d{3})+|\d+)/g);
    if (priceMatches && priceMatches.length > 0) {
      const numbers = priceMatches
        .map((p) => parsePriceNumber(p))
        .filter((n): n is number => n !== null && n > 500);
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
    throw new Error("No se pudo extraer el nombre del producto de la página de Paris");
  }

  if (!currentPrice || currentPrice <= 0) {
    throw new Error("No se pudo extraer el precio del producto de la página de Paris");
  }

  // Clean and decode name
  name = name.replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();

  // Ensure absolute image URL
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
 * Utility to parse price strings or numbers into integer CLP amount.
 */
export function parsePriceNumber(val: string | number): number | null {
  if (typeof val === "number") return isNaN(val) ? null : Math.round(val);
  if (!val) return null;

  const cleanStr = String(val).replace(/\$/g, "").replace(/\s/g, "").trim();
  const numericOnly = cleanStr.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(numericOnly);
  return isNaN(num) ? null : Math.round(num);
}
