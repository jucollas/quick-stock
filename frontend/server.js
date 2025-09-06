// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html")); // login
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/usuarios", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "usuarios.html"));
});

app.get("/inventario", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "inventario.html"));
});

app.get("/facturas", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "facturas.html"));
});

app.get("/generar-factura", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "generar-factura.html"));
});

app.get("/alertas", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "alerta-stock.html"));
});

app.get("/clientes", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "clientes.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Frontend corriendo en http://localhost:${PORT}`);
});
