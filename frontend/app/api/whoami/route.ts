// app/api/whoami/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_COOKIE = "auth_token";
const AUTH_BASE = process.env.AUTH_BASE ?? "http://localhost:8000/auth";

async function parseMaybeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch {}
  }
  try { return await res.text(); } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    // Llamamos al backend usando AUTH_BASE del entorno (en docker: http://auth-service:8000/auth)
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 10_000);

    let upstream: Response;
    try {
      upstream = await fetch(`${AUTH_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ac.signal,
      });
    } catch (e: any) {
      clearTimeout(t);
      console.error("[/api/whoami] Error de red hacia AUTH_BASE:", e?.message || e);
      return NextResponse.json(
        { message: "No se pudo conectar con el servicio de autenticación" },
        { status: 502 }
      );
    }
    clearTimeout(t);

    const payload = await parseMaybeJson(upstream);

    if (!upstream.ok) {
      const message =
        (payload && typeof payload === "object" && ("detail" in payload || "message" in payload)
          ? (payload as any).detail || (payload as any).message
          : typeof payload === "string"
            ? payload
            : upstream.statusText) || "Error autenticando";
      return NextResponse.json({ message }, { status: upstream.status });
    }

    // Backend devuelve { id, username, roles:[role] }
    const me = payload as any;
    return NextResponse.json({
      id: me?.id,
      username: me?.username,
      role: me?.role ?? me?.roles?.[0] ?? "user",
    });
  } catch (e: any) {
    console.error("[/api/whoami] Error inesperado:", e?.stack || e?.message || e);
    return NextResponse.json({ message: "Error en whoami" }, { status: 500 });
  }
}
