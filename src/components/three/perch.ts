import * as THREE from "three";

/**
 * El apoyo del dragón en la W.
 *
 * Lo escribe la palabra y lo lee el dragón, en ese orden: R3F ejecuta los
 * `useFrame` en orden de montaje y la palabra se monta antes. Va aparte de
 * los dos componentes porque es de los dos: la palabra dice dónde está la W
 * —se mueve con el ratón y bota al recibir el peso— y el dragón dice cuándo
 * aterriza.
 */
export const perch = {
  /** Mundo del punto de apoyo: posición y giro de la letra. */
  matrix: new THREE.Matrix4(),
  /** Escala de la palabra en mundo; el dragón posado se escala con ella. */
  scale: 1,
  /** Cuánto existe la palabra: 0 sin palabra, 1 montada y entera. */
  live: 0,
  /** Ya se escribió una vez: antes de eso la matriz no vale. */
  ready: false,
  /** Impulso del aterrizaje, en velocidad. Lo deja el dragón, lo gasta la W. */
  kick: 0,
  /**
   * Cuánto ha subido la palabra con la página, en mundo.
   *
   * El lienzo es fijo y la portada no: sin esto la palabra se quedaba
   * clavada en la pantalla mientras el titular se iba hacia arriba, y medio
   * segundo después flotaba encima de la sección de proyectos. Las piezas
   * que salen de ella lo leen para salir de donde está de verdad.
   */
  lift: 0,
};
