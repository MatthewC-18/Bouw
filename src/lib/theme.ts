"use client";

import { useSyncExternalStore } from "react";

/**
 * Modo claro y modo oscuro.
 *
 * Matthew (4 oct 2026): «quiero el claro y el oscuro para que el usuario
 * pueda cambiar entre modos». La página nace en claro —es el que él prefiere—
 * y recuerda lo que elija cada visitante. El modo vive en `data-theme` de
 * `<html>`: lo pone un script en línea antes de pintar (ver `layout.tsx`),
 * así no hay destello de un modo al otro, y las variables de color de
 * `globals.css` hacen el resto.
 */
export type Theme = "light" | "dark";

export const THEME_KEY = "bouw-theme";
const EVENT = "bouw:theme";

/** Script que corre antes de pintar: aplica el modo guardado. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Sin almacenamiento (ventana privada): el cambio vale para esta visita
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: theme }));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** El modo actual, y se vuelve a pintar quien lo use cuando cambia. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "light");
}
