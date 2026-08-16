"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// El canvas 3D solo existe en el cliente y se carga después del HTML.
const SceneRoot = dynamic(() => import("./three/SceneRoot"), { ssr: false });

/**
 * Fondo persistente de todo el sitio: la escena 3D vive aquí, no dentro del
 * hero, para que las piezas de la marca puedan seguir ensamblándose sección
 * tras sección mientras el contenido pasa por encima.
 */
export default function Background() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/* Base y halos de color */}
      <div className="absolute inset-0 bg-navy-950" />
      <div className="absolute -left-40 top-[8%] h-[540px] w-[540px] rounded-full bg-cyan-brand/[0.09] blur-[150px]" />
      <div className="absolute -right-40 top-[45%] h-[520px] w-[520px] rounded-full bg-orange-brand/[0.08] blur-[150px]" />
      <div className="absolute left-1/4 bottom-0 h-[420px] w-[420px] rounded-full bg-navy-700/20 blur-[150px]" />

      {/* Rejilla técnica */}
      <div className="absolute inset-0 grid-lines opacity-[0.55]" />

      {/* Escena */}
      <div className="absolute inset-0">{mounted && <SceneRoot />}</div>

      {/* Viñeta: mantiene el texto legible por encima del 3D */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(4,16,31,0.55)_100%)]" />
      <div className="noise absolute inset-0" />
    </div>
  );
}
