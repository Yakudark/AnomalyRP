import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnomalyRP Wiki | Documentation Officielle",
  description: "La source de vérité pour l'univers AnomalyRP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className="antialiased bg-background text-foreground min-h-screen selection:bg-primary/30 selection:text-primary"
      >
        {children}
      </body>
    </html>
  );
}
