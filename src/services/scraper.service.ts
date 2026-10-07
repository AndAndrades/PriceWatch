import { db } from "@/lib/db";
import { ScraperFactory } from "@/scraper/core/scraper-factory";
import { calculatePriceChange } from "@/domain/price-change";
import { Prisma } from "@prisma/client";

export class ScraperService {
  /**
   * Scrapes product URL for the first time and saves product + initial history + scrape log.
   */
  static async createAndScrapeProduct(url: string) {
    const startTime = Date.now();
    const scraper = ScraperFactory.getScraperForUrl(url);

    let scraped;
    try {
      scraped = await scraper.scrape(url);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Scraping inicial falló: ${errorMsg}`);
    }

    const price = new Prisma.Decimal(scraped.currentPrice);
    const prevPrice = scraped.previousPrice ? new Prisma.Decimal(scraped.previousPrice) : price;

    // Check if product already exists with this URL
    const existing = await db.product.findUnique({ where: { url } });
    if (existing) {
      throw new Error("El producto ya se encuentra registrado en PriceWatch.");
    }

    const durationMs = Date.now() - startTime;

    // Execute in transaction
    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          url: scraped.url,
          name: scraped.name,
          imageUrl: scraped.imageUrl,
          currentPrice: price,
          previousPrice: prevPrice,
          minPrice: price,
          maxPrice: price,
          inStock: scraped.inStock,
          firstDetectedAt: new Date(),
          lastUpdatedAt: new Date(),
          lastScrapedAt: new Date(),
          isActive: true,
        },
      });

      // Insert initial history record
      await tx.priceHistory.create({
        data: {
          productId: created.id,
          price: price,
          previousPrice: prevPrice,
          priceChange: new Prisma.Decimal(0),
          priceChangePercentage: new Prisma.Decimal(0),
          direction: "UNCHANGED",
          detectedAt: new Date(),
        },
      });

      // Log scrape execution
      await tx.scrapeLog.create({
        data: {
          productId: created.id,
          status: "SUCCESS",
          priceFound: price,
          durationMs,
          executedAt: new Date(),
        },
      });

      return created;
    });

    return product;
  }

  /**
   * Checks price for a single existing product, compares with previous, creates history if changed.
   */
  static async checkProductPrice(productId: string) {
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new Error(`Producto con ID ${productId} no encontrado`);
    }

    const startTime = Date.now();
    const scraper = ScraperFactory.getScraperForUrl(product.url);

    try {
      const scraped = await scraper.scrape(product.url);
      const durationMs = Date.now() - startTime;
      const newPriceNum = scraped.currentPrice;
      const currentPriceNum = Number(product.currentPrice);

      const change = calculatePriceChange(currentPriceNum, newPriceNum);

      const newDecimalPrice = new Prisma.Decimal(newPriceNum);
      const currentMinNum = Number(product.minPrice);
      const currentMaxNum = Number(product.maxPrice);

      const newMinPrice = new Prisma.Decimal(Math.min(currentMinNum, newPriceNum));
      const newMaxPrice = new Prisma.Decimal(Math.max(currentMaxNum, newPriceNum));

      await db.$transaction(async (tx) => {
        // If price changed, create a new PriceHistory entry
        if (change.changed) {
          await tx.priceHistory.create({
            data: {
              productId: product.id,
              price: newDecimalPrice,
              previousPrice: product.currentPrice,
              priceChange: new Prisma.Decimal(change.difference),
              priceChangePercentage: new Prisma.Decimal(change.percentage),
              direction: change.direction,
              detectedAt: new Date(),
            },
          });
        }

        // Update product record
        await tx.product.update({
          where: { id: product.id },
          data: {
            currentPrice: newDecimalPrice,
            previousPrice: change.changed ? product.currentPrice : product.previousPrice,
            minPrice: newMinPrice,
            maxPrice: newMaxPrice,
            inStock: scraped.inStock,
            lastScrapedAt: new Date(),
            lastUpdatedAt: change.changed ? new Date() : product.lastUpdatedAt,
          },
        });

        // Record successful scrape log
        await tx.scrapeLog.create({
          data: {
            productId: product.id,
            status: "SUCCESS",
            priceFound: newDecimalPrice,
            durationMs,
            executedAt: new Date(),
          },
        });
      });

      return {
        productId: product.id,
        name: product.name,
        priceChange: change,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Log failure in ScrapeLog
      await db.scrapeLog.create({
        data: {
          productId: product.id,
          status: "FAILED",
          durationMs,
          errorMessage: errorMsg,
          executedAt: new Date(),
        },
      });

      throw err;
    }
  }

  /**
   * Orchestrates price check for ALL active products in background/cron mode.
   * Handles errors individually so one failing product never stops execution for others.
   */
  static async checkAllProducts() {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, url: true },
    });

    const results = {
      total: products.length,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ productId: string; name: string; error: string }>,
    };

    for (const p of products) {
      try {
        await this.checkProductPrice(p.id);
        results.succeeded++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          productId: p.id,
          name: p.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  }
}
