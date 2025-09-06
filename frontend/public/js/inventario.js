// public/js/inventario.js
import { checkAuth } from "./auth-guard.js";
import { getProductos, createProducto } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const $ = (s) => document.querySelector(s);
  const msg = $("#msg");
  const tabla = $("#tablaProductos");

  // Verificar auth y rol admin
  const user = await checkAuth(true);

  const role = Array.isArray(user?.roles)
  ? user.roles[0]
  : (user?.role ?? "").toLowerCase();

  if (!user || role.toLowerCase() !== "admin") {
    alert("Acceso denegado ❌. Solo administradores.");
    window.location.href = "/";
    return;
  }


  // Cargar productos desde backend y pintarlos
  async function cargarProductos() {
    try {
      const productos = await getProductos();
      tabla.innerHTML = "";

      productos.forEach((p) => {
        const id = p.product_id ?? p._id ?? p.id ?? "";
        const name = p.name ?? p.nombre ?? "";
        const price = p.price ?? p.precio ?? "";
        const stock = p.stock ?? "";
        const minStock = p.min_stock ?? p.stockMin ?? p.stockMinimo ?? "";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="px-4 py-2 border">${id}</td>
          <td class="px-4 py-2 border">${name}</td>
          <td class="px-4 py-2 border">${price}</td>
          <td class="px-4 py-2 border">${stock}</td>
          <td class="px-4 py-2 border">${minStock}</td>
        `;
        tabla.appendChild(row);
      });
    } catch (err) {
      console.error("Error cargando productos:", err);
      msg.textContent = "Error cargando inventario.";
      msg.className = "text-red-600 text-sm";
    }
  }

  // Evento crear producto
  $("#btnCrear")?.addEventListener("click", async () => {
    const productId = $("#productId").value.trim();
    const nombre = $("#nombre").value.trim();
    const precio = parseFloat($("#precio").value);
    const stock = parseInt($("#stock").value, 10);
    const stockMin = parseInt($("#stockMin").value, 10);

    if (!productId || !nombre || isNaN(precio) || isNaN(stock) || isNaN(stockMin)) {
      msg.textContent = "⚠️ Todos los campos son obligatorios y deben ser válidos.";
      msg.className = "text-red-600 text-sm";
      return;
    }

    try {
      await createProducto(productId, nombre, precio, stock, stockMin);

      msg.textContent = `Producto ${nombre} creado correctamente ✅`;
      msg.className = "text-emerald-600 text-sm";

      // limpiar formulario
      $("#productId").value = "";
      $("#nombre").value = "";
      $("#precio").value = "";
      $("#stock").value = "";
      $("#stockMin").value = "";

      await cargarProductos();
    } catch (err) {
      console.error("Error creando producto:", err);
      msg.textContent = err.message || "Error al crear producto.";
      msg.className = "text-red-600 text-sm";
    }
  });

  // Primera carga
  await cargarProductos();
});
