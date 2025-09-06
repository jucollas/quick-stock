import { getMe } from "./api.js";

export async function checkAuth(required = true) {
  const token = localStorage.getItem("token");

  if (!token && required) {
    window.location.href = "/";
    return null;
  }

  if (token) {
    try {
      const user = await getMe();
      localStorage.setItem("userName", user.username);

      // guarda el primer rol (o vacío si no existe)
      const role = Array.isArray(user.roles) ? user.roles[0] : (user.role ?? "");
      localStorage.setItem("userRole", role);

      if (!required) {
        window.location.href = "/dashboard";
        return null;
      }

      return user;
    } catch (err) {
      console.warn("Token inválido:", err.message);
      localStorage.clear();
      if (required) window.location.href = "/";
      return null;
    }
  }

  return null;
}
