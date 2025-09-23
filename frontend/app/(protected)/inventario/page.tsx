"use client";

import { useEffect, useMemo, useState } from "react";
// (ya no usamos lib/api; ahora pegamos al proxy interno)
// import { getProductos, createProducto } from "@/app/lib/api";
import InventoryForm from "./components/InventoryForm";
import InventoryTable from "./components/InventoryTable";

export type Producto = {
  product_id: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
};

const money = (v: number | string) =>
  (Number(v) || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

// Helpers que llaman a los endpoints internos
async function fetchProductos(): Promise<Producto[]> {
  const res = await fetch("/api/inventory/products", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.message || "Error cargando inventario");
  }
  // Normalizamos por si backend cambia nombres de campos
  const data = await res.json();
  return (data || []).map((p: any) => ({
    product_id: p.product_id ?? p._id ?? p.id ?? "",
    name: p.name ?? p.nombre ?? "",
    price: Number(p.price ?? p.precio ?? 0),
    stock: Number(p.stock ?? 0),
    min_stock: Number(p.min_stock ?? p.stockMin ?? p.stockMinimo ?? 0),
  }));
}

async function postProducto(form: {
  product_id: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
}) {
  const res = await fetch("/api/inventory/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.message || "Error creando producto");
  }
  return res.json();
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean | null }>({ text: "", ok: null });
  const [filtro, setFiltro] = useState("");

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const normalizados = await fetchProductos();
      setProductos(normalizados);
      setMsg({ text: "Inventario cargado", ok: true });
    } catch (e: any) {
      console.error("[inventario] getProductos error:", e);
      setMsg({ text: e?.message || "Error cargando inventario", ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const onCrear = async (form: {
    product_id: string;
    name: string;
    price: number;
    stock: number;
    min_stock: number;
  }) => {
    try {
      await postProducto(form); // proxy interno valida admin en el POST
      setMsg({ text: `Producto ${form.name} creado correctamente`, ok: true });
      await cargarProductos();
      return true;
    } catch (e: any) {
      console.error("[inventario] createProducto error:", e);
      setMsg({ text: e?.message || "Error al crear producto.", ok: false });
      return false;
    }
  };

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.product_id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
    );
  }, [productos, filtro]);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventario</h1>
          <p className="text-sm text-slate-600">Administra productos del catálogo</p>
        </div>

        {/* Buscador simple (opcional, ya tienes estado filtro) */}
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar producto..."
          className="rounded-lg border px-3 py-2 text-sm"
        />
      </header>

      {/* Crear producto (el POST del proxy bloqueará si no eres admin) */}
      <section className="mb-6">
        <InventoryForm onCrear={onCrear} />
      </section>

      {/* Tabla de productos */}
      <section>
        {msg.text ? (
          <p className={`mb-3 text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>
        ) : null}

        <InventoryTable productos={filtrados} loading={loading} money={money} />
      </section>
    </main>
  );
}
