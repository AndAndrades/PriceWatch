"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, RefreshCw, Trash2, Eye, Search, Filter } from "lucide-react";
import { formatCLP, formatDate } from "@/lib/utils";
import { PriceBadge } from "@/components/ui/Badge";

interface ProductItem {
  id: string;
  name: string;
  url: string;
  imageUrl: string | null;
  currentPrice: number | string;
  previousPrice: number | string | null;
  minPrice: number | string;
  maxPrice: number | string;
  inStock: boolean;
  lastUpdatedAt: Date | string;
  histories?: Array<{
    direction: "UP" | "DOWN" | "UNCHANGED";
    priceChange: number | string;
    priceChangePercentage: number | string;
  }>;
}

interface ProductTableProps {
  products: ProductItem[];
  onRefreshProduct?: (id: string) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
}

export function ProductTable({ products, onRefreshProduct, onDeleteProduct }: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDirection, setFilterDirection] = useState<"ALL" | "DOWN" | "UP" | "UNCHANGED">("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const direction = p.histories?.[0]?.direction || "UNCHANGED";
    if (filterDirection === "ALL") return matchesSearch;
    return matchesSearch && direction === filterDirection;
  });

  const handleRefresh = async (id: string) => {
    setLoadingId(id);
    try {
      if (onRefreshProduct) {
        await onRefreshProduct(id);
      } else {
        const res = await fetch(`/api/scraper/check/${id}`, { method: "POST" });
        if (res.ok) window.location.reload();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este producto del monitoreo?")) return;
    setLoadingId(id);
    try {
      if (onDeleteProduct) {
        await onDeleteProduct(id);
      } else {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) window.location.reload();
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Productos Monitoreados</h2>
          <p className="text-xs text-slate-400 mt-0.5">Lista de productos y estado actual de precios</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 w-48 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setFilterDirection("ALL")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterDirection === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setFilterDirection("DOWN")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterDirection === "DOWN" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🟢 Bajaron
            </button>
            <button
              onClick={() => setFilterDirection("UP")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterDirection === "UP" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🔴 Subieron
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Producto</th>
              <th className="py-3.5 px-4">Precio Actual</th>
              <th className="py-3.5 px-4">Anterior</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Mín. Histórico</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Máx. Histórico</th>
              <th className="py-3.5 px-4 hidden lg:table-cell">Última Actualización</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                    <p className="text-sm font-medium">No se encontraron productos</p>
                    <p className="text-xs text-slate-600">Prueba ajustando el filtro o agrega un nuevo producto</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const latestHist = product.histories?.[0];
                return (
                  <tr key={product.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Product Name & Image */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="object-contain w-full h-full p-1"
                              unoptimized
                            />
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold">SIN IMG</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/products/${product.id}`}
                            className="font-semibold text-slate-100 hover:text-blue-400 line-clamp-2 transition-colors"
                          >
                            {product.name}
                          </Link>
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-slate-500 hover:text-slate-300 inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>Falabella Chile</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Current Price */}
                    <td className="py-3 px-4 font-mono font-bold text-sm text-white">
                      {formatCLP(product.currentPrice)}
                    </td>

                    {/* Previous Price */}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {product.previousPrice ? formatCLP(product.previousPrice) : "-"}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <PriceBadge
                        direction={latestHist?.direction}
                        difference={latestHist?.priceChange}
                        percentage={latestHist?.priceChangePercentage}
                        showDetails
                      />
                    </td>

                    {/* Min Price */}
                    <td className="py-3 px-4 font-mono text-emerald-400 hidden md:table-cell">
                      {formatCLP(product.minPrice)}
                    </td>

                    {/* Max Price */}
                    <td className="py-3 px-4 font-mono text-rose-400/80 hidden md:table-cell">
                      {formatCLP(product.maxPrice)}
                    </td>

                    {/* Last Update */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] hidden lg:table-cell">
                      {formatDate(product.lastUpdatedAt)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <Link
                        href={`/products/${product.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                        title="Ver detalle y gráfico"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleRefresh(product.id)}
                        disabled={loadingId === product.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-50"
                        title="Verificar precio ahora"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${loadingId === product.id ? "animate-spin text-blue-400" : ""}`}
                        />
                      </button>

                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={loadingId === product.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all disabled:opacity-50"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
