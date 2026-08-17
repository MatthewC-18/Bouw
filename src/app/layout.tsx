import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Cursor from "@/components/Cursor";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

/**
 * Tipografía.
 *
 * Archivo con el eje de ancho abierto: los titulares van en su corte
 * expandido, que se planta como rótulo industrial. IBM Plex Sans y Mono
 * completan el sistema — Plex nació en IBM como tipografía de ingeniería,
 * así que dice lo mismo que dice la empresa.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const SITE_URL = "https://bouw.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BOUW — Automation & Digital Solutions",
    template: "%s | BOUW",
  },
  description:
    "Automatizamos procesos, elevamos la calidad y llevamos tus diseños de ingeniería a la realidad. Consultoría técnica desde Quito y Monterrey.",
  keywords: [
    "automatización industrial",
    "mejora de procesos",
    "consultoría de calidad",
    "ingeniería",
    "Quito",
    "Monterrey",
    "dispositivos médicos",
    "visualización 3D",
  ],
  authors: [{ name: "BOUW" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "BOUW",
    title: "BOUW — Automation & Digital Solutions",
    description:
      "Del diseño a la realidad: automatización, calidad y consultoría de procesos. Quito · Monterrey.",
    locale: "es_EC",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BOUW — Automation & Digital Solutions",
    description:
      "Del diseño a la realidad: automatización, calidad y consultoría de procesos.",
  },
  icons: {
    icon: "/logo-bouw.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#04101f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          <Cursor />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
