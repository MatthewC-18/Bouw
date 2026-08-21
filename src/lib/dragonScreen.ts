"use client";

/**
 * Dónde está el dragón, en pantalla.
 *
 * Lo escribe el bucle de render y lo lee el DOM. Existe por una razón
 * concreta: el velo que protege la lectura era un degradado fijo, así que
 * tenía que estar puesto para el peor caso —el bicho justo detrás del
 * párrafo— **todo el rato**. Y como el peor caso manda, el resto del tiempo
 * el velo estaba tapando una escena que no molestaba a nadie.
 *
 * Con la posición del bicho aquí, el velo puede subir solo cuando de verdad
 * pasa por detrás del texto y bajar cuando no. Deja de ser una negociación
 * entre espectáculo y legibilidad: el bicho se ve mucho más en los tres
 * cuartos del tiempo en que no estorba, y el texto queda mejor protegido en
 * el cuarto en que sí.
 */
export type ScreenBlob = {
  /** Centro, en fracción de la ventana. 0 izquierda/arriba, 1 derecha/abajo. */
  x: number;
  y: number;
  /** Radio aparente, en fracción del alto de la ventana. */
  r: number;
  /** Cuánto pesa ahora mismo. A 0 el velo se olvida de él. */
  live: number;
};

export const dragonScreen: ScreenBlob = { x: 0.5, y: 0.5, r: 0.15, live: 0 };

/**
 * Y la marca, que también tapa.
 *
 * Se le olvidaba: la B de tres dimensiones es, en contacto y en la portada, el
 * objeto más grande y más saturado de la pantalla — naranja y cián a plena
 * luz justo detrás del correo, del teléfono y del formulario. Un velo que solo
 * mira dónde anda el dragón se relaja tranquilamente mientras la marca está
 * quemando el texto por detrás.
 */
export const markScreen: ScreenBlob = { x: 0.5, y: 0.5, r: 0.2, live: 0 };
