"use client";

/**
 * Lo que el visitante ha ido respondiendo por el camino.
 *
 * Las dos herramientas de la página —el cuadro de síntomas y la cuenta de
 * horas— no son adornos interactivos: producen un dato concreto sobre SU
 * operación. Si ese dato se queda dentro del componente, el visitante llega
 * al formulario y tiene que volver a escribir a mano lo que acaba de marcar,
 * que es la forma más rápida de que no escriba nada.
 *
 * Esto lo guarda y avisa a quien lo esté mirando. Es un `useSyncExternalStore`
 * de manual: un objeto, un juego de suscriptores y una función para escribir.
 * No hace falta contexto de React porque solo hay un lector.
 */

export type HoursCount = {
  /** Lo que hace a mano, en palabras del visitante. */
  task: string;
  perWeek: number;
  minutes: number;
  people: number;
  /** Coste por hora en dólares, o 0 si no lo quiso poner. */
  rate: number;
  /** Horas al año, ya calculadas. */
  hours: number;
  /** Dólares al año, o 0 si no hay tarifa. */
  cost: number;
};

export type Brief = {
  /** Ids de los síntomas marcados. */
  symptoms: string[];
  /** La última cuenta que salió, si llegó a hacer alguna. */
  count: HoursCount | null;
};

let brief: Brief = { symptoms: [], count: null };

const listeners = new Set<() => void>();

export function subscribeBrief(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getBrief() {
  return brief;
}

/**
 * El servidor no sabe nada de esto y no debe intentar adivinarlo: devuelve
 * siempre el mismo objeto vacío, así el HTML de partida coincide con el
 * primer render del cliente.
 */
const EMPTY: Brief = { symptoms: [], count: null };
export function getBriefServer() {
  return EMPTY;
}

/** Escribe y avisa. El objeto se reemplaza entero: el snapshot es inmutable. */
export function setBrief(patch: Partial<Brief>) {
  brief = { ...brief, ...patch };
  for (const fn of listeners) fn();
}
