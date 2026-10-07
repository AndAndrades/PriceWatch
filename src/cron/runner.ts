import { ScraperService } from "@/services/scraper.service";

async function main() {
  console.log(`[PriceWatch Cron] Iniciando verificación de precios: ${new Date().toISOString()}`);
  const startTime = Date.now();

  try {
    const summary = await ScraperService.checkAllProducts();
    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`[PriceWatch Cron] Completado en ${duration}s.`);
    console.log(`Total productos: ${summary.total} | Exitosos: ${summary.succeeded} | Fallidos: ${summary.failed}`);

    if (summary.errors.length > 0) {
      console.error("[PriceWatch Cron] Errores encontrados:");
      summary.errors.forEach((e) => {
        console.error(` - Producto ID [${e.productId}] (${e.name}): ${e.error}`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error("[PriceWatch Cron] Error fatal ejecutando cron:", err);
    process.exit(1);
  }
}

main();
