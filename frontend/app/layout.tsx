// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ProSoft — Admin Panel",
    template: "ProSoft — %s",
  },
  description: "Panel de administrador para la tienda ProSoft",
  applicationName: "ProSoft Admin",
  icons: {
    icon: "/logo-main.png",
    shortcut: "/logo-main.png",
    apple: "/logo-main.png",
  },
  themeColor: "#FAA091",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-app text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
