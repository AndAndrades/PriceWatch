"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { isFalabellaChileUrl } from "@/lib/validators/product.validator";
import { Link2, ArrowLeft, Loader2, AlertCircle, CheckCircle2, ShoppingCart } from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Por favor ingrese una URL de Falabella.");
      return;
    }

    if (!isFalabellaChileUrl(trimmedUrl)) {
      setError("La URL ingresada debe corresponder a un producto de Falabella Chile (falabella.com)");
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
        throw new Error(data.error || "Error al procesar el producto.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Monitorear Producto de Falabella
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingresa la URL oficial del producto para obtener su precio actual e iniciar el seguimiento.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="url-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                URL del Producto (Falabella Chile)
              </label>
              <div className="relative">
                <Link2 className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="url-input"
                  type="url"
                  placeholder="https://www.falabella.com/falabella-cl/product/16843912/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading || success}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 transition-all disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Ejemplo: https://www.falabella.com/falabella-cl/product/16843912/Samsung-Galaxy-S24-Ultra/16843913
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>¡Producto scrapeado y registrado con éxito! Redirigiendo...</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Ejecutando scraping en Falabella...</span>
                  </>
                ) : (
                  <span>Agregar Producto</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
