// app/api/logout/route.ts
import { NextResponse } from "next/server";

const AUTH_COOKIE = "auth_token";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
