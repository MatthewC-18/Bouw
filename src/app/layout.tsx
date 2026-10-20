import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * Tipografía.
 *
 * Archivo con el eje de ancho abierto: los titulares van en su corte
 * expandido, que se planta como rótulo industrial. IBM Plex Sans y Mono
 * completan el sistema — Plex nació en IBM como tipografía de ingeniería,
 * así que dice lo mismo que dice la empresa.
 */
/*
 * Archivo solo en el corte que se usa: `.font-display` fija peso 600 y ancho
 * normal para todos los titulares. Iba la variable entera, con los ejes de
 * peso y ancho: 88 KB que competían con el CSS en el teléfono, para usar un
 * solo corte (19 oct 2026, velocidad).
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "600",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/*
 * La letra del eslogan (`Slogan`): una serif en cursiva, la única del sitio,
 * para que la frase se lea como la firma de la empresa.
 */
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  display: "swap",
  // Sin precarga: es una frase, y en el teléfono la precarga le quitaba
  // ancho de banda al CSS que hace falta para pintar
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  // Rótulos pequeños: llegan después del primer pintado sin que se note
  preload: false,
});


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BOUW | Automation & Digital Solutions",
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
    "rediseño de layout y SMED",
    "buenas prácticas de manufactura BPM",
    "cumplimiento normativo y auditorías de calidad",
    "sistema CAPA y análisis de causa raíz",
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
    title: "BOUW | Automation & Digital Solutions",
    description:
      "Del diseño a la realidad: automatización, calidad y consultoría de procesos. Quito · Monterrey.",
    locale: "es_EC",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BOUW | Automation & Digital Solutions",
    description:
      "Del diseño a la realidad: automatización, calidad y consultoría de procesos.",
  },
  /*
   * Sin `icons`: favicon.ico, icon.png, apple-icon.png y opengraph-image.png
   * viven en src/app/ y Next.js arma las etiquetas solo. Los genera
   * Bouw/logo/web.py desde el vector del logo.
   */
};

export const viewport: Viewport = {
  themeColor: "#f3f0ea",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} ${instrument.variable} h-full antialiased`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        {/* El modo que eligió el visitante, antes de pintar: sin destello */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {/*
          Sin cursor propio: escondía la flecha del sistema y la cambiaba por
          un punto con anillo. Es de los recursos que más delatan una web de
          plantilla, y a quien viene a contratar le quita lo único que espera
          encontrar donde siempre.
        */}
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
