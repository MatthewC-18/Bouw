"use client";

import { useEffect, useMemo, useState } from "react";
import { DIAGNOSIS, FIELDS, SYMPTOMS, type FieldId } from "@/lib/content";
import { HANDOFF_TIME, handoff } from "@/lib/handoff";
import { setBrief } from "@/lib/brief";
import { useLang } from "@/lib/i18n";
import Reveal from "./Reveal";

/**
 * Diagnóstico — sustituye a la rejilla de servicios.
 *
 * Lo que había: cuatro tarjetas con icono, título, descripción y tres
 * viñetas, levantándose al pasar el ratón. El bloque más repetido que existe.
 * Y sobre todo, el orden equivocado: obligaba al visitante a traducir su
 * problema al vocabulario de la consultora antes de poder leer nada.
 *
 * Aquí marca frases que reconoce y la disciplina sale como resultado. La
 * información técnica de los servicios —qué se entrega, cuánto dura— no se
 * ha perdido: aparece en el panel de la derecha, pero después de que él haya
 * dicho lo que le pasa.
 *
 * Y lo que marque se lo lleva al formulario, para que no tenga que volver a
 * escribirlo con sus palabras diez segundos después de haberlo marcado.
 */
export default function Diagnosis() {
  const { t, lang } = useLang();
  const [picked, setPicked] = useState<string[]>([]);
  const [taken, setTaken] = useState(false);

  const toggle = (id: string) => {
    setTaken(false);
    setPicked((prev) => {
      const had = prev.includes(id);
      /*
       * Y la escena acusa recibo.
       *
       * Marcar manda una tanda de piezas de la marca hacia el dragón;
       * desmarcar las devuelve. No es adorno: es la única forma que tiene el
       * fondo de demostrar que ha oído lo que el visitante acaba de decir, y
       * ocurre solo cuando él actúa — así que no compite con la lectura.
       * Ver `handoff` y `AssemblyField`.
       */
      handoff.pulse = had ? -HANDOFF_TIME : HANDOFF_TIME;
      return had ? prev.filter((p) => p !== id) : [...prev, id];
    });
  };

  const chosen = useMemo(
    () => SYMPTOMS.filter((s) => picked.includes(s.id)),
    [picked],
  );

  /*
   * Las disciplinas salen en el orden de `FIELDS`, no en el orden en que se
   * marcaron los síntomas: así el panel no baila cada vez que se toca una
   * casilla. Y se quitan las necesidades repetidas — con cuatro síntomas
   * marcados, "una copia del archivo" salía tres veces.
   */
  const fields = useMemo(() => {
    const hit = new Set<FieldId>();
    for (const s of chosen) for (const f of s.fields) hit.add(f);
    return FIELDS.filter((f) => hit.has(f.id));
  }, [chosen]);

  const needs = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of chosen) {
      const text = t(s.needs);
      if (seen.has(text)) continue;
      seen.add(text);
      out.push(text);
    }
    return out;
  }, [chosen, t]);

  /*
   * Lo marcado se publica en cuanto se marca, no al pulsar "llévalo".
   *
   * Antes solo salía de aquí con el botón, y eso dejaba el dato encerrado en
   * la sección hasta el último momento. Ahora la barra de navegación lo lleva
   * encima mientras baja —"Diagnóstico 4"— y el formulario lo tiene escrito
   * antes de llegar. El botón sigue haciendo lo suyo: llevarte allí.
   */
  useEffect(() => {
    setBrief({ symptoms: picked });
  }, [picked]);

  const carry = () => {
    setBrief({ symptoms: picked });
    setTaken(true);
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="servicios"
      className="veil relative border-y border-white/[0.06] py-28 lg:py-40"
    >
      <div className="pointer-events-none absolute inset-0 z-0 blueprint-dots opacity-25" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-light">
            {t(DIAGNOSIS.eyebrow)}
          </p>
          <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.06] text-ink">
            {t(DIAGNOSIS.title)}
          </h2>
          <p className="mt-6 text-[17px] leading-relaxed text-ink-soft">
            {t(DIAGNOSIS.subtitle)}
          </p>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Los síntomas: filas con filete, no tarjetas */}
          <ul className="border-t border-white/10">
            {SYMPTOMS.map((s) => {
              const on = picked.includes(s.id);
              return (
                <li key={s.id} className="border-b border-white/10">
                  <label
                    data-cursor="link"
                    className="flex cursor-pointer items-start gap-4 py-5 transition-colors duration-200 hover:bg-white/[0.02]"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(s.id)}
                      className="peer sr-only"
                    />
                    {/*
                      Un cuadrado, no un círculo ni un interruptor: esto es
                      una casilla de una hoja de inspección, y el resto de la
                      página está dibujada con esa misma regla.
                    */}
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-colors duration-200 ${
                        on
                          ? "border-cyan-brand bg-cyan-brand text-navy-950"
                          : "border-white/25 text-transparent"
                      }`}
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8.5l3.2 3.2L13 4.8" />
                      </svg>
                    </span>
                    <span
                      className={`text-[16px] leading-snug transition-colors duration-200 ${
                        on ? "text-ink" : "text-ink-soft"
                      }`}
                    >
                      {t(s.label)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {/* El resultado */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-white/10 bg-navy-950/80 p-7 sm:p-9">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
                {picked.length === 0
                  ? lang === "es"
                    ? "Sin marcar"
                    : "Nothing ticked"
                  : `${picked.length} ${
                      lang === "es"
                        ? picked.length === 1
                          ? "marcado"
                          : "marcados"
                        : "ticked"
                    }`}
              </p>

              {picked.length === 0 ? (
                <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">
                  {t(DIAGNOSIS.empty)}
                </p>
              ) : (
                <div className="mt-7 space-y-9">
                  <section>
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-light">
                      {t(DIAGNOSIS.fieldsTitle)}
                    </h3>
                    <ul className="mt-4 space-y-4">
                      {fields.map((f) => (
                        <li key={f.id}>
                          <p className="flex items-baseline justify-between gap-4 font-display text-base font-bold text-ink">
                            {t(f.name)}
                            <span className="shrink-0 font-mono text-[11px] font-normal tracking-wider text-ink-dim">
                              {t(f.span)}
                            </span>
                          </p>
                          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-dim">
                            {t(f.delivers)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-light">
                      {t(DIAGNOSIS.movesTitle)}
                    </h3>
                    <ol className="mt-4 space-y-4">
                      {chosen.map((s, i) => (
                        <li key={s.id} className="flex gap-3">
                          <span className="mt-0.5 shrink-0 font-mono text-[11px] text-ink-dim">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <p className="text-[15px] leading-relaxed text-ink-soft">
                            {t(s.firstMove)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </section>

                  <section>
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-light">
                      {t(DIAGNOSIS.needsTitle)}
                    </h3>
                    <ul className="mt-4 space-y-2">
                      {needs.map((n) => (
                        <li key={n} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-dim">
                          <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-cyan-brand/60" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <button
                    type="button"
                    onClick={carry}
                    data-cursor="link"
                    className="w-full bg-cyan-brand px-6 py-3.5 text-sm font-semibold text-navy-950 transition-colors duration-300 hover:bg-cyan-light"
                  >
                    {taken ? t(DIAGNOSIS.taken) : t(DIAGNOSIS.cta)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
