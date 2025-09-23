"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, ShoppingCart, Users, Package, BarChart3, Menu, X, LogOut,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/", Icon: Home },
  { label: "Facturas", href: "/facturas", Icon: FileText },
  { label: "Ventas", href: "/ventas", Icon: ShoppingCart },
  { label: "Usuarios", href: "/usuarios", Icon: Users },
  { label: "Inventario", href: "/inventario", Icon: Package },   // admin-only
  { label: "Reportes", href: "/reportes", Icon: BarChart3 },
];

const REQUIRED_ROLE_BY_PREFIX: Array<{ prefix: string; allow: (role?: string) => boolean }> = [
  { prefix: "/inventario", allow: (r) => r === "admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

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

  const filteredNav = NAV_ITEMS.filter((item) => {
    const rule = REQUIRED_ROLE_BY_PREFIX.find(r => item.href.startsWith(r.prefix));
    if (!rule) return true;
    if (role === undefined) return false;
    return rule.allow(role);
  });

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      // aunque devuelva 200/204/302, limpiamos estado y redirigimos
      setRole(undefined);
      router.replace("/login");
    } catch {
      // fallback duro si algo raro pasa
      window.location.href = "/login";
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{ background: "color-mix(in srgb, var(--card) 90%, transparent)", borderColor: "var(--border)" }}
      aria-label="Barra de navegación principal"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group relative inline-flex items-center justify-center focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
          aria-label="Ir al inicio - Tienda Admin"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0], transition: { duration: 0.3, ease: "easeInOut" } }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="relative h-16 w-16 z-10 p-2">
              <Image src="/logo-main.png" alt="Tienda Admin Logo" fill sizes="64px" priority className="object-contain drop-shadow-sm" />
            </div>
          </motion.div>
        </Link>

        {/* Desktop nav + logout */}
        <div className="hidden items-center gap-2 md:flex">
          {filteredNav.map(({ label, href, Icon }) => {
            const isActive = pathname === href;
            return (
              <motion.div key={href} whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
                    ${isActive ? "bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand-2)]/80 text-[var(--brand-contrast)] shadow-sm"
                               : "text-slate-700 hover:bg-[var(--brand-2)]/30 hover:text-slate-900 hover:shadow-sm"}`}
                >
                  <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`} />
                  <span>{label}</span>
                </Link>
              </motion.div>
            );
          })}

          {/* Botón Cerrar sesión (desktop) */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-red-50 border border-red-200/70"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Saliendo..." : "Cerrar sesión"}
          </motion.button>
        </div>

        {/* Mobile toggle */}
        <motion.button
          type="button"
          onClick={() => setOpen(v => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center justify-center rounded-xl p-2.5 md:hidden focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--ring)] transition-colors duration-200"
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="mobile-menu"
          style={{ color: "var(--fg)", backgroundColor: open ? "var(--brand-2)" : "transparent" }}
        >
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.div>
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: "1px solid var(--border)", backdropFilter: "blur(12px)" }}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
              {filteredNav.map(({ label, href, Icon }, index) => {
                const isActive = pathname === href;
                return (
                  <motion.div key={href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}>
                    <Link
                      href={href}
                      className={`inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                        ${isActive ? "bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand-2)]/80 text-[var(--brand-contrast)] shadow-sm"
                                   : "text-slate-700 hover:bg-[var(--brand-2)]/30 hover:text-slate-900 hover:translate-x-1"}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Botón Cerrar sesión (mobile) */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 * filteredNav.length }}
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-2 inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/70"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Saliendo..." : "Cerrar sesión"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
