"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DIAGNOSIS, FIELDS, SYMPTOMS, type FieldId } from "@/lib/content";
import { setBrief } from "@/lib/brief";
import { useLang } from "@/lib/i18n";
import Reveal from "./Reveal";
import Tone from "./Tone";

/**
 * Diagnóstico — sustituye a la rejilla de servicios.
 *
 * Lo que había: cuatro tarjetas con icono, título, descripción y tres
 * viñetas, levantándose al pasar el ratón. El bloque más repetido que existe.
 * Y sobre todo, el orden equivocado: obligaba al visitante a traducir su
 * problema al vocabulario de la consultora antes de poder leer nada.
 *
 * Aquí toca frases que reconoce y la disciplina sale como resultado. La
 * información técnica de los servicios —qué se entrega, cuánto dura— no se
 * ha perdido: aparece en el panel de la derecha, pero después de que él haya
 * dicho lo que le pasa.
 *
 * Y lo que toque se lo lleva al formulario, para que no tenga que volver a
 * escribirlo con sus palabras diez segundos después.
 *
 * 19 oct 2026: eran casillas de una lista, y «lo de marcar» no le gusta a
 * Matthew; quería algo que se toque y dé información al momento. Ahora cada
 * frase es una tarjeta: al tocarla se enciende y debajo sale lo primero que
 * haríamos, ahí mismo. En el teléfono el resumen queda muy abajo, y así la
 * respuesta aparece donde se tocó.
 */
export default function Diagnosis() {
  const { t, lang } = useLang();
  const [picked, setPicked] = useState<string[]>([]);
  const [taken, setTaken] = useState(false);

  const toggle = (id: string) => {
    setTaken(false);
    /*
     * Y el dragón se posa en la respuesta.
     *
     * Al marcar una frase vuela a la esquina de la tarjeta de resultado, que
     * es una percha que solo se usa así (`data-perch-focus`): presenta lo que
     * la página acaba de contestar. Es su forma de decir que ha oído lo que
     * el visitante acaba de contar.
     */
    if (!picked.includes(id)) {
      window.dispatchEvent(
        new CustomEvent("bouw:perch-focus", { detail: { id: "resultado" } }),
      );
    }
    setPicked((prev) => {
      const had = prev.includes(id);
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
      data-tone={195}
      className="veil relative border-y border-white/[0.06] py-20 lg:py-28"
    >
      <Tone hue={195} />
      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-light">
            {t(DIAGNOSIS.eyebrow)}
          </p>
          <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.06] text-ink">
            <span data-perch="servicios" data-perch-corner="right">
              {t(DIAGNOSIS.title)}
            </span>
          </h2>
          <p className="mt-6 text-[17px] leading-relaxed text-ink-soft">
            {t(DIAGNOSIS.subtitle)}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/*
            Las frases, como tarjetas que se tocan. Botones con
            `aria-pressed`: se leen como lo que son, interruptores, pero no
            parecen una lista de casillas.
          */}
          <ul className="grid content-start gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {SYMPTOMS.map((s, i) => {
              const on = picked.includes(s.id);
              return (
                <li key={s.id} className="min-w-0">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(s.id)}
                    data-cursor="link"
                    className={`group/sym relative flex h-full w-full flex-col overflow-hidden rounded-2xl border p-4 text-left transition-[border-color,background-color,translate] duration-300 hover:-translate-y-0.5 sm:p-5 ${
                      on
                        ? "border-cyan-brand/70 bg-cyan-brand/[0.09]"
                        : "border-ink-dim/25 bg-ink/[0.025] hover:border-cyan-brand/45"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={`mt-0.5 font-mono text-[11px] tabular-nums transition-colors duration-300 ${
                          on ? "text-cyan-light" : "text-ink-dim"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-[15.5px] font-medium leading-snug transition-colors duration-300 ${
                          on ? "text-ink" : "text-ink-soft"
                        }`}
                      >
                        {t(s.label)}
                      </span>
                      <span
                        aria-hidden
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[15px] leading-none transition-[background-color,color,rotate] duration-300 ${
                          on
                            ? "rotate-45 bg-cyan-brand text-navy-950"
                            : "border border-ink-dim/35 text-ink-dim group-hover/sym:border-cyan-brand/60 group-hover/sym:text-cyan-light"
                        }`}
                      >
                        +
                      </span>
                    </span>
                    {/* La respuesta, en la misma tarjeta, en cuanto se toca */}
                    {on && (
                      <span className="pain-in mt-3.5 block border-t border-cyan-brand/25 pt-3.5">
                        <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-light">
                          {t(DIAGNOSIS.firstMove)}
                        </span>
                        <span className="mt-1.5 block text-[14px] leading-relaxed text-ink-soft">{t(s.firstMove)}</span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* El resultado */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            {/*
              Percha de foco y en vivo: la tarjeta es fija al bajar, así que su
              sitio se lee cada fotograma en vez de medirse una vez.
            */}
            <div
              className="rounded-2xl border border-ink-dim/25 bg-navy-950/80 p-7 sm:p-9"
              data-perch="resultado"
              data-perch-corner="right"
              data-perch-focus
              data-perch-live
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
                {picked.length === 0
                  ? lang === "es"
                    ? "Ninguna todavía"
                    : "None yet"
                  : `${picked.length} ${
                      lang === "es"
                        ? picked.length === 1
                          ? "te suena"
                          : "te suenan"
                        : picked.length === 1
                          ? "sounds familiar"
                          : "sound familiar"
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
                          {f.caseHref && (
                            <Link
                              href={f.caseHref}
                              className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-light transition-colors hover:text-orange-brand"
                            >
                              {lang === "es" ? "Ver un caso real" : "See a real case"}
                              <span aria-hidden>→</span>
                            </Link>
                          )}
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
                    className="w-full rounded-full bg-cyan-brand px-6 py-3.5 text-sm font-semibold text-navy-950 transition-colors duration-300 hover:bg-cyan-light"
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
