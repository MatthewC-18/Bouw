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
  /*
   * Contador de montajes.
   *
   * Perder el contexto WebGL mata la escena de forma irrecuperable: R3F
   * revienta desde su propio bucle de animación y la página se queda sin
   * fondo. Pasa sobre todo en desarrollo, donde cada recarga en caliente deja
   * un contexto vivo detrás y el navegador acaba tirando los más viejos —
   * pero también le puede pasar a un visitante con la gráfica saturada.
   *
   * Cambiar la clave desmonta y vuelve a montar el lienzo con un contexto
   * limpio. Se espera un poco: si se remonta en el mismo instante de la
   * pérdida, el contexto nuevo nace en el mismo apuro que mató al anterior.
   */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let timer = 0;
    const born = Date.now();

    const onLost = () => {
      /*
       * Un solo reintento, y solo si la escena llegó a vivir.
       *
       * La primera versión remontaba en cada pérdida y se convirtió en una
       * tormenta: trece montajes en 1.2 segundos, cada uno pidiendo su propio
       * contexto WebGL y su propia copia del modelo. Reintentar sin freno no
       * recupera nada — agota justo el recurso que faltaba.
       *
       * Si la pérdida llega en los primeros segundos es que el equipo no da
       * para esta escena, y volver a intentarlo solo lo empeora. Si llega
       * después de un rato, es un tropiezo puntual y un montaje limpio lo
       * arregla.
       */
      if (attempt > 0 || Date.now() - born < 4000) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setAttempt(1), 800);
    };

    window.addEventListener("bouw:context-lost", onLost);
    return () => {
      window.removeEventListener("bouw:context-lost", onLost);
      window.clearTimeout(timer);
    };
  }, [attempt]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/*
        Base y halos de color.

        Los halos van con degradado radial, no con `blur(150px)`.

        Un desenfoque de ese radio obliga al navegador a rasterizar el
        elemento y difuminarlo en GPU, y aquí eran tres capas a pantalla
        completa por encima de un canvas WebGL que repinta cada fotograma. En
        gráfica integrada era, de largo, lo más caro de la página — y un
        degradado radial con el reparto adecuado da exactamente la misma
        mancha por el coste de pintar un rectángulo.
      */}
      <div className="absolute inset-0 bg-navy-950" />
      <div
        className="absolute -left-40 top-[8%] h-[820px] w-[820px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,181,207,0.10), rgba(34,181,207,0.05) 45%, transparent 72%)",
        }}
      />
      <div
        className="absolute -right-40 top-[45%] h-[800px] w-[800px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(232,119,34,0.09), rgba(232,119,34,0.04) 45%, transparent 72%)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-[700px] w-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(23,64,107,0.22), rgba(23,64,107,0.10) 45%, transparent 72%)",
        }}
      />

      {/* Rejilla técnica */}
      <div className="absolute inset-0 blueprint-dots opacity-[0.55]" />

      {/* Escena */}
      <div className="absolute inset-0">
        {mounted && <SceneRoot key={attempt} />}
      </div>

      {/* Viñeta suave: oscurece los bordes sin apagar la escena */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(4,16,31,0.42)_100%)]" />
      <div className="noise absolute inset-0" />
    </div>
  );
}
