import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Cursor from "@/components/Cursor";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
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
