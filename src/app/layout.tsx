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

/*
 * Dominio real del despliegue.
 *
 * Estaba en `bouw.vercel.app`, que resultó estar ocupado por otra cuenta: al
 * crear el proyecto Vercel asignó `bouw-eight`. Con la URL equivocada, el
 * `metadataBase` construía las canónicas y las tarjetas de Open Graph
 * apuntando al sitio de un desconocido — o sea que compartir un enlace de
 * BOUW llevaba a otra parte.
 *
 * Cuando haya dominio propio (bouw.ec o similar), se cambia solo aquí.
 */
const SITE_URL = "https://bouw-eight.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BOUW — Automation & Digital Solutions",
    template: "%s | BOUW",
  },
  description:
    "Automatizamos procesos, elevamos la calidad y llevamos tus diseños de ingeniería a la realidad. Consultoría técnica desde Quito y Monterrey.",
  /*
   * Términos de búsqueda.
   *
   * Ordenados de más específico a más genérico: los que traen a alguien que
   * ya sabe lo que necesita van primero. "Automatización industrial" a secas
   * compite con medio mundo; "validación de procesos ISO 13485 Ecuador" trae
   * a quien va a escribir.
   *
   * Van en los dos idiomas del sitio porque medio mercado objetivo —Monterrey
   * y las filiales— busca en inglés.
   */
  keywords: [
    // Lo que se contrata, dicho como lo dice el cliente
    "automatización de procesos industriales",
    "mejora continua y lean manufacturing",
    "validación de procesos",
    "sistemas de gestión de calidad",
    "ISO 9001 implementación",
    "ISO 13485 dispositivos médicos",
    "documentación técnica y trazabilidad",
    "control estadístico de procesos",
    "tableros de indicadores KPI",
    "digitalización de planta",
    "integración de datos de producción",
    "diseño de producto e ingeniería de detalle",
    "prototipado y validación de producto",
    "visualización 3D de producto",
    "consultoría de ingeniería industrial",
    "reducción de tiempos de ciclo",
    // Dónde
    "ingeniería Quito Ecuador",
    "consultoría industrial Monterrey México",
    "automatización industrial Latinoamérica",
    // Inglés: Monterrey y las filiales buscan así
    "industrial process automation",
    "quality management systems consulting",
    "process validation services",
    "manufacturing digitalization",
    "product engineering consultancy",
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
