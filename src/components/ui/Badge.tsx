import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatCLP, formatPercentage } from "@/lib/utils";

interface PriceBadgeProps {
  direction?: "UP" | "DOWN" | "UNCHANGED" | null;
  difference?: any;
  percentage?: any;
  showDetails?: boolean;
}

export function PriceBadge({
  direction = "UNCHANGED",
  difference = 0,
  percentage = 0,
  showDetails = false,
}: PriceBadgeProps) {
  const dir = direction || "UNCHANGED";
  const diffNum = Number(difference || 0);
  const pctNum = Number(percentage || 0);

  if (dir === "DOWN") {
    return (
      <div className="inline-flex flex-col items-start">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Precio bajó</span>
        </span>
        {showDetails && (
          <div className="mt-1 text-xs font-mono font-medium text-emerald-400 flex items-center gap-1.5">
            <span>{formatCLP(diffNum)}</span>
            <span className="text-[11px] opacity-80">({formatPercentage(pctNum)})</span>
          </div>
        )}
      </div>
    );
  }

  if (dir === "UP") {
    return (
      <div className="inline-flex flex-col items-start">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Precio aumentó</span>
        </span>
        {showDetails && (
          <div className="mt-1 text-xs font-mono font-medium text-rose-400 flex items-center gap-1.5">
            <span>+{formatCLP(diffNum)}</span>
            <span className="text-[11px] opacity-80">({formatPercentage(pctNum)})</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
      <Minus className="w-3.5 h-3.5" />
      <span>Sin cambios</span>
    </span>
  );
}
