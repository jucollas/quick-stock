"use client";

import { useState } from "react";
import UserForm from "./components/UserForm";
import UsersTable, { UserRow } from "./components/UsersTable";

export default function ClientesPage() {
  // Usuarios creados en esta sesión (la tabla los combinará con los remotos)
  const [localUsers, setLocalUsers] = useState<UserRow[]>([]);

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-semibold">Gestión de Usuarios</h1>

      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Crear usuario (POST /api/users) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-medium">Crear usuario</h2>
          <UserForm
            onCreated={(u) =>
              setLocalUsers((prev) => [
                ...prev,
                { username: u.username, role: (u as any).role ?? "user" },
              ])
            }
          />
          <p className="mt-2 text-xs text-slate-500">
            Solo administradores pueden crear usuarios.
          </p>
        </div>

        {/* Lista combinada: remotos (GET /api/users) + locales de esta sesión */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Usuarios</h2>
            {/* El botón "Actualizar" está dentro de la tabla */}
          </div>
          <UsersTable users={localUsers} />
        </div>
      </section>
    </main>
  );
}
