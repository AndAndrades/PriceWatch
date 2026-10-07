import { Package, TrendingDown, TrendingUp, Minus, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StatsProps {
  stats: {
    totalProducts: number;
    countUp: number;
    countDown: number;
    countUnchanged: number;
    lastScrapedAt: Date | string | null;
  };
}

export function StatsCards({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Products */}
      <div className="glass-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Monitoreados</span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold text-white tracking-tight">{stats.totalProducts}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Productos en seguimiento</p>
        </div>
      </div>

      {/* Bajaron de precio */}
      <div className="glass-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Precio Bajó</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">{stats.countDown}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Con descuento reciente</p>
        </div>
      </div>

      {/* Subieron de precio */}
      <div className="glass-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Precio Aumentó</span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold text-rose-400 tracking-tight">{stats.countUp}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Aumento de precio</p>
        </div>
      </div>

      {/* Sin cambios */}
      <div className="glass-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sin Cambios</span>
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <Minus className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold text-slate-300 tracking-tight">{stats.countUnchanged}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Precio estable</p>
        </div>
      </div>

      {/* Último Scraping */}
      <div className="glass-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Último Scraping</span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-sm font-bold text-slate-200 block truncate">
            {stats.lastScrapedAt ? formatDate(stats.lastScrapedAt) : "Sin registro"}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Última ejecución programada</p>
        </div>
      </div>
    </div>
  );
}
