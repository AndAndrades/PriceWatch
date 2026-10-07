"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatCLP, formatDate } from "@/lib/utils";
import { TrendingDown, TrendingUp, Sparkles, BarChart2 } from "lucide-react";

export interface HistoryDataPoint {
  detectedAt: Date | string;
  price: any;
  previousPrice?: any;
  priceChange?: any;
  priceChangePercentage?: any;
  direction?: "UP" | "DOWN" | "UNCHANGED";
}

interface PriceChartProps {
  histories: HistoryDataPoint[];
  minPrice: any;
  maxPrice: any;
}

export function PriceChart({ histories, minPrice, maxPrice }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "ALL">("ALL");

  if (!histories || histories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No hay datos suficientes para generar el gráfico de historial.
      </div>
    );
  }

  // Filter by selected time range
  const now = new Date().getTime();
  const filteredHistories = histories.filter((h) => {
    if (timeRange === "ALL") return true;
    const time = new Date(h.detectedAt).getTime();
    const diffDays = (now - time) / (1000 * 3600 * 24);
    if (timeRange === "7D") return diffDays <= 7;
    if (timeRange === "30D") return diffDays <= 30;
    if (timeRange === "90D") return diffDays <= 90;
    return true;
  });

  const chartData = [...(filteredHistories.length > 0 ? filteredHistories : histories)]
    .reverse()
    .map((h) => ({
      dateRaw: h.detectedAt,
      dateLabel: new Date(h.detectedAt).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
      }),
      dateTimeLabel: formatDate(h.detectedAt),
      price: Number(h.price),
      direction: h.direction,
    }));

  const pricesNum = chartData.map((d) => d.price);
  const avgPrice = Math.round(pricesNum.reduce((a, b) => a + b, 0) / pricesNum.length);
  const minNum = Number(minPrice);
  const maxNum = Number(maxPrice);
  const padding = Math.max((maxNum - minNum) * 0.12, 5000);

  return (
    <div className="space-y-4">
      {/* SoloTodo Interactive Analytics Header & Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Rango de Análisis</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setTimeRange("7D")}
            className={`px-3 py-1 rounded-md transition-all ${
              timeRange === "7D" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            7 Días
          </button>
          <button
            onClick={() => setTimeRange("30D")}
            className={`px-3 py-1 rounded-md transition-all ${
              timeRange === "30D" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            30 Días
          </button>
          <button
            onClick={() => setTimeRange("90D")}
            className={`px-3 py-1 rounded-md transition-all ${
              timeRange === "90D" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            90 Días
          </button>
          <button
            onClick={() => setTimeRange("ALL")}
            className={`px-3 py-1 rounded-md transition-all ${
              timeRange === "ALL" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Historial Completo
          </button>
        </div>
      </div>

      {/* SoloTodo Price Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Precio Promedio
          </span>
          <span className="text-base font-bold font-mono text-cyan-400 block mt-0.5">
            {formatCLP(avgPrice)}
          </span>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Mínimo Histórico
          </span>
          <span className="text-base font-bold font-mono text-emerald-400 block mt-0.5">
            {formatCLP(minNum)}
          </span>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Máximo Histórico
          </span>
          <span className="text-base font-bold font-mono text-rose-400 block mt-0.5">
            {formatCLP(maxNum)}
          </span>
        </div>
      </div>

      {/* Recharts Interactive Chart */}
      <div className="w-full h-80 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="priceLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              domain={[Math.max(0, minNum - padding), maxNum + padding]}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-card rounded-xl p-3 shadow-2xl border border-cyan-500/30 text-xs">
                      <p className="text-slate-400 mb-1">{data.dateTimeLabel}</p>
                      <p className="font-mono font-extrabold text-base text-cyan-300">{formatCLP(data.price)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={minNum}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{ value: `Mín: ${formatCLP(minNum)}`, fill: "#10b981", fontSize: 10, position: "insideBottomRight" }}
            />
            <ReferenceLine
              y={maxNum}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: `Máx: ${formatCLP(maxNum)}`, fill: "#ef4444", fontSize: 10, position: "insideTopRight" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="url(#priceLineGrad)"
              strokeWidth={3}
              dot={{ r: 5, fill: "#06b6d4", stroke: "#0f172a", strokeWidth: 2 }}
              activeDot={{ r: 8, fill: "#10b981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
