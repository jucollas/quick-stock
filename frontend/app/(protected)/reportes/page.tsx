"use client";

import { useEffect, useMemo, useState } from "react";
import DateRange from "./components/DateRange";
import KPICards from "./components/KPICards";
import SalesChart from "./components/SalesChart";
import SalesTable from "./components/SalesTable";
import ExportCSV from "./components/ExportCSV";

export type SalesDay = {
  date: string;      // "YYYY-MM-DD"
  total: number;     // suma del día
  count: number;     // # facturas
  avg_ticket: number;
};

export type SalesDailyResponse = {
  from_date: string;
  to_date: string;
  currency: string; // e.g. "COP"
  days: SalesDay[];
  summary: { total: number; count: number; avg_ticket: number };
};

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const today = new Date();
const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

export default function ReportesPage() {
  const [fromDate, setFromDate] = useState(toISO(weekAgo));
  const [toDate, setToDate] = useState(toISO(today));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalesDailyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ from_date: fromDate, to_date: toDate }).toString();
      const res = await fetch(`/api/reports/sales-daily?${qs}`, { cache: "no-store" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({} as any));
        throw new Error(e?.message || "Error obteniendo reporte");
      }
      const json = (await res.json()) as SalesDailyResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message || "No se pudo obtener el reporte");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = useMemo(() => {
    if (!data) return null;
    return {
      total: data.summary.total,
      count: data.summary.count,
      avg: data.summary.avg_ticket,
      currency: data.currency || "COP",
    };
  }, [data]);

  return (
    <main className="mx-auto max-w-7xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Reporte de Ventas</h1>
        <p className="text-sm text-slate-600">Ventas diarias entre dos fechas</p>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <DateRange
          fromDate={fromDate}
          toDate={toDate}
          onChangeFrom={setFromDate}
          onChangeTo={setToDate}
          onSubmit={loadData}
          loading={loading}
        />
        <ExportCSV
          filename={`reporte_ventas_${fromDate}_a_${toDate}.csv`}
          days={data?.days ?? []}
        />
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <KPICards
            total={kpis?.total ?? 0}
            count={kpis?.count ?? 0}
            avg={kpis?.avg ?? 0}
            currency={kpis?.currency ?? "COP"}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-2">
          <SalesChart
            days={data?.days ?? []}
            currency={data?.currency ?? "COP"}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-1">
          <SalesTable
            days={data?.days ?? []}
            currency={data?.currency ?? "COP"}
            loading={loading}
          />
        </div>
      </section>
    </main>
  );
}
