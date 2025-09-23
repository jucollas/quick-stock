"use client";
import { useInvoice, useInvoiceTotals } from "./InvoiceContext";


export default function Totals() {
const { state, dispatch } = useInvoice();
const { subtotal, tax, total, currency } = useInvoiceTotals(state);


return (
<div className="card">
<h2 className="mb-3 text-base font-semibold">Resumen</h2>
<div className="space-y-2 text-sm">
<div className="flex items-center justify-between">
<span className="text-slate-600">Subtotal</span>
<span className="font-medium">{currency(subtotal)}</span>
</div>
<div className="flex items-center justify-between">
<label className="text-slate-600" htmlFor="tax">IVA (%)</label>
<input
id="tax"
type="number"
min={0}
step={1}
className="w-24 rounded-lg border p-2 text-right"
value={Math.round(state.taxRate * 100)}
onChange={(e) => dispatch({ type: "SET_TAX", payload: Number(e.target.value) / 100 })}
/>
</div>
<div className="flex items-center justify-between">
<span className="text-slate-600">IVA</span>
<span className="font-medium">{currency(tax)}</span>
</div>
<div className="flex items-center justify-between border-t pt-2 text-base">
<span className="font-semibold">Total</span>
<span className="font-semibold">{currency(total)}</span>
</div>
</div>
</div>
);
}