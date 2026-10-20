/**
 * Etapas del recorrido: 0 la portada … `LAST_STAGE` contacto. Las calcula
 * `SceneRoot` a partir de las secciones; de ellas cuelgan la palabra BOUW de
 * la portada y el encuadre de la cámara.
 *
 * Va en su propio archivo, sin `three`: el panel de números (`DebugPanel`)
 * la lee y `page.tsx` lo importa siempre. Desde `layouts.ts`, que sí importa
 * `three`, metía el motor 3D entero (99 KB) en lo primero que baja la página,
 * antes que el dragón, que se carga aparte (20 oct 2026, velocidad).
 */
export const LAST_STAGE = 8;
