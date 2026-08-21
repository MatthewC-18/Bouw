"use client";

/**
 * Lo que el visitante contesta, dicho en la escena.
 *
 * El cuadro de síntomas del diagnóstico es lo único de la página donde el
 * visitante afirma algo sobre sí mismo. Hasta ahora eso se quedaba en el DOM:
 * marcabas cuatro frases, salía una disciplina, y el fondo seguía a lo suyo.
 *
 * Esto es el cable entre las dos cosas. Cada casilla que marcas manda una
 * tanda de piezas de la marca hacia el dragón; cada una que quitas las hace
 * volver. La maquinaria ya existía —el campo de piezas alimenta al bicho
 * mientras se construye— y lo único que faltaba era darle una segunda razón
 * para arrancar que no fuera el scroll.
 *
 * Por qué en un objeto y no por estado de React: lo lee el bucle de render,
 * sesenta veces por segundo, dentro del lienzo. Un `useState` aquí sería
 * volver a montar el árbol de la escena cada vez que alguien marca una
 * casilla.
 */
export const handoff = {
  /**
   * Impulso con signo, en segundos de vida que le quedan.
   *
   * Positivo: acabas de marcar algo y las piezas van hacia el dragón.
   * Negativo: acabas de quitarlo y vuelven al sitio. Cero: reposo.
   *
   * Lo consume y lo descuenta el campo de piezas, que es el único que lo lee.
   */
  pulse: 0,
};

/** Cuánto dura la tanda de cada respuesta, en segundos. */
export const HANDOFF_TIME = 2.4;
