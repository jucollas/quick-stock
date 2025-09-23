// app/api/login/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";                // 👈 fuerza Node runtime (por si acaso)
export const dynamic = "force-dynamic";         // 👈 evita cache estático

const AUTH_COOKIE = "auth_token";
const AUTH_BASE = process.env.AUTH_BASE ?? "http://localhost:8000/auth";

// pequeño parser
async function parseMaybeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch {}
  }
  try { return await res.text(); } catch { return null; }
}

export async function POST(req: Request) {
  try {
    console.log("[/api/login] AUTH_BASE:", AUTH_BASE); // 👈 log útil

    let body: { username?: string; password?: string; next?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, message: "JSON inválido" }, { status: 400 });
    }

    const { username, password } = body || {};
    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ ok: false, message: "Faltan username y/o password" }, { status: 400 });
    }

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 10_000);

    let upstream: Response;
    try {
      upstream = await fetch(`${AUTH_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
        signal: ac.signal,
      });
    } catch (e: any) {
      clearTimeout(timeout);
      console.error("[/api/login] Error de red hacia AUTH_BASE:", e?.message || e);
      return NextResponse.json(
        { ok: false, message: "No se pudo conectar con el servicio de autenticación" },
        { status: 502 }
      );
    }
    clearTimeout(timeout);

    const payload = await parseMaybeJson(upstream);

    if (!upstream.ok) {
      const message =
        (payload && typeof payload === "object" && ("detail" in payload || "message" in payload)
          ? (payload as any).detail || (payload as any).message
          : typeof payload === "string"
            ? payload
            : upstream.statusText) || "Error autenticando";
      console.error("[/api/login] Backend devolvió error:", upstream.status, message);
      return NextResponse.json({ ok: false, message }, { status: upstream.status });
    }

    const access_token =
      (payload && typeof payload === "object" ? (payload as any).access_token : null) ?? null;

    if (!access_token) {
      console.error("[/api/login] Respuesta sin access_token:", payload);
      return NextResponse.json({ ok: false, message: "Token no recibido del backend" }, { status: 500 });
    }

    const maxAge =
      (payload && typeof payload === "object" ? (payload as any).expires_in : null) ?? 2 * 60 * 60;

    const resp = NextResponse.json({ ok: true, expires_in: maxAge });
    resp.cookies.set(AUTH_COOKIE, access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // en prod: true
      path: "/",
      maxAge,
    });

    return resp;
  } catch (e: any) {
    console.error("[/api/login] Error inesperado:", e?.stack || e?.message || e);
    return NextResponse.json({ ok: false, message: "Error de login" }, { status: 500 });
  }
}
