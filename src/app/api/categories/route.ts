import { NextResponse } from "next/server";
import { CategoryService } from "@/services/category.service";

export async function GET() {
  try {
    const categories = await CategoryService.getAllCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al obtener las categorías", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, maxPages } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Debe proveer una URL de categoría válida." }, { status: 400 });
    }

    const pagesToScrape = typeof maxPages === "number" && maxPages > 0 ? maxPages : 2;
    const result = await CategoryService.createAndScrapeCategory(url, pagesToScrape);

    return NextResponse.json(
      {
        message: `Categoría importada con éxito: ${result.category.name}`,
        ...result,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al procesar la categoría" },
      { status: 500 }
    );
  }
}
