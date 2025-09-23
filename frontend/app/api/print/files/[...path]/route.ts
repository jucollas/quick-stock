import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRINT_BASE = process.env.PRINT_BASE ?? "http://print-service:4004";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path || [];
  if (segments.length === 0) return jsonError("Ruta de archivo no especificada", 400);

  const upstreamUrl = `${PRINT_BASE}/files/${segments.map(encodeURIComponent).join("/")}`;

  try {
    const upstream = await fetch(upstreamUrl);
    if (!upstream.ok) {
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") || "application/octet-stream",
        },
      });
    }

    // Propaga content-type y soporta streaming
    const headers = new Headers();
    const ct = upstream.headers.get("content-type");
    if (ct) headers.set("content-type", ct);

    // Opcional: sugerir descarga (o comentar para ver en browser)
    // headers.set("content-disposition", `inline; filename="${segments[segments.length - 1]}"`);

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (e: any) {
    return jsonError(e?.message || "Fallo al obtener el archivo de impresión", 502);
  }
}
