import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Honora — Client-to-Cash OS", template: "%s · Honora" },
  description: "Captura leads, crea quotes con margen, prioriza cobros y proyecta caja en un solo sistema para profesionales independientes.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
