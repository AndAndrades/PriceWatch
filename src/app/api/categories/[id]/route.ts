import { NextResponse } from "next/server";
import { CategoryService } from "@/services/category.service";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await CategoryService.deleteCategory(id);
    return NextResponse.json({ message: "Categoría eliminada con éxito" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}
