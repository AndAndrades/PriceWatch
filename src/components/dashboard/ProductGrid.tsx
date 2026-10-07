"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, RefreshCw, Trash2, Eye, TrendingDown, TrendingUp, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { formatCLP, formatDate } from "@/lib/utils";
import { PriceBadge } from "@/components/ui/Badge";
import { useState } from "react";

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

interface ProductGridProps {
  products: ProductItem[];
  onRefreshProduct?: (id: string) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
}

export function ProductGrid({ products, onRefreshProduct, onDeleteProduct }: ProductGridProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
    if (!confirm("¿Deseas quitar este producto de tu panel de monitoreo?")) return;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const latestHist = product.histories?.[0];
        const isMinHist = Number(product.currentPrice) <= Number(product.minPrice);
        const isMaxHist = Number(product.currentPrice) >= Number(product.maxPrice) && Number(product.maxPrice) > Number(product.minPrice);

        return (
          <div
            key={product.id}
            className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* SoloTodo Style Top Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Falabella CL
              </span>

              {isMinHist ? (
                <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Mínimo Histórico
                </span>
              ) : latestHist?.direction === "DOWN" ? (
                <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Precio Bajó
                </span>
              ) : latestHist?.direction === "UP" ? (
                <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Precio Aumentó
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">Precio Estable</span>
              )}
            </div>

            {/* Product Image Container */}
            <Link
              href={`/products/${product.id}`}
              className="w-full aspect-[4/3] rounded-xl bg-slate-900 border border-slate-800/80 overflow-hidden flex items-center justify-center p-4 relative group-hover:bg-slate-900/60 transition-colors"
            >
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={220}
                  height={180}
                  className="object-contain max-h-36 w-auto group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <span className="text-xs text-slate-500 font-bold">SIN IMAGEN</span>
              )}
            </Link>

            {/* Product Details */}
            <div className="mt-3 flex-1 flex flex-col justify-between">
              <div>
                <Link
                  href={`/products/${product.id}`}
                  className="font-bold text-sm text-slate-100 hover:text-cyan-400 line-clamp-2 transition-colors leading-snug"
                >
                  {product.name}
                </Link>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Precio Actual
                    </span>
                    <span className="text-xl font-extrabold font-mono text-white tracking-tight">
                      {formatCLP(product.currentPrice)}
                    </span>
                  </div>

                  {product.previousPrice && (
                    <div className="text-right">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                        Anterior
                      </span>
                      <span className="text-xs font-mono text-slate-400 line-through">
                        {formatCLP(product.previousPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Stats Range Pill */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">Mín: {formatCLP(product.minPrice)}</span>
                <span className="text-slate-600">|</span>
                <span className="text-rose-400/80 font-bold">Máx: {formatCLP(product.maxPrice)}</span>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <span>Ir a tienda</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRefresh(product.id)}
                    disabled={loadingId === product.id}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-50"
                    title="Actualizar precio ahora"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingId === product.id ? "animate-spin text-cyan-400" : ""}`} />
                  </button>

                  <Link
                    href={`/products/${product.id}`}
                    className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all"
                    title="Ver gráfico de historial"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={loadingId === product.id}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
