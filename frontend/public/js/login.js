// public/js/login.js
import { login, getMe, createUser } from "./api.js";

const container = document.querySelector(".container");
const btnSignIn = document.getElementById("btn-sign-in");
const btnSignUp = document.getElementById("btn-sign-up");

btnSignIn?.addEventListener("click", () => container.classList.remove("toggle"));
btnSignUp?.addEventListener("click", () => container.classList.add("toggle"));

// ----- LOGIN -----
const formSignIn = document.querySelector(".sign-in");
formSignIn?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username-signin").value.trim();
  const password = document.getElementById("pass-signin").value.trim();

  try {
    const data = await login(username, password);
    const token = data?.token || data?.access_token;

    if (token) {
      // Guardamos el JWT
      localStorage.setItem("token", token);

      // Verificamos el usuario logueado con /me
      const user = await getMe();
      localStorage.setItem("userName", user.username);
      localStorage.setItem("userRole", user.rol);

      alert(`Inicio de sesión exitoso ✅ Bienvenido ${user.username}`);
      window.location.href = "/dashboard";
    } else {
      alert("Credenciales incorrectas ❌");
    }
  } catch (err) {
    alert(err.message || "Error de conexión al backend.");
    console.error(err);
  }
});

// ----- REGISTRO -----
/*const formSignUp = document.querySelector(".sign-up");
formSignUp?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username-signup").value.trim();
  const password = document.getElementById("pass-signup").value.trim();
  const rol = document.getElementById("rol-signup")?.value || "user";

  try {
    const newUser = await createUser(username, password, rol);
    alert(`Usuario ${newUser.username} creado correctamente ✅`);
    container.classList.remove("toggle"); // volver a login
  } catch (err) {
    alert(err.message || "Error creando usuario.");
    console.error(err);
  }
});*/
