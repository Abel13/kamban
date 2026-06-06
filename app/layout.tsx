import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kamban",
  description: "Local markdown Kanban board"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
