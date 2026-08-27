import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tigilabs",
  description: "Solutions numériques et outils internes pour Tigilabs."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
