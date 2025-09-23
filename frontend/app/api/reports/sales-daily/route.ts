// app/api/reports/sales-daily/route.ts
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

/**
 * GET /api/reports/sales-daily?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
 * Respuesta (proxy de /billing/report/ventas-diarias):
 * {
 *   from_date, to_date, currency, days:[{date,total,count,avg_ticket}], summary:{total,count,avg_ticket}
 * }
 */
export async function GET(req: NextRequest) {
  const bearer = getBearer(req);
  if (!bearer) return jsonError("No autenticado", 401);

  const { searchParams } = new URL(req.url);
  const from_date = searchParams.get("from_date");
  const to_date = searchParams.get("to_date");

  if (!from_date || !to_date) {
    return jsonError("from_date y to_date son requeridos (YYYY-MM-DD)", 400);
  }

  const qs = new URLSearchParams({ from_date, to_date }).toString();

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15_000);

    const upstream = await fetch(`${BILLING_BASE}/billing/report/ventas-diarias?${qs}`, {
      headers: { Authorization: bearer },
      signal: ac.signal,
    }).catch((e) => { throw new Error(`No se pudo conectar a billing: ${e?.message || e}`); });

    clearTimeout(t);
    const payload = await parseMaybeJson(upstream);

    if (!upstream.ok) {
      const msg =
        (payload && typeof payload === "object" && ("detail" in payload || "message" in payload)
          ? (payload as any).detail || (payload as any).message
          : typeof payload === "string" ? payload : upstream.statusText) || "Error obteniendo reporte";
      return jsonError(msg, upstream.status);
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    return jsonError(e?.message || "Fallo consultando reporte", 502);
  }
}
