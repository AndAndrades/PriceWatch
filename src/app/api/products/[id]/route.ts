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

    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al consultar producto", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ProductService.deleteProduct(id);
    return NextResponse.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al eliminar producto", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
