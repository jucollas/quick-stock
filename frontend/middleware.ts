// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "auth_token";

// rutas públicas (no autenticadas)
const PUBLIC_ROUTES = [
  "/login",
  "/favicon.ico",
  "/logo-main.png",
  "/robots.txt",
  "/sitemap.xml",
  "/_next",   // assets de Next
  "/public",  // estáticos
];

const ADMIN_ONLY_PREFIXES = [
  "/inventario",
  "/usuarios",
  // agrega más prefijos aquí
];

// helper para saber si un path es público
function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p));
}

/**
 * Decodifica el payload de un JWT en Edge Runtime (sin Buffer).
 * No verifica firma; solo lee claims como exp/role.
 */
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    // base64url -> base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // atob devuelve string latin1; convertimos a UTF-8 seguro
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder("utf-8").decode(bytes);

    return JSON.parse(json); // { id, role, exp, iat, iss, ... }
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  // 1) Permitir rutas públicas siempre
  if (isPublicPath(pathname)) {
    // Si ya está autenticado y entra a /login → redirigir a /
    if (pathname === "/login" && token) {
      const payload = decodeJwtPayload(token);
      const now = Math.floor(Date.now() / 1000);
      if (payload?.exp && payload.exp > now) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // 2) Rutas protegidas: requieren token
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
    return NextResponse.redirect(url);
  }

  const payload = decodeJwtPayload(token);
  const now = Math.floor(Date.now() / 1000);

  // 2.1) Token inválido o expirado → limpiar cookie y mandar a /login
  if (!payload?.exp || payload.exp <= now) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;

    const res = NextResponse.redirect(url);
    res.cookies.set(AUTH_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
    return res;
  }

  if (ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (payload?.role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Aplica a todo excepto /api (si también quieres proteger APIs internas, añade sus matchers)
export const config = {
  matcher: ["/((?!api).*)"],
};
