import { z } from "zod";

/**
 * Validates whether a given URL is a valid Falabella Chile product or category URL.
 */
export function isFalabellaChileUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const validHost =
      parsed.hostname.endsWith("falabella.com") ||
      parsed.hostname.endsWith("falabella.cl");
    
    // Check if domain is valid and either includes falabella-cl in pathname or host
    const isChile =
      parsed.pathname.includes("/falabella-cl/") ||
      parsed.hostname.includes("falabella-cl") ||
      parsed.hostname.endsWith(".cl") ||
      parsed.hostname.includes("falabella.com");

    return validHost && isChile;
  } catch {
    return false;
  }
}

export const addProductSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Debe ingresar una URL válida")
    .refine(isFalabellaChileUrl, {
      message: "La URL debe corresponder a un producto de Falabella Chile (falabella.com)",
    }),
});

export type AddProductInput = z.infer<typeof addProductSchema>;
