// public/js/factura.js
// Requiere autenticación: todos los usuarios logueados pueden facturar.
import { getProductos, createFactura } from "./api.js";
import { checkAuth } from "./auth-guard.js";

// ====== Estado ======
const estado = {
  folio: "",
  cliente: "",
  fecha: "",
  medio: "Efectivo",
  items: [] // { product_id, nombre, precio, cantidad }
};

// ====== Utils ======
const $ = (sel) => document.querySelector(sel);
const money = (v) =>
  (Number(v) || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
const hoyISO = () => new Date().toISOString().slice(0, 10);
const fechaHumana = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
function genFolio() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  return `FAC-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function setMsg(text, ok) {
  const el = $("#msg");
  el.textContent = text;
  el.className = "text-sm " + (ok ? "text-emerald-600" : "text-red-600");
}

// ====== Carga de productos (GET /inventory/products) ======
async function poblarSelect() {
  const sel = $("#selProducto");
  try {
    const productos = await getProductos(); // api.js
    sel.innerHTML = productos
      .map(
        (p) =>
          `<option value="${p.product_id}" data-precio="${p.price}" data-nombre="${p.name}">
            ${p.name} — ${money(p.price)}
          </option>`
      )
      .join("");
    sel.dispatchEvent(new Event("change"));
  } catch (e) {
    console.error(e);
    sel.innerHTML = `<option disabled>⚠️ Error al cargar productos</option>`;
  }
}

// ====== Cabecera ======
function syncCabecera() {
  estado.cliente = $("#cliente").value.trim() || "—";
  estado.fecha = $("#fecha").value || hoyISO();
  estado.medio = $("#medioPago").value;
  $("#outCliente").textContent = estado.cliente;
  $("#outFecha").textContent = fechaHumana(estado.fecha);
  $("#outMedio").textContent = estado.medio;
}

// ====== Render tabla ======
function render() {
  const tbody = $("#tbody");
  tbody.innerHTML = estado.items
    .map(
      (it, idx) => `
    <tr>
      <td class="px-3 py-2">${it.nombre}</td>
      <td class="px-3 py-2">${it.product_id}</td>
      <td class="px-3 py-2 text-right">${money(it.precio)}</td>
      <td class="px-3 py-2 text-right">
        <input type="number" min="1" value="${it.cantidad}" data-idx="${idx}"
          class="w-20 text-right rounded-lg border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-600 qty"/>
      </td>
      <td class="px-3 py-2 text-right">${money(it.precio * it.cantidad)}</td>
      <td class="px-3 py-2 text-right no-print">
        <button data-idx="${idx}" class="text-slate-500 hover:text-red-600 remove">Quitar</button>
      </td>
    </tr>`
    )
    .join("");

  const subtotal = estado.items.reduce(
    (acc, it) => acc + it.precio * it.cantidad,
    0
  );
  $("#outSubtotal").textContent = money(subtotal);
  $("#outTotal").textContent = money(subtotal);
}

// ====== Guardar factura (POST /billing/facturas) vía api.js ======
async function guardarFactura() {
  if (!estado.items.length) {
    setMsg("⚠️ Agrega al menos un producto", false);
    return false;
  }
  if (!estado.cliente || estado.cliente === "—") {
    setMsg("⚠️ Ingresa el nombre del cliente", false);
    return false;
  }

  // La API createFactura(cliente, productos) espera productos: { product_id, quantity }
  const productos = estado.items.map((it) => ({
    product_id: it.product_id,
    quantity: it.cantidad
  }));

  try {
    const resp = await createFactura(estado.cliente, productos);

    // Si tu backend retorna folio/id, úsalo para mostrar/actualizar:
    if (resp?.folio) $("#folio").textContent = resp.folio;

    setMsg("✅ Factura guardada correctamente", true);
    return true;
  } catch (err) {
    console.error(err);
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("insuficiente") || msg.includes("stock")) {
      setMsg("❌ Stock insuficiente. Ajusta las cantidades.", false);
      alert("❌ Stock insuficiente. Ajusta las cantidades.");
    } else {
      setMsg("❌ No se pudo guardar la factura.", false);
      alert("❌ No se pudo guardar la factura.\n" + (err?.message || ""));
    }
    return false;
  }
}

// ====== Listeners ======
document.addEventListener("DOMContentLoaded", async () => {
  // ⛔ Bloquea acceso si no hay sesión
  const user = await checkAuth(true);
  if (!user) return; // checkAuth ya redirige si no está autorizado

  $("#fecha").value = hoyISO();
  estado.folio = genFolio();
  $("#folio").textContent = estado.folio;

  await poblarSelect();
  syncCabecera();
  render();

  $("#cliente").addEventListener("input", syncCabecera);
  $("#fecha").addEventListener("change", syncCabecera);
  $("#medioPago").addEventListener("change", syncCabecera);

  $("#selProducto").addEventListener("change", (e) => {
    const opt = e.target.selectedOptions[0];
    if (!opt) return;
    $("#codigo").value = opt.value;
    $("#precio").value = money(opt.dataset.precio);
  });

  $("#btnAgregar").addEventListener("click", () => {
    const opt = $("#selProducto").selectedOptions[0];
    if (!opt) return;
    const product_id = opt.value;
    const nombre = opt.dataset.nombre;
    const precio = Number(opt.dataset.precio);
    const cant = Math.max(1, parseInt($("#cantidad").value || "1", 10));

    const existente = estado.items.find((it) => it.product_id === product_id);
    if (existente) existente.cantidad += cant;
    else estado.items.push({ product_id, nombre, precio, cantidad: cant });

    setMsg("✔️ Producto agregado", true);
    render();
  });

  document.addEventListener("input", (e) => {
    if (e.target.classList.contains("qty")) {
      const i = Number(e.target.dataset.idx);
      estado.items[i].cantidad = Math.max(
        1,
        parseInt(e.target.value || "1", 10)
      );
      render();
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove")) {
      const i = Number(e.target.dataset.idx);
      estado.items.splice(i, 1);
      render();
    }
  });

  // Guardar
  $("#btnGuardar").addEventListener("click", async () => {
    const ok = await guardarFactura();
    if (ok) {
      // Opcional: regenerar folio para la siguiente
      estado.folio = genFolio();
      $("#folio").textContent = estado.folio;
    }
  });

  // Imprimir: guarda primero y si guarda, imprime
  $("#btnImprimir").addEventListener("click", async () => {
    const ok = await guardarFactura();
    if (ok) window.print();
  });

  // Limpiar
  $("#btnLimpiar").addEventListener("click", () => {
    estado.items = [];
    $("#cliente").value = "";
    $("#medioPago").value = "Efectivo";
    $("#cantidad").value = 1;
    estado.folio = genFolio();
    $("#folio").textContent = estado.folio;
    $("#msg").textContent = "";
    syncCabecera();
    render();
  });
});
