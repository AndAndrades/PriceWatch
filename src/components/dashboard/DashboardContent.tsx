"use client";

import { useState } from "react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProductTable } from "@/components/dashboard/ProductTable";
import { ProductGrid } from "@/components/dashboard/ProductGrid";
import { TopDiscounts } from "@/components/dashboard/TopDiscounts";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { LayoutGrid, List, Search, Plus, Filter, ArrowUpDown, Sparkles, ShoppingBag } from "lucide-react";
import { QuickAddModal } from "@/components/dashboard/QuickAddModal";

interface DashboardContentProps {
  products: any[];
  stats: {
    totalProducts: number;
    countUp: number;
    countDown: number;
    countUnchanged: number;
    lastScrapedAt: Date | string | null;
    topDiscounts: any[];
  };
}

export function DashboardContent({ products, stats }: DashboardContentProps) {
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDirection, setFilterDirection] = useState<"ALL" | "DOWN" | "UP" | "UNCHANGED">("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"UPDATED" | "PRICE_ASC" | "PRICE_DESC" | "DISCOUNT">("UPDATED");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategoryId || p.categoryId === selectedCategoryId;
    const direction = p.histories?.[0]?.direction || "UNCHANGED";
    if (filterDirection === "ALL") return matchesSearch && matchesCategory;
    return matchesSearch && matchesCategory && direction === filterDirection;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "PRICE_ASC") return Number(a.currentPrice) - Number(b.currentPrice);
    if (sortBy === "PRICE_DESC") return Number(b.currentPrice) - Number(a.currentPrice);
    if (sortBy === "DISCOUNT") {
      const diffA = Number(a.maxPrice) - Number(a.currentPrice);
      const diffB = Number(b.maxPrice) - Number(b.currentPrice);
      return diffB - diffA;
    }
    return new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();
  });

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              Monitoreo de Precios
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Falabella Chile
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma estilo SoloTodo para rastreo e historial automático de productos de retail.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-600/25 hover:brightness-110 transition-all duration-200 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Pegar URL & Rastrear</span>
        </button>
      </div>

      {/* Top Summary Stats Cards */}
      <StatsCards stats={stats} />

      {/* Tracked Categories Section */}
      <CategoryList
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={(id) => setSelectedCategoryId(id)}
        onOpenAddModal={() => setIsModalOpen(true)}
      />

      {/* Top Discounts Spotlight */}
      {stats.topDiscounts.length > 0 && <TopDiscounts discounts={stats.topDiscounts} />}

      {/* SoloTodo Filter & View Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilterDirection("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterDirection === "ALL" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setFilterDirection("DOWN")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterDirection === "DOWN" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🟢 Bajaron ({products.filter((p) => p.histories?.[0]?.direction === "DOWN").length})
            </button>
            <button
              onClick={() => setFilterDirection("UP")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterDirection === "UP" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🔴 Subieron ({products.filter((p) => p.histories?.[0]?.direction === "UP").length})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="UPDATED" className="bg-slate-900 text-slate-200">
                Última Actualización
              </option>
              <option value="DISCOUNT" className="bg-slate-900 text-slate-200">
                Mayor Descuento %
              </option>
              <option value="PRICE_ASC" className="bg-slate-900 text-slate-200">
                Menor Precio
              </option>
              <option value="PRICE_DESC" className="bg-slate-900 text-slate-200">
                Mayor Precio
              </option>
            </select>
          </div>

          {/* View Mode Switcher (Grid vs Table) */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "GRID" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Vista en Tarjetas (SoloTodo Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "TABLE" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Vista en Tabla Completa"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Grid vs Table vs Empty State */}
      {sortedProducts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-white">No hay productos que coincidan</h3>
            <p className="text-xs text-slate-400 mt-1">
              Prueba cambiando el filtro de búsqueda o agrega un nuevo producto de Falabella Chile para iniciar el rastreo.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-cyan-600 text-white hover:bg-cyan-500 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Producto</span>
          </button>
        </div>
      ) : viewMode === "GRID" ? (
        <ProductGrid products={sortedProducts} />
      ) : (
        <ProductTable products={sortedProducts} />
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
