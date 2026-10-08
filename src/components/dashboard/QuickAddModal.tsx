"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isSupportedStoreUrl } from "@/lib/validators/product.validator";
import { X, Link2, Loader2, AlertCircle, CheckCircle2, ShoppingCart, Sparkles, FolderTree } from "lucide-react";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCategoryUrl = url.toLowerCase().includes("/category/");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Ingresa una URL de Falabella o Paris.");
      return;
    }

    if (!isSupportedStoreUrl(trimmedUrl)) {
      setError("La URL debe ser de un producto o categoría de Falabella Chile o Paris Chile");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la solicitud.");
      }

      setSuccessMessage(data.message || "¡Registrado con éxito!");
      setUrl("");
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            {isCategoryUrl ? <FolderTree className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Rastrear Producto o Categoría</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pega la URL de un producto o categoría completa de Falabella para auto-importar sus productos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                URL (Falabella.com)
              </label>
              {isCategoryUrl && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                  Modo Categoría Detectado
                </span>
              )}
            </div>
            <div className="relative">
              <Link2 className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="https://www.falabella.com/falabella-cl/category/cat2018/Celulares-y-Telefonos..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading || Boolean(successMessage)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-600 transition-all"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              💡 Ej. de categoría: <code className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px]">https://www.falabella.com/falabella-cl/category/cat2018/Celulares-y-Telefonos</code>
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || Boolean(successMessage)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isCategoryUrl ? "Importando productos de categoría..." : "Obteniendo precio..."}</span>
                </>
              ) : isCategoryUrl ? (
                <>
                  <FolderTree className="w-4 h-4" />
                  <span>Importar Categoría Completa</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Agregar al Monitoreo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
