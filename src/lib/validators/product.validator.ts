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

/**
 * Validates whether a given URL is a valid Paris Chile product or category URL.
 */
export function isParisChileUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname === "paris.cl" || parsed.hostname.endsWith(".paris.cl");
  } catch {
    return false;
  }
}

/**
 * Validates whether a given URL belongs to any supported store (Falabella, Paris).
 */
export function isSupportedStoreUrl(urlStr: string): boolean {
  return isFalabellaChileUrl(urlStr) || isParisChileUrl(urlStr);
}

export const addProductSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Debe ingresar una URL válida")
    .refine(isSupportedStoreUrl, {
      message: "La URL debe corresponder a una tienda soportada: Falabella Chile o Paris Chile",
    }),
});

export type AddProductInput = z.infer<typeof addProductSchema>;
