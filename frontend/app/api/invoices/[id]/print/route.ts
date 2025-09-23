import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_COOKIE = "auth_token";
const BILLING_BASE =
  process.env.BILLING_BASE ?? "http://localhost:4003";

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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bearer = getBearer(req);
  if (!bearer) return jsonError("No autenticado", 401);

  const id = params?.id;
  if (!id) return jsonError("Falta id de factura", 400);

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);

    const upstream = await fetch(`${BILLING_BASE}/billing/facturas/${id}/imprimir`, {
      method: "POST",
      headers: {
        Authorization: bearer,
        "Content-Type": "application/json",
      },
      signal: ac.signal,
    }).catch((e) => {
      throw new Error(`No se pudo conectar a billing: ${e?.message || e}`);
    });

    clearTimeout(t);

    const payload = await parseMaybeJson(upstream);

    if (!upstream.ok) {
      const msg =
        (payload && typeof payload === "object" && ("detail" in payload || "message" in payload)
          ? (payload as any).detail || (payload as any).message
          : typeof payload === "string"
            ? payload
            : upstream.statusText) || "No se pudo enviar a imprimir";
      return jsonError(msg, upstream.status);
    }

    return NextResponse.json(payload);
  } catch (e: any) {
    return jsonError(e?.message || "Fallo solicitando impresión", 502);
  }
}
