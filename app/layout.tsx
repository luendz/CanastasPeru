import type { Metadata } from "next";
import { getContenido } from "@/lib/contenido";
import { SITIO } from "@/lib/seo";
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
  const titulo = `${marca.nombre} · ${marca.lema}`;
  const descripcion = `${marca.nombre}: canastas navideñas y regalos corporativos armados a mano en Lima. Pedidos individuales y para empresas, con delivery en Lima y envíos a provincias.`;
  return {
    // Base de las URLs absolutas (Open Graph, canónicas) y vista previa al compartir el enlace.
    metadataBase: new URL(SITIO),
    title: { default: titulo, template: `%s · ${marca.nombre}` },
    description: descripcion,
    applicationName: marca.nombre,
    icons: { icon: marca.icono, apple: marca.icono },
    openGraph: {
      type: "website",
      locale: "es_PE",
      siteName: `${marca.nombre} · ${marca.lema}`,
      title: titulo,
      description: descripcion,
      images: [{ url: "/imgs_general/portada-paginas.webp", width: 2000, height: 667, alt: titulo }],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion, images: ["/imgs_general/portada-paginas.webp"] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
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
