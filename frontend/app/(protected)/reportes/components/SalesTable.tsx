"use client";

import type { SalesDay } from "../page";

const money = (n: number, currency = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function SalesTable({
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
      <div className="mb-2 text-sm font-medium text-slate-700">Detalle por día</div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : days.length === 0 ? (
        <p className="text-sm text-slate-500">Sin datos en el rango seleccionado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2 text-right">Facturas</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Ticket promedio</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date} className="border-t border-slate-100">
                  <td className="px-3 py-2">{d.date}</td>
                  <td className="px-3 py-2 text-right">{d.count}</td>
                  <td className="px-3 py-2 text-right">{money(d.total, currency)}</td>
                  <td className="px-3 py-2 text-right">{money(d.avg_ticket, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
