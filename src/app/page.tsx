import { ProductService } from "@/services/product.service";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  let products: any[] = [];
  let stats = {
    totalProducts: 0,
    countUp: 0,
    countDown: 0,
    countUnchanged: 0,
    lastScrapedAt: null as Date | string | null,
    topDiscounts: [] as any[],
  };

  try {
    products = await ProductService.getAllProducts();
    stats = await ProductService.getDashboardStats();
  } catch (err) {
    console.error("Error cargando productos para el Dashboard:", err);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardContent products={products} stats={stats} />
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>PriceWatch SoloTodo Edition &copy; 2026 — Monitoreo profesional de retail e historial de precios en Chile</p>
      </footer>
    </div>
  );
}
