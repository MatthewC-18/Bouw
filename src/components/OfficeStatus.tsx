"use client";

import { useEffect, useState } from "react";
import { OFFICES, OFFICE_STATUS } from "@/lib/content";
import { useLang } from "@/lib/i18n";

/**
 * Estado de las dos sedes, en vivo.
 *
 * Ocupa el sitio donde estaba la fila de métricas de la portada — "7+ años",
 * "2 sedes", "4 industrias", "3D"— que es el elemento más repetido de las
 * páginas generadas y el que menos dice: tres de esas cuatro cifras estaban
 * ya escritas en el párrafo de encima.
 *
 * Esto responde la única pregunta que alguien tiene de verdad en el primer
 * pantallazo: si escribo ahora, ¿me contesta alguien? La hora sale de la zona
 * IANA de cada sede, así que el horario de verano y los cambios de huso los
 * resuelve el navegador y no una resta escrita a mano que caduca.
 */

type Local = { time: string; open: boolean } | null;

const PLACEHOLDER = "--:--";

/**
 * Hora y día de la semana en una zona, sin librerías.
 *
 * `h23` es explícito porque con `hour12: false` a secas hay motores que
 * devuelven "24" a medianoche, y eso rompe tanto la comparación como lo que
 * se lee en pantalla.
 */
function readZone(zone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  return {
    hour: Number(map.hour),
    minute: map.minute,
    weekday: map.weekday,
  };
}

export default function OfficeStatus() {
  const { t } = useLang();
  /*
   * Arranca vacío a propósito.
   *
   * El HTML lo pinta el servidor y ahí no hay hora del visitante que valga:
   * cualquier valor que pusiera sería distinto del que calcula el navegador
   * al montar, y React se quejaría de la discrepancia. Con los guiones, el
   * hueco ya tiene su tamaño y el número entra sin mover nada de sitio.
   */
  const [locals, setLocals] = useState<Local[]>(() => OFFICES.map(() => null));

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLocals(
        OFFICES.map((o) => {
          const { hour, minute, weekday } = readZone(o.zone, now);
          const weekend = weekday === "Sat" || weekday === "Sun";
          return {
            time: `${String(hour).padStart(2, "0")}:${minute}`,
            open: !weekend && hour >= o.opens && hour < o.closes,
          };
        }),
      );
    };

    tick();
    // Medio minuto: lo que se muestra son minutos, y un intervalo más corto
    // solo despierta al hilo que está pintando la escena 3D
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const known = locals.some(Boolean);
  const someone = locals.some((l) => l?.open);

  return (
    <div className="mt-16 max-w-2xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
        {t(OFFICE_STATUS.eyebrow)}
      </p>

      <div className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {OFFICES.map((o, i) => {
          const local = locals[i];
          return (
            <div key={o.city} className="border-l border-white/10 pl-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">
                {o.city}
              </p>
              <div className="mt-1.5 flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold tabular-nums text-ink">
                  {local?.time ?? PLACEHOLDER}
                </span>
                {local && (
                  <span
                    className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] ${
                      local.open ? "text-cyan-light" : "text-ink-dim"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full ${
                        local.open ? "bg-cyan-brand" : "bg-ink-dim/50"
                      }`}
                    />
                    {t(local.open ? OFFICE_STATUS.open : OFFICE_STATUS.closed)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/*
        Antes de saber la hora se enseña el dato fijo —el solape de las dos
        sedes— en vez de un hueco. Sigue siendo cierto a cualquier hora.
      */}
      <p className="mt-6 text-[15px] leading-relaxed text-ink-soft" aria-live="polite">
        {known
          ? t(someone ? OFFICE_STATUS.someone : OFFICE_STATUS.nobody)
          : t(OFFICE_STATUS.overlap)}
      </p>
    </div>
  );
}
