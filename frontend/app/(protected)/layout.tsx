// app/(protected)/layout.tsx
import "./../globals.css"; // opcional, si lo necesitas aquí
import Navbar from "./components/Navbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Ir al contenido
      </a>

      <div
        aria-hidden
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, var(--brand-2), var(--brand-1), var(--brand-2))" }}
      />

      {/* Navbar solo en zona protegida */}
      <Navbar />

      {/* Contenido */}
      <main id="content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 print:px-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-slate-500 sm:px-6">
          <span>© {year} Todos los derechos reservados.</span>
          <span>
            Panel • <span className="font-medium" style={{ color: "var(--brand-1)" }}>v1.0</span>
          </span>
        </div>
      </footer>
    </>
  );
}
