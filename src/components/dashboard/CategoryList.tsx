"use client";

import { useState, useEffect } from "react";
import { FolderTree, RefreshCw, Trash2, ExternalLink, Loader2, Sparkles, Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  url: string;
  store: string;
  totalProducts: number;
  lastScrapedAt: string;
  _count?: {
    products: number;
  };
}

interface CategoryListProps {
  onCategorySelect?: (categoryId: string | null) => void;
  selectedCategoryId?: string | null;
  onOpenAddModal: () => void;
}

export function CategoryList({ onCategorySelect, selectedCategoryId, onOpenAddModal }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSyncCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSyncingId(id);
      const res = await fetch(`/api/categories/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await fetchCategories();
        window.location.reload();
      } else {
        alert(data.error || "Error al sincronizar categoría");
      }
    } catch (err) {
      alert("Error al intentar sincronizar categoría");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Deseas dejar de rastrear esta categoría? (Los productos rastreados se conservarán)")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedCategoryId === id && onCategorySelect) {
          onCategorySelect(null);
        }
        await fetchCategories();
      }
    } catch (err) {
      alert("Error al eliminar categoría");
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-center gap-2 text-slate-400 text-xs">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Cargando categorías...</span>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Categorías Rastradas</h3>
            <p className="text-[11px] text-slate-400">
              Monitoreo masivo por categoría ({categories.length} activas)
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-semibold transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar Categoría</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-400">No hay categorías registradas aún.</p>
          <p className="text-[11px] text-slate-500">
            Puedes agregar URL como <code className="text-cyan-400">/category/cat2018/Celulares-y-Telefonos</code> para auto-extraer todos los productos.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onCategorySelect && onCategorySelect(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
              selectedCategoryId === null
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <span>Todas las categorías</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const isSyncing = syncingId === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => onCategorySelect && onCategorySelect(cat.id)}
                className={`group cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-md shadow-cyan-500/10"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80"
                }`}
              >
                <span>{cat.name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-cyan-400 border border-slate-700">
                  {cat._count?.products ?? cat.totalProducts} prods
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                  <button
                    onClick={(e) => handleSyncCategory(cat.id, e)}
                    disabled={isSyncing}
                    title="Re-sincronizar precios de la categoría"
                    className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-cyan-400" : ""}`} />
                  </button>
                  <a
                    href={cat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Ver en Falabella.com"
                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                    title="Eliminar categoría"
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
