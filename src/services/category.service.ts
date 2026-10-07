import { db } from "@/lib/db";
import { FalabellaCategoryScraper } from "@/scraper/falabella/category-scraper";
import { Prisma } from "@prisma/client";

export class CategoryService {
  /**
   * Retrieves all active categories with product counts.
   */
  static async getAllCategories() {
    return await db.category.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  /**
   * Scrapes category URL and auto-imports all products into DB.
   */
  static async createAndScrapeCategory(url: string, maxPages: number = 2) {
    const scraper = new FalabellaCategoryScraper();
    if (!scraper.canHandle(url)) {
      throw new Error("La URL provista no corresponde a una categoría válida de Falabella.");
    }

    const scrapedData = await scraper.scrapeCategory(url, maxPages);

    // Create or update Category record in DB
    const category = await db.category.upsert({
      where: { url: scrapedData.categoryUrl },
      create: {
        name: scrapedData.categoryName,
        url: scrapedData.categoryUrl,
        store: "Falabella",
        totalProducts: scrapedData.products.length,
        lastScrapedAt: new Date(),
        isActive: true,
      },
      update: {
        name: scrapedData.categoryName,
        totalProducts: scrapedData.products.length,
        lastScrapedAt: new Date(),
        isActive: true,
      },
    });

    const scrapedUrls = scrapedData.products.map((p) => p.url);

    // Find existing products in a single bulk query
    const existingProducts = await db.product.findMany({
      where: { url: { in: scrapedUrls } },
      select: { id: true, url: true, currentPrice: true, minPrice: true, maxPrice: true },
    });

    const existingMap = new Map(existingProducts.map((p) => [p.url, p]));

    let newProductsCount = 0;
    let updatedProductsCount = 0;

    // Process in batches of 10 to minimize DB roundtrips over remote connection
    const BATCH_SIZE = 10;
    for (let i = 0; i < scrapedData.products.length; i += BATCH_SIZE) {
      const chunk = scrapedData.products.slice(i, i + BATCH_SIZE);

      await Promise.all(
        chunk.map(async (prod) => {
          const priceDecimal = new Prisma.Decimal(prod.currentPrice);
          const prevPriceDecimal = prod.previousPrice
            ? new Prisma.Decimal(prod.previousPrice)
            : priceDecimal;

          const existing = existingMap.get(prod.url);

          if (!existing) {
            await db.$transaction(async (tx) => {
              const created = await tx.product.create({
                data: {
                  url: prod.url,
                  name: prod.name,
                  imageUrl: prod.imageUrl,
                  currentPrice: priceDecimal,
                  previousPrice: prevPriceDecimal,
                  minPrice: priceDecimal,
                  maxPrice: prevPriceDecimal.greaterThan(priceDecimal)
                    ? prevPriceDecimal
                    : priceDecimal,
                  inStock: prod.inStock,
                  categoryId: category.id,
                  firstDetectedAt: new Date(),
                  lastUpdatedAt: new Date(),
                  lastScrapedAt: new Date(),
                  isActive: true,
                },
              });

              await tx.priceHistory.create({
                data: {
                  productId: created.id,
                  price: priceDecimal,
                  previousPrice: prevPriceDecimal,
                  priceChange: new Prisma.Decimal(0),
                  priceChangePercentage: new Prisma.Decimal(0),
                  direction: "UNCHANGED",
                  detectedAt: new Date(),
                },
              });

              await tx.scrapeLog.create({
                data: {
                  productId: created.id,
                  status: "SUCCESS",
                  priceFound: priceDecimal,
                  durationMs: 0,
                  executedAt: new Date(),
                },
              });
            });
            newProductsCount++;
          } else {
            const currentMinNum = Math.min(Number(existing.minPrice), prod.currentPrice);
            const currentMaxNum = Math.max(Number(existing.maxPrice), prod.currentPrice);

            await db.product.update({
              where: { id: existing.id },
              data: {
                currentPrice: priceDecimal,
                previousPrice: existing.currentPrice,
                minPrice: new Prisma.Decimal(currentMinNum),
                maxPrice: new Prisma.Decimal(currentMaxNum),
                inStock: prod.inStock,
                categoryId: category.id,
                lastScrapedAt: new Date(),
              },
            });
            updatedProductsCount++;
          }
        })
      );
    }

    // Update total products count for category
    const totalInDb = await db.product.count({
      where: { categoryId: category.id, isActive: true },
    });

    await db.category.update({
      where: { id: category.id },
      data: { totalProducts: totalInDb, lastScrapedAt: new Date() },
    });

    return {
      category,
      importedCount: scrapedData.products.length,
      newProductsCount,
      updatedProductsCount,
    };
  }

  /**
   * Syncs existing category products.
   */
  static async syncCategory(categoryId: string) {
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new Error(`Categoría con ID ${categoryId} no encontrada`);
    }

    return await this.createAndScrapeCategory(category.url);
  }

  /**
   * Deletes a category.
   */
  static async deleteCategory(id: string) {
    return await db.category.delete({
      where: { id },
    });
  }
}
