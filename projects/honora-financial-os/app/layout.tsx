import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Honora — Financial OS", template: "%s · Honora" },
  description: "Clientes, pricing, cobros y cash flow en un Financial OS para profesionales independientes.",
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
