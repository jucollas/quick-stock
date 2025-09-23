// app/api/inventory/products/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_COOKIE = "auth_token";
// En Docker Compose usa: INVENTORY_BASE=http://inventory-service:8001/inventory
const INVENTORY_BASE = process.env.INVENTORY_BASE ?? "http://localhost:8001/inventory";

/* ---------- utils ---------- */

function base64urlToJson(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(b64, "base64").toString("utf-8");
  return JSON.parse(json);
}

function decodeJwtPayload(token?: string): any | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return base64urlToJson(parts[1]); // { id, role, exp, ... }
  } catch {
    return null;
  }
}

async function parseMaybeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch {}
  }
  try { return await res.text(); } catch { return null; }
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

/* ---------- GET /api/inventory/products ---------- */
/* Lista productos. Si hay token, lo reenvía como Bearer (no es obligatorio para tu backend). */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value;

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 10_000);

    const upstream = await fetch(`${INVENTORY_BASE}/products`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: ac.signal,
    }).catch((e) => {
      throw new Error(`Conexión con Inventory: ${e?.message || e}`);
    });
    clearTimeout(t);

    const payload = await parseMaybeJson(upstream);
    if (!upstream.ok) {
      const msg =
        (payload && typeof payload === "object" && ("detail" in payload || "message" in payload)
          ? (payload as any).detail || (payload as any).message
          : typeof payload === "string"
            ? payload
            : upstream.statusText) || "Error listando productos";
      return jsonError(msg, upstream.status);
    }

    return NextResponse.json(payload);
  } catch (e: any) {
    return jsonError(e?.message || "No se pudo consultar inventario", 502);
  }
}

/* ---------- POST /api/inventory/products ---------- */
/* Crea producto. Requiere JWT y rol admin (chequeo local) antes de llamar al microservicio. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return jsonError("No autenticado", 401);

  // Chequeo local de rol admin (UX y ahorro de hop). El backend también valida.
  const payload = decodeJwtPayload(token);
  const role = payload?.role as string | undefined;
  if (role !== "admin") return jsonError("Solo administradores pueden crear productos", 403);

  let body: {
    product_id?: string;
    name?: string;
    price?: number;
    stock?: number;
    min_stock?: number;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const { product_id, name, price, stock, min_stock } = body || {};
  if (!product_id?.trim() || !name?.trim() || price == null || stock == null || min_stock == null) {
    return jsonError("Faltan campos: product_id, name, price, stock, min_stock", 400);
  }

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 10_000);

    const upstream = await fetch(`${INVENTORY_BASE}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // el backend tiene verify_admin
      },
      body: JSON.stringify({
        product_id: product_id.trim(),
        name: name.trim(),
        price,
        stock,
        min_stock,
      }),
      signal: ac.signal,
    }).catch((e) => {
      throw new Error(`Conexión con Inventory: ${e?.message || e}`);
    });
    clearTimeout(t);

    const payload = await parseMaybeJson(upstream);

    if (!upstream.ok) {
      const msg =
        (payload && typeof payload === "object" && ("detail" in payload || "message" in payload)
          ? (payload as any).detail || (payload as any).message
          : typeof payload === "string"
            ? payload
            : upstream.statusText) || "Error creando producto";
      return jsonError(msg, upstream.status);
    }

    // 201 esperado (ProductOut)
    return NextResponse.json(payload, { status: 201 });
  } catch (e: any) {
    return jsonError(e?.message || "No se pudo crear el producto", 502);
  }
}
