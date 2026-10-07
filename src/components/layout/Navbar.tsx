"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, Plus, RefreshCw, Activity, Sparkles } from "lucide-react";
import { useState } from "react";
import { QuickAddModal } from "@/components/dashboard/QuickAddModal";

export function Navbar() {
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/scraper/check-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        alert(`Error al refrescar: ${data.error || "Fallo en scraping"}`);
      }
    } catch {
      alert("Error de conexión al ejecutar scraping masivo.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-white font-sans">PriceWatch</span>
                  <span className="text-[10px] font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
                    SoloTodo Mode
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">Monitoreo de Ofertas & Histórico de Falabella</p>
              </div>
            </Link>

            {/* Navigation Links & Actions */}
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  pathname === "/"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Dashboard</span>
              </Link>

              {/* Quick Add Modal Trigger Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-600/20 hover:brightness-110 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Pegar URL</span>
                <span className="sm:hidden">+</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleGlobalRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
                title="Ejecutar comprobación manual para todos los productos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
                <span className="hidden md:inline">{isRefreshing ? "Scrapeando..." : "Refrescar Precios"}</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
