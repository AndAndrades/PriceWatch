import { NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await ProductService.getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      productId: product.id,
      name: product.name,
      histories: product.histories,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al obtener historial", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
