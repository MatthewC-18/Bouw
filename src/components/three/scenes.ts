/*
 * Aquí vivían los escenarios del vuelo por secciones: un circuito por sección
 * y un arco entre cada dos. Se fueron con el dragón posado (2 oct 2026; ver
 * `Dragon.tsx`). Queda la compresión por aspecto, que la siguen usando la
 * cámara y la palabra de la portada.
 */

/**
 * Compresión horizontal según el aspecto de la ventana.
 *
 * Los escenarios están compuestos contra un encuadre ancho: en la portada el
 * bicho vuela a la derecha del titular, y en Proyectos alterna de un margen al
 * otro. Nada de eso cabe en una ventana casi cuadrada — medido en una de
 * 961 × 910, el centro de la órbita de portada caía al 124 % del ancho, o sea
 * fuera de pantalla entera.
 *
 * Y no se veía venir: el bicho seguía ahí, del tamaño correcto, girando y
 * aleteando. Solo que a la derecha del borde.
 *
 * Así que el reparto lateral se encoge con el aspecto. La referencia es 16:9,
 * donde vale 1; por debajo se comprime hacia el eje de cámara. El suelo evita
 * que en una ventana muy estrecha todo se apelotone en el centro.
 */
const REFERENCE_ASPECT = 16 / 9;

export function spreadFor(aspect: number): number {
  const r = aspect / REFERENCE_ASPECT;
  return Math.min(Math.max(r * r, 0.3), 1);
}
