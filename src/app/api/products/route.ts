import { NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";
import { ScraperService } from "@/services/scraper.service";
import { CategoryService } from "@/services/category.service";
import { addProductSchema } from "@/lib/validators/product.validator";

export async function GET() {
  try {
    const products = await ProductService.getAllProducts();
    const stats = await ProductService.getDashboardStats();
    return NextResponse.json({ products, stats });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al obtener la lista de productos", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = addProductSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validación fallida", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { url } = parseResult.data;

    // Auto-detect if URL is a Category or Product
    if (url.includes("/category/")) {
      const result = await CategoryService.createAndScrapeCategory(url, 2);
      return NextResponse.json(
        {
          message: `Categoría '${result.category.name}' registrada. ${result.importedCount} productos importados (${result.newProductsCount} nuevos).`,
          isCategory: true,
          category: result.category,
          importedCount: result.importedCount,
        },
        { status: 201 }
      );
    }

    const product = await ScraperService.createAndScrapeProduct(url);
    return NextResponse.json({ message: "Producto registrado exitosamente", isCategory: false, product }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al procesar la URL" },
      { status: 500 }
    );
  }
}
