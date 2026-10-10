import * as THREE from "three";
import { WORD } from "./wordGlyphs";

/**
 * La palabra BOUW de la portada.
 *
 * Sustituye a la B de antes. La B era la marca vieja; la nueva es la palabra
 * entera con el dragón posado en la W, y la portada tiene que decir lo mismo
 * que la factura y la tarjeta. Los contornos salen de la misma fuente y el
 * mismo corte que el logo (`Bouw/logo/palabra_web.py`), no de una parecida.
 *
 * Todo en coordenadas locales de la palabra: centrada en X e Y, con Z = 0 a
 * media profundidad de la extrusión. La cara de delante mira a +Z.
 */

/** Ancho de la palabra en mundo, sin bisel. */
export const WORD_WIDTH = 5.4;
const UNIT = WORD_WIDTH / WORD.width;
/** Alto de la tinta: de la base a lo más alto de la W. */
export const WORD_HEIGHT = WORD.wTopY * UNIT;
export const WORD_DEPTH = 0.42;

export const WORD_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: WORD_DEPTH,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.022,
  bevelOffset: 0,
  bevelSegments: 3,
  curveSegments: 10,
};

const toX = (x: number) => x * UNIT - WORD_WIDTH / 2;
const toY = (y: number) => y * UNIT - WORD_HEIGHT / 2;

/**
 * Las letras, cada una con sus formas y agujeros.
 *
 * Una geometría por letra y no una para la palabra: entran por separado al
 * montarse y la W tiene que poder acusar el peso del dragón al posarse.
 */
export function letterShapes(): { char: string; shapes: THREE.Shape[] }[] {
  return WORD.glyphs.map((g) => {
    const path = new THREE.ShapePath();
    for (const c of g.cmds) {
      const n = c as readonly (string | number)[];
      const v = (i: number) => n[i] as number;
      switch (n[0]) {
        case "M":
          path.moveTo(toX(v(1)), toY(v(2)));
          break;
        case "L":
          path.lineTo(toX(v(1)), toY(v(2)));
          break;
        case "Q":
          path.quadraticCurveTo(toX(v(1)), toY(v(2)), toX(v(3)), toY(v(4)));
          break;
        case "C":
          path.bezierCurveTo(
            toX(v(1)),
            toY(v(2)),
            toX(v(3)),
            toY(v(4)),
            toX(v(5)),
            toY(v(6)),
          );
          break;
      }
    }
    // `toShapes` decide sólido o agujero por anidamiento, no por sentido de
    // giro: los huecos de la B y la O salen solos
    return { char: g.char, shapes: path.toShapes() };
  });
}

/** Extrusión centrada en Z: la cara de delante en +Z. */
export function letterGeometry(shapes: THREE.Shape[]) {
  const g = new THREE.ExtrudeGeometry(shapes, WORD_EXTRUDE);
  g.translate(0, 0, -WORD_DEPTH / 2);
  return g;
}

/**
 * Dónde se posa el dragón, en local de la palabra.
 *
 * En el vértice central de la W, que es el tramo plano más ancho de arriba y
 * cae debajo del cuerpo en el logo. La altura es la del bisel: el bisel
 * ensancha el contorno hacia fuera a media profundidad, y ahí es donde
 * apoyan las garras.
 */
const [apexFrom, apexTo] = WORD.wTop[1];
export const PERCH_LOCAL = new THREE.Vector3(
  toX((apexFrom + apexTo) / 2),
  WORD_HEIGHT / 2 + (WORD_EXTRUDE.bevelSize ?? 0),
  0,
);

/** Índice de la W entre las letras. */
export const W_INDEX = WORD.glyphs.findIndex((g) => g.char === "W");

/** Alto visible a profundidad 0 con la cámara en los extremos (fov 38, z 10.5). */
const VIEW_HEIGHT = 2 * 10.5 * Math.tan(THREE.MathUtils.degToRad(19));

type Placement = { position: THREE.Vector3; scale: number };

/**
 * Colocación de la palabra.
 *
 * En la portada, a la derecha del titular y por debajo de su línea de base,
 * en la franja que dejan libre el párrafo y los botones: compuesta contra
 * 1536 × 864, la palabra va de 780 a 1420 px y la W cae a la altura de los
 * botones. El dragón posado, con las alas arriba, ocupa el hueco de encima.
 *
 * En el móvil no hay derecha: el titular ocupa el ancho entero. Ahí la
 * palabra va arriba, centrada, en la franja que la portada le deja libre
 * entre la barra y el titular (ver el `pt` del móvil en `Hero`). Entre medias
 * —tabletas— se encoge y sube detrás del párrafo, con el velo delante.
 *
 * En contacto, abajo a la derecha y algo más pequeña: es el único hueco que
 * no cae detrás de "Contáctanos" ni del formulario, y es hacia donde escupe
 * el fuego el bicho, que se sostiene arriba a la izquierda.
 *
 * `spread` es el de `spreadFor`: se recibe y no se importa porque `scenes.ts`
 * ya depende de `layouts.ts`, y `layouts.ts` de esto.
 */
export function wordPlacement(
  aspect: number,
  spread: number,
  out: Placement,
  { mobile = false, closing = 0 }: { mobile?: boolean; closing?: number } = {},
) {
  const visible = VIEW_HEIGHT * aspect;
  if (mobile) {
    // Centrada en lo que mira la cámara de la portada, a un cuarto de alto
    out.scale = (visible * 0.8) / WORD_WIDTH;
    out.position.set(-2.4 * spread * 0.55, VIEW_HEIGHT * (0.5 - 0.255), 0);
  } else {
    out.scale = Math.min(1, (visible * 0.6) / WORD_WIDTH);
    out.position.set(1.45 * Math.pow(spread, 1.5), -1.45 + 2.6 * (1 - spread), 0);
  }
  if (closing > 0) {
    const x = 3.1 * spread;
    const y = -2.05;
    const scale = Math.min(0.8, (visible * 0.5) / WORD_WIDTH);
    out.position.x += (x - out.position.x) * closing;
    out.position.y += (y - out.position.y) * closing;
    out.scale += (scale - out.scale) * closing;
  }
  return out;
}
