"use client";

import { useEffect, useState } from "react";
import { Shield, UserPlus, AlertCircle, CheckCircle2, Lock, User } from "lucide-react";

type Role = "admin" | "seller" | "viewer" | string;

export default function UserForm({
  onCreated,
}: {
  onCreated?: (user: { username: string; role: Role }) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [myRole, setMyRole] = useState<Role | null>(null); // null=cargando, string=listo
  const isAdmin = myRole === "admin";

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const res = await fetch("/api/whoami", { cache: "no-store" });
        if (!res.ok) throw new Error("no ok");
        const me = await res.json();
        if (!stop) setMyRole(me?.role ?? "user");
      } catch {
        if (!stop) setMyRole("user");
      }
    })();
    return () => { stop = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!username.trim() || !password.trim() || !role) {
      setMsg({ ok: false, text: "Completa usuario, contraseña y rol." });
      return;
    }

    try {
      setBusy(true);

      // Llamada al proxy interno -> reenvía al auth-service
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role: String(role).trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.message ||
          (res.status === 403
            ? "Solo administradores pueden crear usuarios."
            : res.status === 401
            ? "Sesión inválida o expirada."
            : "Error creando usuario.");
        throw new Error(msg);
      }

      const nuevo = await res.json();
      setMsg({ ok: true, text: `Usuario ${nuevo?.username || username} creado ✅` });

      // notificar arriba
      onCreated?.({ username: nuevo?.username || username.trim(), role: nuevo?.role || role });

      // limpiar
      setUsername("");
      setPassword("");
      setRole("user");
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Error creando usuario." });
    } finally {
      setBusy(false);
    }
  }

  // Guard suave: si no es admin, ocultamos el submit y mostramos aviso.
  const disabledByRole = myRole !== null && !isAdmin;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rol del actual */}
      {myRole !== null && (
        <p className="text-xs text-slate-500">
          Tu rol: <b>{String(myRole)}</b>
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Usuario</label>
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <User size={18} />
          </div>
          <input
            className="w-full rounded-2xl border-2 border-gray-200 pl-10 pr-3 py-3 text-sm font-medium
                       hover:border-gray-300 focus:border-indigo-400 focus:outline-none transition-colors"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nuevo usuario"
            disabled={busy || disabledByRole}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Contraseña</label>
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={18} />
          </div>
          <input
            type="password"
            className="w-full rounded-2xl border-2 border-gray-200 pl-10 pr-3 py-3 text-sm font-medium
                       hover:border-gray-300 focus:border-indigo-400 focus:outline-none transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={busy || disabledByRole}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Rol</label>
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Shield size={18} />
          </div>
          <select
            className="w-full appearance-none rounded-2xl border-2 border-gray-200 pl-10 pr-4 py-3 text-sm font-medium
                       hover:border-gray-300 focus:border-indigo-400 focus:outline-none transition-colors"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={busy || disabledByRole}
          >
            <option value="user">Usuario</option>
            <option value="seller">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>

      {msg && (
        <p className={`text-sm flex items-center gap-2 ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
          {msg.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {msg.text}
        </p>
      )}

      {disabledByRole ? (
        <p className="text-sm text-amber-600 flex items-center gap-2">
          <AlertCircle size={16} /> Solo administradores pueden crear usuarios.
        </p>
      ) : (
        <button
          type="submit"
          disabled={busy}
          className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow
                     hover:bg-indigo-700 disabled:opacity-60"
        >
          <UserPlus size={18} />
          {busy ? "Creando…" : "Crear usuario"}
        </button>
      )}
    </form>
  );
}
