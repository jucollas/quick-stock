"use client";

import { Producto } from "@/app/inventario/page";
import { Loader2 } from "lucide-react";

export default function InventoryTable({
  productos,
  loading,
  money,
}: {
  productos: Producto[];
  loading: boolean;
  money: (v: number | string) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-2">Código</th>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2 text-right">Precio</th>
            <th className="px-4 py-2 text-right">Stock</th>
            <th className="px-4 py-2 text-right">Stock mínimo</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                Cargando inventario…
              </td>
            </tr>
          ) : productos.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                No hay productos para mostrar.
              </td>
            </tr>
          ) : (
            productos.map((p) => (
              <tr key={p.product_id} className="border-t border-slate-100">
                <td className="px-4 py-2">{p.product_id}</td>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-right">{money(p.price)}</td>
                <td className="px-4 py-2 text-right">{p.stock}</td>
                <td className="px-4 py-2 text-right">{p.min_stock}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
