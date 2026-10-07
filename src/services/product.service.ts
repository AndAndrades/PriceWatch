import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class ProductService {
  /**
   * Retrieves all active products ordered by last updated date.
   */
  static async getAllProducts() {
    return await db.product.findMany({
      where: { isActive: true },
      orderBy: { lastUpdatedAt: "desc" },
      include: {
        category: true,
        histories: {
          take: 1,
          orderBy: { detectedAt: "desc" },
        },
      },
    });
  }

  /**
   * Retrieves single product details with full price history and scrape logs.
   */
  static async getProductById(id: string) {
    return await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        histories: {
          orderBy: { detectedAt: "desc" },
        },
        scrapeLogs: {
          take: 20,
          orderBy: { executedAt: "desc" },
        },
      },
    });
  }

  /**
   * Deletes a product by ID.
   */
  static async deleteProduct(id: string) {
    return await db.product.delete({
      where: { id },
    });
  }

  /**
   * Aggregates stats for the SaaS Dashboard.
   */
  static async getDashboardStats() {
    const products = await db.product.findMany({
      where: { isActive: true },
      include: {
        histories: {
          take: 1,
          orderBy: { detectedAt: "desc" },
        },
      },
    });

    let countUp = 0;
    let countDown = 0;
    let countUnchanged = 0;

    for (const p of products) {
      const latestHistory = p.histories[0];
      if (!latestHistory) {
        countUnchanged++;
      } else if (latestHistory.direction === "UP") {
        countUp++;
      } else if (latestHistory.direction === "DOWN") {
        countDown++;
      } else {
        countUnchanged++;
      }
    }

    const lastLog = await db.scrapeLog.findFirst({
      orderBy: { executedAt: "desc" },
    });

    // Top discounts (products where currentPrice < maxPrice)
    const topDiscounts = [...products]
      .filter((p) => Number(p.maxPrice) > Number(p.currentPrice))
      .map((p) => {
        const diff = Number(p.currentPrice) - Number(p.maxPrice);
        const pct = Math.round((diff / Number(p.maxPrice)) * 10000) / 100;
        return {
          product: p,
          discountAmount: Math.abs(diff),
          discountPercentage: pct,
        };
      })
      .sort((a, b) => a.discountPercentage - b.discountPercentage)
      .slice(0, 5);

    return {
      totalProducts: products.length,
      countUp,
      countDown,
      countUnchanged,
      lastScrapedAt: lastLog ? lastLog.executedAt : null,
      topDiscounts,
    };
  }
}
