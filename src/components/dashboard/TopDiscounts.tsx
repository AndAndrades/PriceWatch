import Link from "next/link";
import Image from "next/image";
import { TrendingDown, ArrowRight } from "lucide-react";
import { formatCLP } from "@/lib/utils";

interface TopDiscountItem {
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    currentPrice: number | string;
    maxPrice: number | string;
  };
  discountAmount: number;
  discountPercentage: number;
}

interface TopDiscountsProps {
  discounts: TopDiscountItem[];
}

export function TopDiscounts({ discounts }: TopDiscountsProps) {
  if (!discounts || discounts.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingDown className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Mayores Descuentos Detectados</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {discounts.map(({ product, discountAmount, discountPercentage }) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="object-contain p-1 w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-[9px] text-slate-500 font-bold">PROD</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-blue-400 transition-colors">
                {product.name}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {formatCLP(product.currentPrice)}
                </span>
                <span className="text-[11px] font-mono text-slate-500 line-through">
                  {formatCLP(product.maxPrice)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {discountPercentage}%
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">-{formatCLP(discountAmount)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
