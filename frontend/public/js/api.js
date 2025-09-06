// public/js/api.js

const API_BASES = {
  auth: "http://localhost:8000/auth",
  inventory: "http://localhost:8001/inventory",
  billing: "http://localhost:4003/billing",
  print: "http://localhost:4004/print",
  notifications: "http://localhost:4005/notifications"
};


// Helper para requests con manejo de JWT
async function request(base, endpoint, options = {}, useAuth = true) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // solo si el request requiere autenticación
  if (useAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers,
  });

  if (useAuth && response.status === 401) {
    // Token inválido o expirado → limpiar sesión
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    window.location.href = "/"; // volver al login
    throw new Error("Sesión expirada, por favor inicia sesión nuevamente.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Error en la petición");
  }

  return response.json();
}

// ========== AUTH ==========
export function login(username, password) {
  return request(API_BASES.auth, "/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }, false);
}

export function getMe() {
  return request(API_BASES.auth, "/me");
}

export function createUser(username, password, role) {
  return request(API_BASES.auth, "/users", {
    method: "POST",
    body: JSON.stringify({ username, password, role }),
  });
}

export function getUsers(){
  return request(API_BASES.auth, "/users")
}

// ========== INVENTARIO ==========
// public/js/api.js  (añade o reemplaza las funciones relevantes)

export function getProductos() {
  return request(API_BASES.inventory, "/products");
}

/**
 * createProducto: parámetros amigables en frontend,
 * pero el body enviado usa los campos que requiere el backend:
 * { product_id, name, price, stock, min_stock }
 */
export function createProducto(productId, name, price, stock, minStock) {
  return request(API_BASES.inventory, "/products", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      name,
      price,
      stock,
      min_stock: minStock,
    }),
  });
}



// ========== FACTURAS ==========
export function getFacturas() {
  return request(API_BASES.billing, "/facturas");
}

export function getFactura(id) {
  return request(API_BASES.billing, `/facturas/${id}`);
}

export function createFactura(cliente, productos) {
  return request(API_BASES.billing, "/facturas", {
    method: "POST",
    body: JSON.stringify({ cliente, productos }),
  });
}

export function imprimirFactura(id) {
  return request(API_BASES.billing, `/facturas/${id}/imprimir`, {
    method: "POST",
  });
}

export function descargarFactura(id) {
  return request(API_BASES.print, `/facturas/${id}`);
}

// ========== ALERTAS ==========
export function getAlertas() {
  return request(API_BASES.notifications, "/logs");
}
