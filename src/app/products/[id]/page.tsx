import { ProductService } from "@/services/product.service";
import { Navbar } from "@/components/layout/Navbar";
import { PriceBadge } from "@/components/ui/Badge";
import { PriceChart } from "@/components/products/PriceChart";
import { formatCLP, formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingDown,
  TrendingUp,
  History,
  Activity,
} from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await ProductService.getProductById(id);

  if (!product) {
    notFound();
  }

  const currentPriceNum = Number(product.currentPrice);
  const minPriceNum = Number(product.minPrice);
  const maxPriceNum = Number(product.maxPrice);
  const diffFromMin = currentPriceNum - minPriceNum;

  const latestHistory = product.histories[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Link>
        </div>

        {/* Top Product Hero */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Image */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full max-w-sm aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center p-6 relative">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="object-contain max-h-72 w-auto"
                  unoptimized
                />
              ) : (
                <div className="text-slate-500 font-bold text-sm">Sin Imagen Disponible</div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <PriceBadge
                  direction={latestHistory?.direction}
                  difference={latestHistory?.priceChange}
                  percentage={latestHistory?.priceChangePercentage}
                  showDetails
                />

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    product.inStock
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {product.inStock ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{product.inStock ? "Disponible" : "Sin Stock"}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{product.name}</h1>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Actualizado: {formatDate(product.lastUpdatedAt)}
                </span>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                >
                  <span>Ver en Falabella</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Price Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Precio Actual
                </span>
                <span className="text-xl font-extrabold font-mono text-white block mt-1">
                  {formatCLP(product.currentPrice)}
                </span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Precio Anterior
                </span>
                <span className="text-lg font-bold font-mono text-slate-400 block mt-1">
                  {product.previousPrice ? formatCLP(product.previousPrice) : "-"}
                </span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Mín. Histórico
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400 block mt-1">
                  {formatCLP(product.minPrice)}
                </span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Máx. Histórico
                </span>
                <span className="text-lg font-bold font-mono text-rose-400 block mt-1">
                  {formatCLP(product.maxPrice)}
                </span>
              </div>
            </div>

            {/* Difference vs Historical Min */}
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs flex items-center justify-between">
              <span className="text-slate-300">Diferencia respecto al precio mínimo histórico:</span>
              <span className={`font-mono font-bold ${diffFromMin === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                {diffFromMin === 0 ? "En el mínimo histórico 🎯" : `+${formatCLP(diffFromMin)} sobre el mínimo`}
              </span>
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Gráfico de Historial de Precios</h2>
          </div>
          <PriceChart histories={product.histories} minPrice={product.minPrice} maxPrice={product.maxPrice} />
        </div>

        {/* Recorded Price Changes Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Registro Estricto de Cambios de Precio</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Fecha de Detección</th>
                  <th className="py-3 px-4">Precio Registrado</th>
                  <th className="py-3 px-4">Precio Anterior</th>
                  <th className="py-3 px-4">Variación Moneda</th>
                  <th className="py-3 px-4">Variación Porcentual</th>
                  <th className="py-3 px-4">Dirección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {product.histories.map((h) => {
                  const isUp = h.direction === "UP";
                  const isDown = h.direction === "DOWN";
                  return (
                    <tr key={h.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-sans">{formatDate(h.detectedAt)}</td>
                      <td className="py-3 px-4 font-bold text-white">{formatCLP(h.price)}</td>
                      <td className="py-3 px-4 text-slate-400">{h.previousPrice ? formatCLP(h.previousPrice) : "-"}</td>
                      <td
                        className={`py-3 px-4 font-bold ${
                          isDown ? "text-emerald-400" : isUp ? "text-rose-400" : "text-slate-400"
                        }`}
                      >
                        {isUp ? `+${formatCLP(h.priceChange)}` : formatCLP(h.priceChange)}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold ${
                          isDown ? "text-emerald-400" : isUp ? "text-rose-400" : "text-slate-400"
                        }`}
                      >
                        {isUp ? `+${Number(h.priceChangePercentage)}%` : `${Number(h.priceChangePercentage)}%`}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <PriceBadge direction={h.direction} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scrape Execution Logs */}
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-base font-bold text-white tracking-tight">Historial de Ejecuciones de Scraping</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ejecutado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Precio Encontrado</th>
                  <th className="py-3 px-4">Duración</th>
                  <th className="py-3 px-4">Mensaje de Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-400 font-mono">
                {product.scrapeLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 px-4 font-sans">{formatDate(log.executedAt)}</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-white">{log.priceFound ? formatCLP(log.priceFound) : "-"}</td>
                    <td className="py-2.5 px-4">{log.durationMs}ms</td>
                    <td className="py-2.5 px-4 text-rose-400 font-sans truncate max-w-xs">{log.errorMessage || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
