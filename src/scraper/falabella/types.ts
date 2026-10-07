export interface JsonLdProduct {
  "@type"?: string;
  name?: string;
  image?: string | string[];
  offers?: {
    "@type"?: string;
    price?: number | string;
    priceCurrency?: string;
    availability?: string;
    lowPrice?: number | string;
    highPrice?: number | string;
  } | Array<{
    price?: number | string;
    priceCurrency?: string;
    availability?: string;
  }>;
}

export interface NextDataFalabella {
  props?: {
    pageProps?: {
      productData?: {
        name?: string;
        displayName?: string;
        mediaUrls?: string[];
        prices?: Array<{
          type?: string;
          price?: string[];
          originalPrice?: string;
        }>;
        variants?: Array<{
          prices?: Array<{
            type?: string;
            price?: string[];
          }>;
          offerPrice?: number;
          normalPrice?: number;
          cardPrice?: number;
          stock?: {
            inStock?: boolean;
          };
        }>;
        inStock?: boolean;
      };
      initialData?: {
        product?: {
          displayName?: string;
          mediaUrls?: string[];
        };
      };
    };
  };
}
