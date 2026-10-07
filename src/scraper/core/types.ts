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

export interface ProductScraper {
  canHandle(url: string): boolean;
  scrape(url: string): Promise<ScrapedProduct>;
}
