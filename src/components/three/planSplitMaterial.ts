"use client";

import * as THREE from "three";

/**
 * El divisor plano / realidad, disponible para cualquier material.
 *
 * Nació dentro del dragón y se quedó ahí: los uniformes vivían en su objeto
 * privado y el corte solo sabía partir a la criatura. Pero el divisor es una
 * frontera de PANTALLA — dice "a la izquierda de esta línea todavía no hay
 * materia"— y una frontera que solo afecta a un objeto de la escena se
 * desmiente sola: la marca de la empresa seguía siendo metal pulido justo al
 * lado del ala en plano.
 *
 * Aquí los uniformes son de la escena, no de un componente. El dragón sigue
 * siendo quien los escribe cada fotograma —es el que ya lee `planSplit`— y
 * todo lo demás los lee desde el mismo objeto.
 */
export const splitUniforms = {
  /** Posición del corte, 0 … 1 del ancho del búfer de dibujo. */
  uSplit: { value: 0.74 },
  /** Cuánto manda el corte. 0 fuera de la portada. */
  uSplitAmt: { value: 0 },
  /** Tamaño del búfer, para pasar de `gl_FragCoord` a fracción de pantalla. */
  uViewport: { value: new THREE.Vector2(1, 1) },
};

/** Tinta y papel del plano. Los mismos valores que usa el dragón. */
const PLAN_GLSL = /* glsl */ `
  const vec3 BOUW_PLAN_LINE = vec3(0.31, 0.84, 0.91);
  const vec3 BOUW_PLAN_DARK = vec3(0.016, 0.063, 0.122);
`;

/** Fracción horizontal del píxel actual, 0 borde izquierdo … 1 derecho. */
const SCREEN_X = "gl_FragCoord.x / max(uViewport.x, 1.0)";

type Patchable = THREE.Material & {
  onBeforeCompile: THREE.Material["onBeforeCompile"];
};

/**
 * Convierte un material iluminado en plano a la izquierda del corte.
 *
 * Requiere `vViewPosition` y `normal`, así que vale para los materiales PBR
 * (`MeshStandardMaterial`, `MeshPhysicalMaterial`) y no para los planos.
 *
 * La mezcla va al final del todo, después del tono y del espacio de color:
 * el plano no es una variante de iluminación del material, es lo que hay
 * ANTES de que haya material. Mezclarlo aquí deja el PBR intacto del lado de
 * la realidad.
 *
 * `ribAxis` elige sobre qué eje local corren las secciones. En la letra son
 * horizontales —el eje Y— porque es como se secciona un alzado; en una pieza
 * alargada tendrían que ir por su eje largo.
 */
export function applyPlanSplit(
  mat: Patchable,
  { ribAxis = "y", ribScale = 1.4 }: { ribAxis?: "x" | "y" | "z"; ribScale?: number } = {},
) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, splitUniforms);

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vPlanLocal;`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\n             vPlanLocal = position;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uSplit;
         uniform float uSplitAmt;
         uniform vec2 uViewport;
         varying vec3 vPlanLocal;
${PLAN_GLSL}`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
         if (uSplitAmt > 0.001) {
           float sx = ${SCREEN_X};
           // 1 del lado de la realidad, 0 del lado del plano
           float real = smoothstep(uSplit - 0.0025, uSplit + 0.0025, sx);

           // Secciones transversales, como las cuadernas de un plano
           float sec = abs(fract(vPlanLocal.${ribAxis} * ${ribScale.toFixed(2)}) - 0.5);
           float rib = 1.0 - smoothstep(0.015, 0.06, sec);
           // De canto la línea se cierra sola y da la silueta
           float fres = pow(
             1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);

           /*
            * Algo más de tinta que en el dragón, a propósito.
            *
            * La letra vive en el tercio izquierdo de la portada, que es
            * justo donde el velo del titular va al 90 %: con la misma dosis
            * que la piel del bicho el plano quedaba en un rectángulo oscuro
            * sin dibujo dentro.
            */
           vec3 plan = BOUW_PLAN_DARK + BOUW_PLAN_LINE * (rib * 0.7 + fres * 1.15);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, plan, (1.0 - real) * uSplitAmt);

           // La línea viva justo en el corte: es donde está pasando
           float seam = 1.0 - smoothstep(0.0, 0.004, abs(sx - uSplit));
           gl_FragColor.rgb += BOUW_PLAN_LINE * seam * uSplitAmt * 1.1;
         }`,
      );
  };
  // Sin esto, three reutiliza el programa ya compilado de otro material con
  // los mismos ajustes y el parche no llega a entrar
  mat.customProgramCacheKey = () => `bouw-plan-${ribAxis}-${ribScale}`;
  mat.needsUpdate = true;
}

/**
 * Deja un material existir solo a un lado del corte.
 *
 * `plan` para el calco de aristas —un plano sin sus líneas es una mancha
 * azul— y `real` para lo que solo tiene sentido cuando ya hay materia: la
 * señal corriendo por el circuito, que en un dibujo técnico no existe.
 */
export function applyPlanFade(mat: Patchable, side: "plan" | "real") {
  mat.transparent = true;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, splitUniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uSplit;
         uniform float uSplitAmt;
         uniform vec2 uViewport;`,
      )
      .replace(
        "#include <premultiplied_alpha_fragment>",
        `if (uSplitAmt > 0.001) {
           float sx = ${SCREEN_X};
           float real = smoothstep(uSplit - 0.0025, uSplit + 0.0025, sx);
           gl_FragColor.a *= mix(1.0, ${side === "plan" ? "1.0 - real" : "real"}, uSplitAmt);
         }
         #include <premultiplied_alpha_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => `bouw-fade-${side}`;
  mat.needsUpdate = true;
}
