import { ProductScraper } from "./types";
import { FalabellaScraper } from "../falabella/scraper";

export class ScraperFactory {
  private static scrapers: ProductScraper[] = [new FalabellaScraper()];

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
