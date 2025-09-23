"use client";

import React, { memo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Lock, Eye, EyeOff, LogIn, UserPlus, Shield, CheckCircle2, AlertCircle
} from "lucide-react";

/* ----------------- Input reutilizable (fuera + memo: no pierde foco) ----------------- */
type IconType = React.ComponentType<{ size?: number; className?: string }>;
const Input = memo(function Input({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  isPasswordToggle,
  showPassword,
  setShowPassword,
}: {
  icon: IconType;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  isPasswordToggle?: boolean;
  showPassword?: boolean;
  setShowPassword?: (v: boolean) => void;
}) {
  return (
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors">
        <Icon size={18} />
      </div>
      <input
        className="w-full pl-11 pr-11 py-3 rounded-2xl border-2 text-sm font-medium
                   border-gray-200 hover:border-gray-300 focus:border-indigo-400
                   focus:outline-none transition-colors"
        type={isPasswordToggle ? (showPassword ? "text" : "password") : type}
        placeholder={placeholder}
        value={value ?? ""}          /* siempre string */
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
      />
      {isPasswordToggle && setShowPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
});

/* --------------------------------- Página --------------------------------- */
export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Sign in
  const [siUser, setSiUser] = useState("");
  const [siPass, setSiPass] = useState("");
  const [siShow, setSiShow] = useState(false);
  const [busyIn, setBusyIn] = useState(false);
  const [msgIn, setMsgIn] = useState<{ ok: boolean; text: string } | null>(null);

  // Sign up (requiere sesión admin por política del backend)
  const [suUser, setSuUser] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suShow, setSuShow] = useState(false);
  const [role, setRole] = useState<"user" | "admin">("user");
  const [busyUp, setBusyUp] = useState(false);
  const [msgUp, setMsgUp] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgIn(null);

    if (!siUser.trim() || !siPass.trim()) {
      setMsgIn({ ok: false, text: "Completa usuario y contraseña." });
      return;
    }

    try {
      setBusyIn(true);

      // Si venimos redirigidos por el middleware, traer ?next= para volver allí
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/";

      // 1) POST /api/login -> setea cookie httpOnly con el JWT
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: siUser.trim(), password: siPass.trim(), next }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Credenciales incorrectas.");
      }

      // 2) GET /api/whoami -> obtener usuario (usa la cookie)
      const meRes = await fetch("/api/whoami");
      if (!meRes.ok) {
        throw new Error("No se pudo obtener el usuario.");
      }
      const user = await meRes.json();

      setMsgIn({ ok: true, text: `Bienvenido ${user?.username || siUser.trim()} ✅` });

      // 3) Redirigir (si había next, úsalo; si no, a la raíz)
      router.replace(next);
    } catch (err: any) {
      setMsgIn({ ok: false, text: err?.message || "Error de conexión." });
    } finally {
      setBusyIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgUp(null);

    if (!suUser.trim() || !suPass.trim()) {
      setMsgUp({ ok: false, text: "Completa usuario y contraseña." });
      return;
    }

    try {
      setBusyUp(true);
      // POST /api/users -> proxy interno que llama a backend /auth/users con el Bearer de la cookie
      // (Solo funcionará si la sesión vigente es admin)
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: suUser.trim(), password: suPass.trim(), role }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.detail || err?.message || (res.status === 403 ? "Requiere rol administrador." : "Error creando usuario.");
        throw new Error(msg);
      }

      const nuevo = await res.json();
      setMsgUp({ ok: true, text: `Usuario ${nuevo?.username || suUser.trim()} creado ✅` });

      // Prefill y cambia a login
      setSiUser(suUser.trim());
      setSuUser(""); setSuPass(""); setRole("user");
      setTimeout(() => setMode("signin"), 300);
    } catch (err: any) {
      setMsgUp({ ok: false, text: err?.message || "Error creando usuario." });
    } finally {
      setBusyUp(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh)] w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl">
        {/* Card */}
        <div className="relative rounded-3xl border border-white/60 bg-white/80 shadow-xl shadow-indigo-100/30 backdrop-blur p-6 md:p-8">
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setMode("signin")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === "signin" ? "bg-white shadow text-indigo-700" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === "signup" ? "bg-white shadow text-indigo-700" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Sign In */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Usuario</label>
                <Input
                  icon={User}
                  placeholder="Tu usuario"
                  value={siUser}
                  onChange={setSiUser}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                <Input
                  icon={Lock}
                  placeholder="••••••••"
                  value={siPass}
                  onChange={setSiPass}
                  isPasswordToggle
                  showPassword={siShow}
                  setShowPassword={setSiShow}
                  autoComplete="current-password"
                />
              </div>

              {msgIn && (
                <p className={`text-sm flex items-center gap-2 ${
                  msgIn.ok ? "text-emerald-600" : "text-red-600"
                }`}>
                  {msgIn.ok ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {msgIn.text}
                </p>
              )}

              <button
                type="submit"
                disabled={busyIn}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600
                           px-5 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
              >
                {busyIn ? "Entrando…" : (<><LogIn size={18}/> Entrar</>)}
              </button>
            </form>
          )}

          {/* Sign Up (recuerda: requiere sesión admin) */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Usuario</label>
                <Input
                  icon={User}
                  placeholder="Elige un usuario"
                  value={suUser}
                  onChange={setSuUser}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                <Input
                  icon={Lock}
                  placeholder="••••••••"
                  value={suPass}
                  onChange={setSuPass}
                  isPasswordToggle
                  showPassword={suShow}
                  setShowPassword={setSuShow}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Rol</label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Shield size={18}/>
                  </div>
                  <select
                    className="w-full appearance-none rounded-2xl border-2 border-gray-200
                               pl-11 pr-4 py-3 text-sm font-medium hover:border-gray-300
                               focus:border-indigo-400 focus:outline-none transition-colors"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "user" | "admin")}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              {msgUp && (
                <p className={`text-sm flex items-center gap-2 ${
                  msgUp.ok ? "text-emerald-600" : "text-red-600"
                }`}>
                  {msgUp.ok ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {msgUp.text}
                </p>
              )}

              <button
                type="submit"
                disabled={busyUp}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600
                           px-5 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
              >
                {busyUp ? "Creando…" : (<><UserPlus size={18}/> Crear cuenta</>)}
              </button>
            </form>
          )}
        </div>

        {/* Pie */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Este acceso usa endpoints internos: <b>POST /api/login</b>, <b>GET /api/whoami</b>, <b>POST /api/users</b>.
        </p>
      </div>
    </div>
  );
}
