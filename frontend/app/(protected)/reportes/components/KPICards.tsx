"use client";

const money = (n: number, currency = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function KPICards({
  total,
  count,
  avg,
  currency = "COP",
  loading,
}: {
  total: number;
  count: number;
  avg: number;
  currency?: string;
  loading?: boolean;
}) {
  const items = [
    { label: "Total vendido", value: loading ? "…" : money(total, currency) },
    { label: "Facturas", value: loading ? "…" : String(count) },
    { label: "Ticket promedio", value: loading ? "…" : money(avg, currency) },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">{it.label}</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
