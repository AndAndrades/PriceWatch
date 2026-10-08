import { ProductScraper, CategoryScraper } from "./types";
import { FalabellaScraper } from "../falabella/scraper";
import { FalabellaCategoryScraper } from "../falabella/category-scraper";
import { ParisScraper } from "../paris/scraper";
import { ParisCategoryScraper } from "../paris/category-scraper";

export class ScraperFactory {
  private static scrapers: ProductScraper[] = [
    new FalabellaScraper(),
    new ParisScraper(),
  ];

  /**
   * Returns the registered ProductScraper capable of handling the URL.
   */
  public static getScraperForUrl(url: string): ProductScraper {
    const scraper = this.scrapers.find((s) => s.canHandle(url));
    if (!scraper) {
      throw new Error(`No existe un scraper registrado para la URL: ${url}`);
    }
    return scraper;
  }
}

export class CategoryScraperFactory {
  private static scrapers: CategoryScraper[] = [
    new FalabellaCategoryScraper(),
    new ParisCategoryScraper(),
  ];

  /**
   * Returns the registered CategoryScraper capable of handling the URL.
   */
  public static getScraperForUrl(url: string): CategoryScraper {
    const scraper = this.scrapers.find((s) => s.canHandle(url));
    if (!scraper) {
      throw new Error(`No existe un scraper de categorías registrado para la URL: ${url}`);
    }
    return scraper;
  }
}
