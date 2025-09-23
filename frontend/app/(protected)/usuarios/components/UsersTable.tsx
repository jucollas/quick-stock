"use client";

import { useEffect, useMemo, useState } from "react";

export type UserRow = {
  username: string;
  role: string;
};

export default function UsersTable({
  users = [],          // opcional: “creados en esta sesión”
  loading = false,     // loading externo opcional
}: {
  users?: UserRow[];
  loading?: boolean;
}) {
  const [remote, setRemote] = useState<UserRow[]>([]);
  const [loadingRemote, setLoadingRemote] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadRemote = async () => {
    setError(null);
    setLoadingRemote(true);
    try {
      const res = await fetch("/api/users", { method: "GET", cache: "no-store" });
      if (!res.ok) {
        let msg = "Error listando usuarios";
        if (res.status === 401) msg = "Sesión inválida o expirada.";
        if (res.status === 403) msg = "Solo administradores pueden ver usuarios.";
        try {
          const e = await res.json();
          msg = e?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = (await res.json()) as Array<{ username: string; role: string }>;
      setRemote(
        Array.isArray(data)
          ? data.map((u) => ({ username: String(u.username), role: String(u.role) }))
          : []
      );
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar la lista de usuarios.");
      setRemote([]);
    } finally {
      setLoadingRemote(false);
    }
  };

  useEffect(() => {
    loadRemote();
  }, []);

  // Combinar remotos + locales (props) sin duplicar por username
  const combined: UserRow[] = useMemo(() => {
    const byUser = new Map<string, UserRow>();
    for (const u of remote) byUser.set(u.username, u);
    for (const u of users) byUser.set(u.username, u); // locales pisan a remoto si coincide
    return Array.from(byUser.values()).sort((a, b) => a.username.localeCompare(b.username));
  }, [remote, users]);

  const anyLoading = loading || loadingRemote;

  if (anyLoading) return <p className="text-sm text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-3">
      {/* Barra superior con acciones/estado */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : (
            <span>
              {combined.length
                ? `Total: ${combined.length} usuarios`
                : "Sin usuarios para mostrar."}
            </span>
          )}
        </div>

        <button
          onClick={loadRemote}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
        >
          Actualizar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Rol</th>
            </tr>
          </thead>
          <tbody>
            {combined.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={2}>
                  {error
                    ? "No fue posible obtener la lista."
                    : "No hay usuarios disponibles."}
                </td>
              </tr>
            ) : (
              combined.map((u) => (
                <tr key={u.username} className="border-t border-slate-100">
                  <td className="px-3 py-2">{u.username}</td>
                  <td className="px-3 py-2">{u.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
