#  Tienda Admin

> **Sistema integral de administración para tiendas y negocios**

Un dashboard moderno y completo desarrollado con Next.js para la gestión eficiente de tu negocio. Controla inventario, ventas, clientes y genera reportes desde una sola plataforma.

---

##  Características Principales

###  **Dashboard Intuitivo**
- Interface moderna con animaciones fluidas
- Navegación responsive para desktop y móvil
- Diseño optimizado para productividad

###  **Módulos de Gestión**
- **Facturas** - Generación profesional de facturas con cálculos automáticos
- **Ventas** - Sistema de punto de venta rápido y eficiente
- **Clientes** - Base de datos completa con historial de compras
- **Inventario** - Control de stock con alertas automáticas
- **Reportes** - Analytics avanzados con gráficas interactivas

---

##  Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- npm, yarn, pnpm o bun

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/tienda-admin.git
   cd tienda-admin
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   # o
   yarn install
   # o
   pnpm install
   ```

3. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   # o
   pnpm dev
   # o
   bun dev
   ```

4. **Abre tu navegador**
   
   Visita [http://localhost:3000](http://localhost:3000) para ver la aplicación.

---

## Stack Tecnológico

| Tecnología | Propósito |
|------------|-----------|
| **Next.js 14** | Framework React con App Router |
| **TypeScript** | Tipado estático para mayor robustez |
| **Tailwind CSS** | Framework CSS utilitario |
| **Framer Motion** | Animaciones y transiciones |
| **Lucide React** | Iconografía moderna |
| **Inter Font** | Tipografía optimizada |

---

## Estructura del Proyecto

```
tienda-admin/
├── 📂 app/
│   ├── 📂 clientes/          # Gestión de clientes
│   ├── 📂 facturas/          # Sistema de facturación
│   ├── 📂 inventario/        # Control de inventario
│   ├── 📂 reportes/          # Dashboard de reportes
│   ├── 📂 ventas/            # Punto de venta
│   ├── 📄 layout.tsx         # Layout principal
│   └── 📄 page.tsx           # Página de inicio
├── 📂 components/
│   ├── 📄 Navbar.tsx         # Barra de navegación
│   └── 📂 ui/                # Componentes reutilizables
├── 📂 public/
│   └── 🖼️ logo-main.png      # Logo de la aplicación
└── 📄 tailwind.config.js     # Configuración de Tailwind
```

---

##  Características de Diseño

### **UI/UX Moderno**
- **Glassmorphism** - Efectos de vidrio y blur
- **Micro-animaciones** - Feedback visual inmediato
- **Gradientes dinámicos** - Paleta de colores sofisticada
- **Responsive Design** - Optimizado para todos los dispositivos

### **Animaciones Avanzadas**
```tsx
// Ejemplo de animación con Framer Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.05 }}
  transition={{ duration: 0.3 }}
>
  {/* Contenido */}
</motion.div>
```

---

## Estado del Proyecto

| Módulo | Estado | Descripción |
|---------|---------|-------------|
|  **Dashboard** | ✅ Completo | Interface principal terminada |
|  **Navegación** | ✅ Completo | Navbar responsive con animaciones |
|  **Facturas** | 🔄 En desarrollo | Sistema de facturación |
|  **Ventas** | 🔄 En desarrollo | Punto de venta |
| 👥**Clientes** | 📋 Planificado | Gestión de clientes |
|  **Inventario** | 📋 Planificado | Control de stock |
|  **Reportes** | 📋 Planificado | Analytics y métricas |

---

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run start        # Inicia servidor de producción
npm run lint         # Ejecuta ESLint

# Utilidades
npm run type-check   # Verifica tipos de TypeScript
```

---

##  Despliegue

### **Vercel (Recomendado)**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/tienda-admin)

1. Conecta tu repositorio con Vercel
2. La configuración se detecta automáticamente
3. Despliega con un click

### **Otras Plataformas**
- **Netlify** - Compatible con builds estáticos
- **Railway** - Deploy con base de datos
- **Docker** - Containerización disponible

---

##  Documentación Adicional

### **Next.js Resources**
- 📖 [Documentación oficial](https://nextjs.org/docs)
- 🎓 [Tutorial interactivo](https://nextjs.org/learn)
- 💬 [Comunidad GitHub](https://github.com/vercel/next.js)

### **Librerías Utilizadas**
-  [Tailwind CSS](https://tailwindcss.com/docs)
-  [Framer Motion](https://www.framer.com/motion/)
-  [Lucide Icons](https://lucide.dev/)

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ve el archivo [LICENSE](LICENSE) para más detalles.

---