import type { Metadata } from "next";
import { ToastProvider } from "../components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tigilabs",
  description: "Solutions numériques et outils internes pour Tigilabs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
