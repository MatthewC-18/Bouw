"use client";

/**
 * Dónde está el dragón, en pantalla.
 *
 * Lo escribe el bucle de render y lo lee el propio dragón para dos cosas que
 * pasan en la página y no en la escena: saber si el ratón está cerca (abre
 * las alas, enciende el grabado) y colocar encima el botón invisible que se
 * pulsa para que escupa fuego.
 */
export type ScreenBlob = {
  /** Centro, en fracción de la ventana. 0 izquierda/arriba, 1 derecha/abajo. */
  x: number;
  y: number;
  /** Radio aparente, en fracción del alto de la ventana. */
  r: number;
  /** Cuánto pesa ahora mismo. A 0 el velo se olvida de él. */
  live: number;
  /** Percha en la que está o a la que va (`data-perch`), o "hero". */
  target: string;
  /** Vuela o anda: la escena se dibuja a ritmo entero mientras tanto. */
  moving: boolean;
};

export const dragonScreen: ScreenBlob = {
  x: 0.5,
  y: 0.5,
  r: 0.15,
  live: 0,
  target: "",
  moving: false,
};
