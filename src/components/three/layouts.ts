import * as THREE from "three";

import { LAST_STAGE } from "./stages";

export { LAST_STAGE };

/**
 * Cuánto existe la palabra sólida en esta etapa.
 *
 * Se va pasado el despegue: lleva un animal encima, que deja la W en cuanto
 * la página baja (`HERO_UNTIL` en `Dragon.tsx`), y la palabra tiene que
 * seguir ahí mientras se va, o despegaría de una letra que ya no existe.
 */
export function markPresence(stage: number) {
  const entering = 1 - THREE.MathUtils.smoothstep(stage, 0.25, 0.75);
  /*
   * Ya no vuelve en contacto. Volvía abajo a la derecha, y con la escena por
   * delante de la página (para que el dragón pueda posarse encima de las
   * cosas) quedaba delante del formulario. El cierre lo pone el dragón
   * posado en "Contáctanos".
   */
  const returning = 0;
  return { entering, returning, presence: entering };
}
