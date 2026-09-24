import type { Metadata } from "next";
import { Gloock, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import "./rediseno.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const display = Gloock({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: { default: "MKA · Canastas Navideñas & Regalos", template: "%s · MKA" },
  description: "MKA: canastas navideñas y regalos corporativos armados a mano en Lima.",
};

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
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
