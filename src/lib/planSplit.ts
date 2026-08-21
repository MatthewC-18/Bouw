"use client";

/**
 * Estado del divisor plano / realidad.
 *
 * El control vive en el DOM —hay que poder arrastrarlo— y el corte ocurre en
 * el shader. Entre los dos va este objeto: se escribe al arrastrar y se lee
 * dentro del bucle de render. Por estado de React sería un render por
 * fotograma de arrastre, y por evento sería un `CustomEvent` por fotograma.
 */
export const planSplit = {
  /**
   * Posición del corte, 0 … 1 del ancho de la ventana.
   *
   * Arranca al 74 % porque es donde vuela el dragón en la portada —medido con
   * el panel: entre el 72 y el 78 %—. Estaba al 58 %, o sea que al cargar el
   * bicho quedaba entero del lado "realidad" y no se veía ningún corte: había
   * que arrastrar a ciegas para descubrir que el control hacía algo.
   *
   * Con el corte encima del animal, la mitad de él es plano y la otra mitad
   * materia desde el primer fotograma. El control se explica sin tocarlo.
   */
  x: 0.74,
  /** Cuánto manda el corte. Se apaga al salir la portada de pantalla. */
  amount: 0,
  /**
   * Cuánto se está usando el corte ahora mismo, 0 … 1.
   *
   * Distinto de `amount`, que solo dice si la portada está en pantalla. Esto
   * dice si hay alguien al otro lado: sube durante la pasada de presentación,
   * mientras el puntero está sobre la portada y mientras se arrastra, y baja
   * al soltar y salir.
   *
   * Existe porque el corte pasa por encima del titular, y un titular
   * permanentemente medio dibujado se lee mal. Con esto el efecto sobre las
   * letras solo aparece cuando hay un gesto que lo explique.
   */
  engage: 0,
};
