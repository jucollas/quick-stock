"use client";
import Image from "next/image";
import { useInvoice, useInvoiceTotals } from "./InvoiceContext";


export default function InvoicePreview() {
const { state } = useInvoice();
const { subtotal, tax, total, currency } = useInvoiceTotals(state);


return (
<div className="rounded-2xl border bg-white shadow-sm print:shadow-none">
{/* Cabecera imprimible */}
<div className="flex items-center justify-between gap-4 border-b p-4">
<div className="flex items-center gap-3">
<div className="relative h-10 w-10 overflow-hidden rounded-lg ring-1" style={{ borderColor: "var(--border)" }}>
<Image src="/logo-main.png" alt="Logo" fill sizes="40px" className="object-contain" />
</div>
<div>
<h3 className="text-base font-semibold">Factura</h3>
<p className="text-xs text-slate-500">{state.invoiceId ?? "(sin id)"} • {state.date}</p>
</div>
</div>
<div className="text-right">
<p className="text-xs text-slate-500">Tienda Admin</p>
<p className="text-xs text-slate-500">Colombia</p>
</div>
</div>


{/* Datos cliente/vendedor */}
<div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
<div>
<h4 className="text-sm font-semibold">Cliente</h4>
<p className="text-sm">{state.customer.name || "—"}</p>
<p className="text-xs text-slate-500">Doc: {state.customer.document || "—"}</p>
<p className="text-xs text-slate-500">Tel: {state.customer.phone || "—"}</p>
<p className="text-xs text-slate-500">Email: {state.customer.email || "—"}</p>
<p className="text-xs text-slate-500">Dir: {state.customer.address || "—"}</p>
</div>
<div>
<h4 className="text-sm font-semibold">Vendedor</h4>
<p className="text-sm">{state.seller.name || "—"}</p>
<p className="text-xs text-slate-500">ID: {state.seller.document || "—"}</p>
<p className="text-xs text-slate-500">Email: {state.seller.email || "—"}</p>
</div>
</div>


{/* Tabla imprimible */}
<div className="overflow-x-auto p-4">
<table className="min-w-full text-sm">
<thead>
<tr className="text-left text-slate-500">
<th className="px-3 py-2">Producto</th>
<th className="px-3 py-2">Cantidad</th>
<th className="px-3 py-2">Precio</th>
<th className="px-3 py-2">Subtotal</th>
</tr>
</thead>
<tbody>
{state.items.length === 0 ? (
<tr>
<td className="px-3 py-8 text-center text-slate-400" colSpan={4}>
Sin productos
</td>
</tr>
) : (
state.items.map((i) => (
<tr key={i.id} className="border-t">
<td className="px-3 py-2">{i.name}</td>
<td className="px-3 py-2">{i.quantity}</td>
<td className="px-3 py-2">{currency(i.price)}</td>
<td className="px-3 py-2 font-medium">{currency(i.quantity * i.price)}</td>
</tr>
))
)}
</tbody>
</table>
</div>

{/* Totales imprimibles */}
<div className="flex items-center justify-end gap-8 border-t p-4 text-sm">
<div className="space-y-1">
<div className="flex items-center justify-between gap-8">
<span className="text-slate-600">Subtotal</span>
<span className="font-medium">{currency(subtotal)}</span>
</div>
<div className="flex items-center justify-between gap-8">
<span className="text-slate-600">IVA</span>
<span className="font-medium">{currency(tax)}</span>
</div>
<div className="flex items-center justify-between gap-8 border-t pt-2 text-base">
<span className="font-semibold">Total</span>
<span className="font-semibold">{currency(total)}</span>
</div>
</div>
</div>
</div>
);
}