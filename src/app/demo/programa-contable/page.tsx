import type { Metadata } from "next";
import Workbook from "@/components/contable/Workbook";

/*
 * La réplica del programa contable, a pantalla completa. Es lo que abre la
 * ficha del proyecto en vivo (dentro de un marco) y lo que se abre en otra
 * pestaña. No se indexa: es una demostración, no una página del sitio.
 */
export const metadata: Metadata = {
  title: "Programa contable · demostración",
  description:
    "Réplica del programa contable en Excel con datos de demostración: ventas, kits, inventario y tablero conectados.",
  robots: { index: false, follow: false },
};

export default function ProgramaContableDemo() {
  return <Workbook />;
}
