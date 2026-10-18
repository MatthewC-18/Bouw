"use client";

import { Check, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

/** Milisegundos por letra al escribir y al borrar, y la pausa con la palabra entera. */
const TYPE = 70;
const ERASE = 28;
const HOLD = 1500;

/**
 * Las palabras con que se busca el servicio, en grande.
 *
 * Matthew, 18 oct 2026: «quiero que las palabras clave de calidad se vean
 * cool y llamativas; el chiste es vender directo con las palabras que ellos
 * busquen, porque no van a leer todo».
 *
 * Arriba, un buscador que escribe solo cada palabra, como la teclearía quien
 * busca, y en cuanto la termina responde «Lo hacemos». Debajo, todas las
 * palabras a la vista y en grande (las tres primeras, más), con la que se
 * está buscando subrayada a rotulador. Pasar el ratón por una la busca.
 *
 * Solo escribe mientras se ve. Con menos movimiento pedido, el buscador
 * muestra la primera palabra quieta y no hay rotulador que corra.
 */
export default function KeywordSearch({ words }: { words: string[] }) {
  const { lang } = useLang();
  const [on, setOn] = useState(0);
  const [typed, setTyped] = useState(words[0] ?? "");
  const [done, setDone] = useState(true);
  const [still, setStill] = useState(true);
  const [visible, setVisible] = useState(false);
  const hover = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Escribir, esperar, borrar y pasar a la siguiente
  useEffect(() => {
    if (still || !visible) return;
    const word = words[on];
    let i = 0;
    let timer = 0;
    setTyped("");
    setDone(false);
    const type = () => {
      i++;
      setTyped(word.slice(0, i));
      if (i < word.length) timer = window.setTimeout(type, TYPE);
      else {
        setDone(true);
        timer = window.setTimeout(erase, HOLD);
      }
    };
    const erase = () => {
      // Con el ratón encima de una palabra, el buscador se queda en ella
      if (hover.current === on) {
        timer = window.setTimeout(erase, 400);
        return;
      }
      setDone(false);
      i--;
      setTyped(word.slice(0, Math.max(i, 0)));
      if (i > 0) timer = window.setTimeout(erase, ERASE);
      else timer = window.setTimeout(() => setOn((n) => (hover.current ?? n + 1) % words.length), 160);
    };
    timer = window.setTimeout(type, 220);
    return () => window.clearTimeout(timer);
  }, [on, still, visible, words]);

  const pick = (i: number | null) => {
    hover.current = i;
    if (i !== null && i !== on) setOn(i);
  };

  return (
    <div ref={root} data-dragon-ignore>
      {/* El buscador */}
      <div
        aria-hidden
        className="flex h-12 items-center gap-3 rounded-full border border-(--p-line) bg-(--p-window) pl-4 pr-1.5 shadow-[0_14px_34px_-22px_var(--p-shadow)]"
      >
        <Search className="h-4 w-4 shrink-0 text-(--p-accent)" strokeWidth={2.2} />
        <span className="min-w-0 truncate font-mono text-[14px] text-ink">
          {typed}
          <span className={`kw-caret ml-px inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-(--p-accent) ${still ? "opacity-0" : ""}`} />
        </span>
        <span
          className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-(--p-accent) px-3 py-1.5 text-[12px] font-semibold text-(--p-on-accent) transition-[opacity,translate] duration-300 ${
            done ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
          }`}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          {lang === "es" ? "Lo hacemos" : "We do it"}
        </span>
      </div>

      {/* Todas las palabras, en grande */}
      <ul className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1.5" onMouseLeave={() => pick(null)}>
        {words.map((w, i) => {
          const active = i === on;
          const big = i < 3;
          return (
            <li key={w} onMouseEnter={() => pick(i)}>
              <span
                className={`kw-word font-display font-bold leading-[1.15] tracking-[-0.01em] transition-colors duration-300 ${
                  big ? "text-[clamp(2rem,3.4vw,2.75rem)]" : "text-[clamp(1.1rem,1.55vw,1.35rem)]"
                } ${active ? "kw-on text-(--p-accent)" : big ? "text-ink" : "text-ink-soft"}`}
              >
                {w}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
