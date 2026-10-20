import type { CSSProperties } from "react";

/**
 * La luz de color de una sección, para que el color no se acabe en Proyectos.
 *
 * Matthew, 19 oct 2026: «el cambio de los proyectos a lo de abajo siento que
 * va de algo colorido a algo más sobrio, y ese cambio no me gusta; pon
 * colores sutiles». Cada sección de abajo lleva su tono, con la misma luz e
 * intensidad que los de los proyectos (solo gira el tono): dos manchas suaves
 * en esquinas opuestas y una raya que brilla en el borde de arriba. Nada de
 * fondos de color a sangre: alternar secciones de colores ya se descartó.
 *
 * Va como primer hijo de la sección, debajo del contenido. El dragón lee el
 * mismo tono (`data-tone` en la sección) y se le tiñe el borde al posarse.
 */
export default function Tone({ hue, line = true }: { hue: number; line?: boolean }) {
  return (
    <>
      <span aria-hidden className="tone-glow" style={{ "--t-h": hue } as CSSProperties} />
      {line && <span aria-hidden className="tone-line" style={{ "--t-h": hue } as CSSProperties} />}
    </>
  );
}
