import { NextResponse } from "next/server";
import { ScraperService } from "@/services/scraper.service";

export async function POST() {
  try {
    const summary = await ScraperService.checkAllProducts();
    return NextResponse.json({ message: "Ejecución de scraping masivo completada", summary });
  } catch (err) {
    return NextResponse.json(
      { error: "Error en ejecución masiva de scraping", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
