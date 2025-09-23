"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useInvoice } from "./InvoiceContext";
import type { Producto } from "./InvoiceContext";

// Helper: trae productos desde el proxy interno
async function fetchProductos(): Promise<Producto[]> {
  const res = await fetch("/api/inventory/products", { method: "GET" });
  if (!res.ok) {
    let msg = "Error cargando inventario";
    try {
      const e = await res.json();
      msg = e?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  // Normaliza por si cambia algún nombre en el backend
  return (data || []).map((p: any) => ({
    product_id: p.product_id ?? p.id ?? "",
    name: p.name ?? "",
    price: Number(p.price ?? 0),
  }));
}

export default function ProductForm() {
  const { state, dispatch, addItemFromProduct } = useInvoice();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const prods = await fetchProductos();
        dispatch({ type: "SET_PRODUCTS", payload: prods });
        if (prods.length) setSelected(prods[0].product_id);
      } catch (err: unknown) {
        console.error("[ProductForm] fetchProductos error:", err);
        alert("⚠️ Error al cargar productos");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  const producto: Producto | undefined = state.products.find(
    (p) => p.product_id === selected
  );

  const handleAdd = () => {
    if (!producto) return;
    addItemFromProduct(producto, qty);
    setQty(1);
  };

  return (
    <div className="card">
      <h2 className="mb-3 text-base font-semibold">Agregar producto</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <select
          className="sm:col-span-2 rounded-xl border p-2 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={loading || state.products.length === 0}
        >
          {state.products.map((p: Producto) => (
            <option key={p.product_id} value={p.product_id}>
              {p.name} —{" "}
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              }).format(p.price)}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="rounded-xl border p-2 text-sm"
          placeholder="Cantidad"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />

        <input
          readOnly
          className="rounded-xl border bg-slate-50 p-2 text-sm"
          value={producto ? producto.product_id : ""}
          aria-label="Código del producto"
        />

        <button
          onClick={handleAdd}
          className="btn btn-brand"
          disabled={!producto || loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Cargando..." : "Agregar"}
        </button>
      </div>

      {loading && (
        <p className="mt-2 text-xs text-slate-500">
          Cargando productos del inventario...
        </p>
      )}
    </div>
  );
}
