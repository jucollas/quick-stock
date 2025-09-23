"use client";

type Props = {
  fromDate: string;
  toDate: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export default function DateRange({
  fromDate,
  toDate,
  onChangeFrom,
  onChangeTo,
  onSubmit,
  loading,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Desde</label>
          <input
            type="date"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={fromDate}
            onChange={(e) => onChangeFrom(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
          <input
            type="date"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={toDate}
            onChange={(e) => onChangeTo(e.target.value)}
          />
        </div>
        <div className="sm:col-span-1 flex items-end">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand-2)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Cargando..." : "Aplicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
