import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rivendle - Le jeu de devinettes Tolkien",
  description:
    "Devinez le personnage du jour de l'univers de Tolkien ! Inspiré de Wordle, avec les personnages du Seigneur des Anneaux, du Hobbit et du Silmarillion.",
  openGraph: {
    title: "Rivendle",
    description: "Devinez le personnage Tolkien du jour !",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen relative">
        <div className="fixed inset-0 -z-10">
          <img
            src="/images/rivendell.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
