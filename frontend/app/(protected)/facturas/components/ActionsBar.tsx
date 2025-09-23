"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInvoice } from "./InvoiceContext";
import { Printer, Eraser, Hash, FileText } from "lucide-react";

/** Helper: crear factura vía proxy interno */
async function postInvoice(payload: {
  customer_name: string;
  items: { product_id: string; quantity: number }[];
}) {
  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = res.statusText || "Error creando factura";
    try {
      const e = await res.json();
      msg = e?.message || e?.detail || msg;
    } catch {}
    const err = new Error(msg);
    (err as any).status = res.status;
    throw err;
  }

  return res.json() as Promise<{
    invoice_id: string;
    reservation_id: string;
    total: number;
    items: Array<{ product_id: string; quantity: number; unit_price: number; subtotal: number }>;
    /** opcional si tu /api/invoices ya invoca printing y devuelve url */
    pdf_url?: string; // p.ej. "/files/fac-123.pdf"
  }>;
}

export default function ActionsBar() {
  const { dispatch, generateId, state } = useInvoice();
  const [lastPdfUrl, setLastPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveInvoice = async () => {
    if (!state.items.length) {
      alert("⚠️ Agrega al menos un producto");
      return { ok: false, pdfUrl: null as string | null };
    }
    if (!state.customer.name?.trim()) {
      alert("⚠️ Ingresa el nombre del cliente");
      return { ok: false, pdfUrl: null as string | null };
    }

    const items = state.items.map((it) => {
      if (!it.productId) {
        alert("⚠️ Hay ítems sin productId. Agrega desde el selector de inventario o mapea productId manualmente.");
      }
      return { product_id: it.productId ?? it.id, quantity: it.quantity };
    });

    try {
      setBusy(true);
      const resp = await postInvoice({
        customer_name: state.customer.name.trim(),
        items,
      });

      if (resp?.invoice_id) {
        dispatch({ type: "GENERATE_ID", payload: String(resp.invoice_id) });
      } else if (!state.invoiceId) {
        generateId();
      }

      // Si el backend retornó pdf_url, la proxificamos para abrirla en este dominio
      let proxiedUrl: string | null = null;
      if (resp?.pdf_url && resp.pdf_url.startsWith("/")) {
        proxiedUrl = "/api/print" + resp.pdf_url; // => /api/print/files/...
        setLastPdfUrl(proxiedUrl);
      } else {
        setLastPdfUrl(null);
      }

      alert("✅ Factura guardada correctamente");
      return { ok: true, pdfUrl: proxiedUrl };
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const msg = (err?.message || "").toLowerCase();

      if (status === 409 || msg.includes("insuficiente") || msg.includes("stock")) {
        alert("❌ Stock insuficiente. Ajusta las cantidades.");
      } else {
        alert("❌ No se pudo guardar la factura.\n" + (err?.message || ""));
      }
      return { ok: false, pdfUrl: null as string | null };
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async () => {
    const { ok, pdfUrl } = await saveInvoice();
    if (ok && pdfUrl) {
      // Abre el PDF generado por el servicio de impresión (vía proxy)
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } else if (ok && !pdfUrl) {
      // Respaldo: si aún no integraste printing en /api/invoices, usar impresión del navegador
      setTimeout(() => window.print(), 50);
    }
  };

  const handleClear = () => {
    const ok = confirm("¿Seguro que deseas limpiar la factura actual?");
    if (ok) dispatch({ type: "CLEAR" });
  };

  return (
    <div className="card flex flex-col gap-2">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handlePrint}
        className="btn btn-brand disabled:opacity-60"
        disabled={busy}
      >
        <Printer className="h-4 w-4" />
        {busy ? "Guardando..." : "Guardar e imprimir"}
      </motion.button>

      {lastPdfUrl && (
        <a
          href={lastPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost inline-flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Ver PDF
        </a>
      )}

      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={generateId}
          className="btn flex-1 btn-ghost"
        >
          <Hash className="h-4 w-4" />
          Generar ID
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleClear}
          className="btn btn-ghost flex-1"
        >
          <Eraser className="h-4 w-4" /> Limpiar
        </motion.button>
      </div>

      <p className="text-xs text-slate-500">
        Nota: “Guardar e imprimir” crea la factura (vía /api/invoices). Si el backend devuelve un PDF,
        lo abrimos desde <code>/api/print/files/…</code>. Si no, usamos el diálogo de impresión del navegador.
      </p>
    </div>
  );
}
