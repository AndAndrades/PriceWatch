import { NextResponse } from "next/server";
import { CategoryService } from "@/services/category.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await CategoryService.syncCategory(id);

    return NextResponse.json({
      message: `Categoría ${result.category.name} sincronizada exitosamente`,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al sincronizar categoría" },
      { status: 500 }
    );
  }
}
