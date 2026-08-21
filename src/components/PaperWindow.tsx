"use client";

/**
 * Troquel.
 *
 * Una ventana recortada entre los dos pliegos del dossier: el plano se abre y
 * la escena 3D pasa por el hueco sin nada delante. Es el argumento de la
 * empresa dicho en materiales —lo digital atravesando lo impreso— y el único
 * punto del recorrido donde el dragón se ve a plena luz, sin pliego encima.
 *
 * Sin rótulo: llevaba uno que decía "Troquel · escena viva". Un sitio serio no
 * le pone letrero a sus propios recursos — o el recurso se explica solo, o
 * sobra.
 */
export default function PaperWindow() {
  return (
    <div className="relative">
      {/* Los dos bordes de plano que enmarcan el recorte */}
      <div className="sheet h-10 w-full" />

      <div className="relative flex min-h-[62svh] items-center justify-center overflow-hidden">
        {/* Filos del troquel */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-plan-line/35"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-plan-line/35"
        />

        {/*
          Canto del troquel: el pliego se adelgaza hacia el hueco en vez de
          cortarse en seco. Es lo que hace que el recorte se lea como grosor
          de papel y no como un div que termina.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[rgba(7,26,47,0.88)] to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(7,26,47,0.88)] to-transparent"
        />

        {/* Guías de registro del troquel, en las cuatro esquinas del hueco */}
        {[
          "left-6 top-6 border-l border-t",
          "right-6 top-6 border-r border-t",
          "bottom-6 left-6 border-b border-l",
          "bottom-6 right-6 border-b border-r",
        ].map((corner) => (
          <span
            key={corner}
            aria-hidden
            className={`pointer-events-none absolute h-5 w-5 border-cyan-light/25 ${corner}`}
          />
        ))}

      </div>

      <div className="sheet h-10 w-full" />
    </div>
  );
}
