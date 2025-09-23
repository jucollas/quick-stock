import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRINT_BASE = process.env.PRINT_BASE ?? "http://print-service:4004";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { invoice_id: string } }
) {
  const { invoice_id } = params;
  if (!invoice_id) return jsonError("Falta invoice_id en la ruta", 400);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const invoice = body?.invoice;
  if (!invoice || typeof invoice !== "object") {
    return jsonError("Cuerpo inválido: se requiere { invoice: {...} }", 400);
  }

  try {
    const upstream = await fetch(`${PRINT_BASE}/print/factura/${encodeURIComponent(invoice_id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice }),
    });

    if (!upstream.ok) {
      let msg = upstream.statusText;
      try {
        const e = await upstream.json();
        msg = e?.message || msg;
      } catch {}
      return jsonError(msg || "Error en impresión", upstream.status);
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return jsonError(e?.message || "No se pudo contactar al Print Service", 502);
  }
}
