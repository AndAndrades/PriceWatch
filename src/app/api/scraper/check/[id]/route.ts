import { NextResponse } from "next/server";
import { ScraperService } from "@/services/scraper.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await ScraperService.checkProductPrice(id);
    return NextResponse.json({ message: "Verificación de precio completada", result });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al verificar precio del producto", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
