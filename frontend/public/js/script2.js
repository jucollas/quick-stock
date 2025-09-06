/***** ========== CONFIG API ========== *****/
const API_BASE = "http://localhost:5000";
const API_AUTH = "http://localhost:8000"; // para /auth/me
const API_BILLING = "http://localhost:8007"; // para facturas

function money(v) {
  const num = Number(v) || 0;
  return num.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function productCard(p) {
  return `
    <div class="product">
      <img src="${p.imageUrl}" alt="${p.name}">
      <div class="product-txt">
        <h3>${p.name}</h3>
        <p class="precio">${money(p.price)}</p>
        <a href="#" class="agregar-carrito btn-2" data-id="${p._id || p.id}">Agregar</a>
      </div>
    </div>
  `;
}

async function loadProducts() {
  const grid = document.getElementById("product-list") || document.querySelector("#lista-1 .product-content");
  if (!grid) return;

  grid.innerHTML = `<p>Cargando productos...</p>`;
  try {
    const res = await fetch(`${API_BASE}/products?limit=24`);
    if (!res.ok) throw new Error("Respuesta no OK");
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    if (!items.length) {
      grid.innerHTML = `<p>No hay productos aún.</p>`;
      return;
    }
    grid.innerHTML = items.map(productCard).join("");
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<p>⚠️ Error cargando productos.</p>`;
  }
}

/***** ========== CARRITO ========== *****/
const carrito          = document.querySelector('#carrito');
const listaProductos   = document.querySelector('#lista-1');
const lista            = document.querySelector('#lista-carrito tbody');
const vaciarCarritoBtn = document.querySelector('#vaciar-carrito');

cargarEventListeners();

function cargarEventListeners() {
  if (listaProductos) {
    listaProductos.addEventListener('click', comprarElemento);
  }
  if (carrito) {
    carrito.addEventListener('click', eliminarElemento);
  }
  if (vaciarCarritoBtn) {
    vaciarCarritoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      vaciarCarrito();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    cargarUsuario(); // Mostrar nombre del usuario
  });
}

function comprarElemento(e) {
  e.preventDefault();
  if (e.target.classList.contains('agregar-carrito')) {
    const elemento = e.target.closest('.product');
    if (elemento) leerDatosElemento(elemento);
  }
}

function leerDatosElemento(elemento) {
  const infoElemento = {
    imagen: elemento.querySelector('img')?.src || '',
    titulo: elemento.querySelector('h3')?.textContent.trim() || '',
    precio: elemento.querySelector('.precio')?.textContent.trim() || '',
    id:     elemento.querySelector('a.agregar-carrito')?.dataset.id || ''
  };
  insertarCarrito(infoElemento);
}

function insertarCarrito(el) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><img src="${el.imagen}" width="60" /></td>
    <td>${el.titulo}</td>
    <td>${el.precio}</td>
    <td><a href="#" class="borrar" data-id="${el.id}">X</a></td>
  `;
  lista.appendChild(row);
}

function eliminarElemento(e) {
  e.preventDefault();
  if (e.target.classList.contains('borrar')) {
    e.target.closest('tr')?.remove();
  }
}

function vaciarCarrito() {
  while (lista.firstChild) {
    lista.removeChild(lista.firstChild);
  }
  return false;
}

/***** ========== USUARIO AUTENTICADO (GET /auth/me) ========== *****/
async function cargarUsuario() {
  const box = document.getElementById('welcome');
  if (!box) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API_AUTH}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("No autorizado");

    const user = await res.json();
    const name = user.name || user.nombre || "Usuario";

    box.innerHTML = `Bienvenid@ <b>${escapeHtml(name)}</b>`;
    box.classList.remove("hidden");

  } catch (err) {
    console.error("Error autenticando:", err);
    box.innerHTML = `No se pudo cargar tu información.`;
    box.classList.remove("hidden");
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>\"']/g, s => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[s]));
}

/***** ========== ENVIAR FACTURA (POST /billing/facturas) [AÚN OPCIONAL] ========== *****/
// Si necesitas guardar factura en la BD desde el frontend, puedes usar esta función luego:
async function enviarFactura(cliente, productos) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_BILLING}/billing/facturas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        cliente,
        productos
      })
    });

    if (!res.ok) throw new Error("Error al registrar factura");

    const data = await res.json();
    console.log("Factura guardada:", data);
    return data;
  } catch (err) {
    console.error("Error al guardar factura:", err);
  }
}
