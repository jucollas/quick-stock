// public/js/usuarios.js
import { createUser, getUsers } from "./api.js";
import { checkAuth } from "./auth-guard.js";

document.addEventListener("DOMContentLoaded", async () => {
  const $ = (s) => document.querySelector(s);

  // --- Verificación de autenticación ---
  const user = await checkAuth(true);

  // Detectar rol (soporta roles como array o string)
  const role = Array.isArray(user?.roles)
    ? user.roles[0]?.toLowerCase()
    : (user?.rol ?? user?.role ?? "").toLowerCase();

  if (!user || role !== "admin") {
    alert("Acceso denegado ❌. Solo administradores.");
    window.location.href = "/";
    return;
  }

  const msg = $("#msg");
  const tablaUsuarios = $("#tablaUsuarios");

  // --- Cargar usuarios existentes ---
  async function cargarUsuarios() {
    try {
      const usuarios = await getUsers();

      // limpiar tabla
      tablaUsuarios.innerHTML = "";

      usuarios.forEach((u) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="px-4 py-2 border">${u.username}</td>
          <td class="px-4 py-2 border">${Array.isArray(u.roles) ? u.roles.join(", ") : (u.rol ?? u.role ?? "user")}</td>
        `;
        tablaUsuarios.appendChild(row);
      });
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      msg.textContent = "No se pudieron cargar los usuarios.";
      msg.className = "text-red-600 text-sm";
    }
  }

  // Llamada inicial
  await cargarUsuarios();

  // --- Alta de usuarios ---
  $("#btnCrear")?.addEventListener("click", async () => {
    const username = $("#username")?.value.trim();
    const password = $("#password")?.value.trim();
    const rol = $("#rol")?.value;

    if (!username || !password) {
      msg.textContent = "Todos los campos son obligatorios.";
      msg.className = "text-red-600 text-sm";
      return;
    }

    try {
      const nuevo = await createUser(username, password, rol);
      msg.textContent = `Usuario ${nuevo.username} creado correctamente ✅`;
      msg.className = "text-emerald-600 text-sm";

      // limpiar
      $("#username").value = "";
      $("#password").value = "";
      $("#rol").value = "user";

      // refrescar lista
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      msg.textContent = err.message || "Error al crear usuario.";
      msg.className = "text-red-600 text-sm";
    }
  });
});
