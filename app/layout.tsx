import type { Metadata } from "next";
import { getContenido } from "@/lib/contenido";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import "./animaciones.css";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Título e ícono salen de Panel → Contenido → Marca.
export async function generateMetadata(): Promise<Metadata> {
  const { marca } = await getContenido();
  return {
    title: { default: `${marca.nombre} · ${marca.lema}`, template: `%s · ${marca.nombre}` },
    description: `${marca.nombre}: canastas navideñas y regalos corporativos armados a mano en Lima.`,
    icons: { icon: marca.icono, apple: marca.icono },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Activa las animaciones de entrada solo con JS y sin "reducir movimiento". */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.motion="";`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
