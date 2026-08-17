import type { Localized } from "./content";

/**
 * Estado compartido de la escena 3D.
 *
 * La escena escribe aquí en cada frame y la interfaz lo lee cuando quiere.
 * Es un objeto mutable a propósito: pasar la etapa por contexto de React
 * dispararía un render por cada píxel de scroll.
 */
export const sceneStage = { current: 0 };

/** Nombre de cada figura, en el mismo orden que `layouts`. */
export const FIGURES: Localized[] = [
  { es: "Marca", en: "Mark" },
  { es: "Columna", en: "Spine" },
  { es: "Carcasa", en: "Shell" },
  { es: "Tablero", en: "Dashboard" },
  { es: "Corazón", en: "Heart" },
  { es: "Engranaje", en: "Gear" },
  { es: "Cadena", en: "Chain" },
  { es: "Red", en: "Network" },
  { es: "Marca", en: "Mark" },
];
