// app/api/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_COOKIE = "auth_token";
const BILLING_BASE = process.env.BILLING_BASE ?? "http://localhost:4003";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}
function getBearer(req: NextRequest): string | null {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  return token ? `Bearer ${token}` : null;
}
async function parseMaybeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch {}
  }
  try { return await res.text(); } catch { return null; }
}

/** -------------------------
 *  POST /api/invoices
 *  (ya lo usas para crear)
 *  Body:
 *   { customer_name, items:[{product_id, quantity}] }
 *   // flexible: admite { cliente, productos:[...] }
 * ------------------------- */
export async function POST(req: NextRequest) {
  const bearer = getBearer(req);
  if (!bearer) return jsonError("No autenticado", 401);

  let body: any;
  try { body = await req.json(); } catch { return jsonError("JSON inválido", 400); }

  const customer_name = String(body?.customer_name ?? body?.cliente ?? "").trim();
  const itemsRaw = body?.items ?? body?.productos ?? [];
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((it: any) => ({
        product_id: String(it?.product_id ?? it?.id ?? "").trim(),
        quantity: Number(it?.quantity ?? it?.qty ?? 0),
      }))
    : [];

  if (!customer_name || !items.length) {
    return jsonError("Faltan campos: customer_name/cliente y items/productos", 400);
  }
  if (items.some((i) => !i.product_id || i.quantity <= 0)) {
    return jsonError("Items inválidos (product_id y quantity > 0)", 400);
  }

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15_000);

    const upstream = await fetch(`${BILLING_BASE}/billing/facturas`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: bearer },
      body: JSON.stringify({ customer_name, items }),
      signal: ac.signal,
    }).catch((e) => { throw new Error(`No se pudo conectar a billing: ${e?.message || e}`); });

    clearTimeout(t);
    const payload = await parseMaybeJson(upstream);

    if (!upstream.ok) {
      const msg =
        (payload && typeof payload === "object" && ("detail" in payload || "message" in payload)
          ? (payload as any).detail || (payload as any).message
          : typeof payload === "string" ? payload : upstream.statusText) || "Error creando factura";
      return jsonError(msg, upstream.status);
    }

    return NextResponse.json(payload, { status: 201 });
  } catch (e: any) {
    return jsonError(e?.message || "Fallo creando factura", 502);
  }
}

/** -------------------------
 *  GET /api/invoices
 *  Query:
 *   from_date=YYYY-MM-DD  (obligatorio)
 *   to_date=YYYY-MM-DD    (obligatorio)
 *   page=1                (opcional)
 *   page_size=50          (opcional)
 *  Respuesta (proxy):
 *   { items:[{invoice_id,customer_name,total,created_at}], total }
 * ------------------------- */
export async function GET(req: NextRequest) {
  const bearer = getBearer(req);
  if (!bearer) return jsonError("No autenticado", 401);

  const { searchParams } = new URL(req.url);
  const from_date = searchParams.get("from_date");
  const to_date = searchParams.get("to_date");
  const page = searchParams.get("page") ?? "1";
  const page_size = searchParams.get("page_size") ?? "50";

  if (!from_date || !to_date) {
    return jsonError("from_date y to_date son requeridos (YYYY-MM-DD)", 400);
  }

  const qs = new URLSearchParams({
    from_date,
    to_date,
    page,
    page_size,
  }).toString();

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15_000);

    const upstream = await fetch(`${BILLING_BASE}/billing/facturas?${qs}`, {
      headers: { Authorization: bearer },
      signal: ac.signal,
    }).catch((e) => { throw new Error(`No se pudo conectar a billing: ${e?.message || e}`); });

    clearTimeout(t);
    const payload = await parseMaybeJson(upstream);

    if (!upstream.ok) {
      const msg =
        (payload && typeof payload === "object" && ("detail" in payload || "message" in payload)
          ? (payload as any).detail || (payload as any).message
          : typeof payload === "string" ? payload : upstream.statusText) || "Error listando facturas";
      return jsonError(msg, upstream.status);
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    return jsonError(e?.message || "Fallo consultando facturas", 502);
  }
}
