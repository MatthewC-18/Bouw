import type { Metadata } from "next";
import LineSim from "@/components/linea/LineSim";

/*
 * La simulación de la línea a pantalla completa: lo que abre en vivo la ficha
 * de Mejora continua. La misma está dentro de la página del caso.
 */
export const metadata: Metadata = {
  title: "La línea, en marcha · simulación",
  description:
    "Simulación de una línea de producción: cómo cambian el inventario y el tiempo de cada pieza al estandarizar la preparación y atacar los reprocesos.",
  robots: { index: false, follow: false },
};

export default function LineaDemo() {
  return (
    <main className="min-h-dvh bg-navy-950 px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1280px]">
        <LineSim />
      </div>
    </main>
  );
}
