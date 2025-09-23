"use client";

import type { SalesDay } from "../page";

function toCSV(rows: Array<Record<string, any>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) =>
    `"${String(v ?? "").replaceAll('"', '""')}"`;
  const head = headers.map(escape).join(",");
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(",")).join("\n");
  return `${head}\n${body}\n`;
}

export default function ExportCSV({
  filename,
  days,
}: {
  filename: string;
  days: SalesDay[];
}) {
  const handleDownload = () => {
    const rows = days.map((d) => ({
      date: d.date,
      total: d.total,
      count: d.count,
      avg_ticket: d.avg_ticket,
    }));
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "reporte.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      disabled={!days.length}
      title={!days.length ? "Sin datos" : "Descargar CSV"}
    >
      Descargar CSV
    </button>
  );
}
