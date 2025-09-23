"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { SalesDay } from "../page";

const moneyShort = (n: number) =>
  new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n || 0);

export default function SalesChart({
  days,
  currency = "COP",
  loading,
}: {
  days: SalesDay[];
  currency?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 text-sm font-medium text-slate-700">Ventas por día</div>
      <div className="h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Cargando…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={days}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-2)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--brand-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={moneyShort} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: any) =>
                  new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                  }).format(Number(v))
                }
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--brand-2)"
                fill="url(#g1)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
