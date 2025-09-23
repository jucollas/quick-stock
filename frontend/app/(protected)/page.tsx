"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import {
  FileText,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  ArrowRight,
  TrendingUp
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

type Role = "admin" | "seller" | "viewer" | string;

export default function Home() {
  const [role, setRole] = useState<Role | null>(null); // null = cargando
  const isAdmin = role === "admin";

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const res = await fetch("/api/whoami", { cache: "no-store" });
        if (!res.ok) throw new Error("no ok");
        const me = await res.json();
        if (!stop) setRole(me?.role ?? "user");
      } catch {
        if (!stop) setRole("user");
      }
    })();
    return () => { stop = true; };
  }, []);

  const features: Array<{
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    gradient: string;
    adminOnly?: boolean;
  }> = [
    {
      title: "Registro y Generación de Factura",
      description: "Crea facturas profesionales con datos del cliente, items y totales automáticos.",
      href: "/facturas",
      icon: FileText,
      color: "text-blue-600",
      gradient: "from-blue-500/10 to-indigo-500/10",
    },
    {
      title: "Registro de Ventas",
      description: "Sistema de caja rápido con múltiples métodos de pago y tickets automáticos.",
      href: "/ventas",
      icon: ShoppingCart,
      color: "text-emerald-600",
      gradient: "from-emerald-500/10 to-teal-500/10",
    },
    {
      title: "Gestión de Usuarios",
      description: "Creacion y eliminacion de usuarios del sistema",
      href: "/usuarios",
      icon: Users,
      color: "text-purple-600",
      gradient: "from-purple-500/10 to-pink-500/10",
      adminOnly: true,
    },
    {
      title: "Control de Inventario",
      description: "Monitoreo en tiempo real del stock con alertas automáticas y control de existencias.",
      href: "/inventario",
      icon: Package,
      color: "text-orange-600",
      gradient: "from-orange-500/10 to-red-500/10",
      adminOnly: true, // 👈 solo admins
    },
    {
      title: "Análisis y Reportes",
      description: "Dashboard interactivo con métricas clave, tendencias y pronósticos de venta.",
      href: "/reportes",
      icon: BarChart3,
      color: "text-cyan-600",
      gradient: "from-cyan-500/10 to-blue-500/10",
    },
  ];

  return (
    <main className={`${inter.className} min-h-screen relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-100/40 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100/30 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <header className="mb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 --brand-1 to-slate-900 bg-clip-text text-transparent">
              Panel Admin - Store
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Centro de control integral para tu negocio. Gestiona ventas, inventario y clientes desde un solo lugar.
          </motion.p>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-emerald-200 rounded-full text-sm text-emerald-700 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Configura tus productos e información Corporativa</span>
              <TrendingUp className="h-4 w-4" />
            </div>
          </motion.div>
        </header>

        {/* Grid de módulos */}
        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const isAdminOnly = feature.adminOnly === true;
            const disabled = isAdminOnly && role !== null && !isAdmin; // cuando ya cargó el rol
            return (
              <FeatureCard
                key={feature.title}
                {...feature}
                index={index}
                disabled={disabled}
                loadingRole={role === null}
              />
            );
          })}
        </section>

        {/* Mensaje informativo opcional */}
        {role !== null && !isAdmin && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
              <Package className="h-4 w-4" />
              <span>El módulo <b>Inventario</b> es exclusivo para administradores.</span>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  href,
  icon: Icon,
  index,
  color,
  gradient,
  disabled,
  loadingRole,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
  color: string;
  gradient: string;
  disabled?: boolean;
  loadingRole?: boolean;
}) {
  const Wrapper: any = disabled ? "div" : Link;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 * index, type: "spring", stiffness: 100 }}
      whileHover={!disabled ? { y: -8, scale: 1.02, transition: { duration: 0.2 } } : undefined}
      className={`group relative ${disabled ? "opacity-60 pointer-events-none" : ""}`}
      aria-disabled={disabled || undefined}
    >
      <Wrapper
        href={disabled ? undefined : href}
        className="block h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-3xl"
        aria-label={title}
      >
        <div className="relative h-full p-8 bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl shadow-xl shadow-slate-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-slate-300/30 group-hover:bg-white/90">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

          <div className="relative z-10">
            <div className="mb-6 flex items-start justify-between">
              <div className={`inline-flex p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl shadow-sm ${color}`}>
                <Icon className="h-7 w-7" />
              </div>

              {/* Chip admin-only */}
              {loadingRole ? null : disabled ? (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 border border-red-200">
                  Solo administradores
                </span>
              ) : null}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4 leading-tight group-hover:text-slate-800 transition-colors">
              {title}
            </h2>

            <p className="text-slate-600 leading-relaxed mb-6 group-hover:text-slate-700 transition-colors">
              {description}
            </p>

            <motion.div whileHover={!disabled ? { x: 6 } : undefined} className="flex items-center gap-3 text-slate-700 font-semibold group-hover:text-slate-900 transition-colors">
              <span>{disabled ? "Acceso restringido" : "Acceder al módulo"}</span>
              <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full group-hover:bg-slate-200 transition-all duration-200 group-hover:shadow-sm">
                <ArrowRight className="h-4 w-4" />
              </div>
            </motion.div>
          </div>

          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-transparent via-slate-100/20 to-slate-200/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Wrapper>
    </motion.div>
  );
}
