// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

const AUTH_BASE = process.env.AUTH_BASE ?? "http://localhost:8000/auth";
const AUTH_COOKIE = "auth_token";

// Helper para construir respuestas de error consistentes
function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

function getBearerFromCookie(req: NextRequest): string | null {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  return token ? `Bearer ${token}` : null;
}

/**
 * GET /api/users
 * Reenvía a GET http://localhost:8000/auth/users
 * (Backend exige rol admin)
 */
export async function GET(req: NextRequest) {
  const bearer = getBearerFromCookie(req);
  if (!bearer) return jsonError("No autenticado", 401);

  try {
    const res = await fetch(`${AUTH_BASE}/users`, {
      method: "GET",
      headers: {
        Authorization: bearer,
      },
      // Si usas subdominios y necesitas cookies entre servicios, podrías usar credentials: "include"
      // credentials: "include",
    });

    // Propagar estados comunes
    if (res.status === 401) return jsonError("Sesión inválida o expirada", 401);
    if (res.status === 403) return jsonError("Solo administradores pueden ver usuarios", 403);

    if (!res.ok) {
      let msg = res.statusText;
      try {
        const e = await res.json();
        msg = e?.detail || e?.message || msg;
      } catch {}
      return jsonError(msg || "Error listando usuarios", res.status);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return jsonError(e?.message || "Fallo de red al consultar usuarios", 500);
  }
}

/**
 * POST /api/users
 * Body: { username, password, role }
 * Reenvía a POST http://localhost:8000/auth/users
 * (Backend exige rol admin)
 */
export async function POST(req: NextRequest) {
  const bearer = getBearerFromCookie(req);
  if (!bearer) return jsonError("No autenticado", 401);

  let body: { username?: string; password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const { username, password, role } = body || {};
  if (!username?.trim() || !password?.trim() || !role?.trim()) {
    return jsonError("Faltan campos: username, password, role", 400);
  }

  try {
    const res = await fetch(`${AUTH_BASE}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: bearer,
      },
      body: JSON.stringify({ username: username.trim(), password: password.trim(), role: role.trim() }),
    });

    if (res.status === 401) return jsonError("Sesión inválida o expirada", 401);
    if (res.status === 403) return jsonError("Solo administradores pueden crear usuarios", 403);

    if (!res.ok) {
      let msg = res.statusText;
      try {
        const e = await res.json();
        msg = e?.detail || e?.message || msg;
      } catch {}
      return jsonError(msg || "Error creando usuario", res.status);
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return jsonError(e?.message || "Fallo de red al crear usuario", 500);
  }
}
