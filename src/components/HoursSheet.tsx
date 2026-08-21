"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HOURS,
  HOURS_HIGH,
  HOURS_LOW,
  WEEKS_PER_YEAR,
} from "@/lib/content";
import { setBrief } from "@/lib/brief";
import { useLang } from "@/lib/i18n";

/**
 * La cuenta de horas — cuarto pliego del dossier.
 *
 * Ocupa el sitio de "Cuatro pasos, sin sorpresas": diagnóstico, propuesta,
 * construcción, entrega, numerados y encendiéndose al bajar. Ese bloque
 * describe cómo trabaja la empresa, que es lo que menos le importa a alguien
 * que aún no sabe si tiene un problema, y está escrito de forma que sirve
 * igual para una agencia que para un dentista.
 *
 * Esto hace la única cuenta que decide si merece la pena llamar. Y puede
 * salir que no: por debajo del umbral el veredicto dice que no se automatice.
 * Una página que se desaconseja a sí misma es lo contrario de una landing, y
 * es exactamente lo que diría el ingeniero que hay detrás.
 *
 * Los plazos de los cuatro pasos siguen en la página: están en Nosotros,
 * escritos como condiciones.
 */

/** Campo de formulario impreso: una línea, no una caja. */
const FIELD =
  "w-full border-b border-plan-line/25 bg-transparent pb-2 font-display font-bold tabular-nums text-plan-ink outline-none transition-colors placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-plan-dim/60 focus:border-plan-line";

const LABEL =
  "block font-mono text-[10px] uppercase tracking-[0.24em] text-plan-ink/55";

/** Lee un campo numérico sin dejar que un vacío se convierta en NaN. */
function num(value: string, fallback = 0) {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default function HoursSheet() {
  const { t, lang } = useLang();

  /*
   * Llega con la fila rellena a propósito.
   *
   * Un formulario en blanco obliga a inventarse un caso antes de entender
   * para qué sirve. Con tres veces por semana y veinte minutos ya hay un
   * resultado en pantalla, y cambiar un número enseña la herramienta mejor
   * que cualquier instrucción.
   */
  const [task, setTask] = useState("");
  const [perWeek, setPerWeek] = useState("3");
  const [minutes, setMinutes] = useState("20");
  const [people, setPeople] = useState("1");
  const [rate, setRate] = useState("");
  const [taken, setTaken] = useState(false);

  /*
   * Si la fila la ha tocado él o sigue siendo la de ejemplo.
   *
   * Importa porque la cuenta se publica sola —la barra de navegación lleva el
   * número encima mientras bajas— y publicar la fila de ejemplo sería enseñar
   * "La cuenta · 48 h" a alguien que no ha escrito nada. Eso no es su dato,
   * es el nuestro; y un número ajeno presentado como propio es exactamente lo
   * que hace que nadie se crea el siguiente.
   */
  const [touched, setTouched] = useState(false);

  const n = {
    perWeek: num(perWeek),
    minutes: num(minutes),
    people: num(people),
    rate: num(rate),
  };

  const hours = (n.perWeek * n.minutes * n.people * WEEKS_PER_YEAR) / 60;
  const cost = hours * n.rate;

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(lang === "es" ? "es-EC" : "en-US", {
        maximumFractionDigits: 0,
      }),
    [lang],
  );

  const verdict =
    hours < HOURS_LOW
      ? HOURS.verdicts.low
      : hours < HOURS_HIGH
        ? HOURS.verdicts.edge
        : HOURS.verdicts.high;

  const tone =
    hours < HOURS_LOW
      ? "text-plan-dim"
      : hours < HOURS_HIGH
        ? "text-plan-ink"
        : "text-plan-line";

  /*
   * La cuenta se publica mientras se teclea, no al pulsar "llévalo".
   *
   * Es lo que permite que la barra de navegación lleve el número encima —"La
   * cuenta · 48 h"— desde el momento en que sale, y que el formulario lo tenga
   * escrito al llegar. El botón sigue existiendo porque hace otra cosa: te
   * lleva allí.
   *
   * Sin horas no hay dato: con la fila a cero no se publica nada, porque un
   * "0 h" en la barra sería peor que no poner nada.
   */
  useEffect(() => {
    if (!touched || hours <= 0) return;
    setBrief({
      count: {
        task: task.trim(),
        perWeek: n.perWeek,
        minutes: n.minutes,
        people: n.people,
        rate: n.rate,
        hours: Math.round(hours),
        cost: Math.round(cost),
      },
    });
  }, [touched, task, n.perWeek, n.minutes, n.people, n.rate, hours, cost]);

  const carry = () => {
    setBrief({
      count: {
        task: task.trim(),
        perWeek: n.perWeek,
        minutes: n.minutes,
        people: n.people,
        rate: n.rate,
        hours: Math.round(hours),
        cost: Math.round(cost),
      },
    });
    setTaken(true);
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  };

  const unitWeek = lang === "es" ? "veces/sem" : "×/week";
  const unitPeople =
    lang === "es" ? (n.people === 1 ? "persona" : "personas") : "people";
  const unitWeeks = lang === "es" ? "semanas" : "weeks";

  return (
    <section id="proceso" className="sheet relative">
      <span className="crop-mark left-5 top-5 border-l border-t" aria-hidden />
      <span className="crop-mark right-5 top-5 border-r border-t" aria-hidden />

      {/* Cabecera de pliego */}
      <div className="sheet-rule h-px w-full" />
      <div className="relative z-10 mx-auto flex max-w-[1560px] items-center justify-between px-6 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-plan-ink/50 lg:px-16">
        <span className="ink-chip px-2.5 py-1">BOUW</span>
        <span className="hidden sm:inline">
          {lang === "es" ? "Pliego 04 — La cuenta" : "Sheet 04 — The count"}
        </span>
        <span>04 / 05</span>
      </div>
      <div className="sheet-rule h-px w-full" />

      <div className="ledger-columns relative z-10">
        <div className="mx-auto max-w-[1560px] px-6 py-20 lg:px-16 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <span className="font-display text-[clamp(3rem,7vw,6rem)] font-bold leading-none text-plan-ink/14">
                04
              </span>
            </div>

            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-plan-ink/55">
                {t(HOURS.eyebrow)}
              </p>
              <h2 className="mt-5 font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[0.98]">
                {t(HOURS.title)}
              </h2>
            </div>

            <div className="lg:col-span-3 lg:pt-2">
              <p className="sheet-dim text-sm leading-relaxed">
                {t(HOURS.subtitle)}
              </p>
            </div>
          </div>

          {/* La fila de la hoja */}
          <div className="mt-20 grid gap-x-10 gap-y-10 lg:mt-24 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <label className={LABEL} htmlFor="h-task">
                {t(HOURS.task)}
              </label>
              <input
                id="h-task"
                value={task}
                onChange={(e) => {
                  setTask(e.target.value);
                  setTaken(false);
                  setTouched(true);
                }}
                placeholder={t(HOURS.taskPlaceholder)}
                className={`${FIELD} mt-3 text-xl`}
              />
            </div>

            {(
              [
                ["h-week", HOURS.perWeek, perWeek, setPerWeek, "1"],
                ["h-min", HOURS.minutes, minutes, setMinutes, "5"],
                ["h-people", HOURS.people, people, setPeople, "1"],
                ["h-rate", HOURS.rate, rate, setRate, "0.5"],
              ] as const
            ).map(([id, label, value, set, step]) => (
              <div key={id} className="lg:col-span-3">
                <label className={LABEL} htmlFor={id}>
                  {t(label)}
                </label>
                <input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={step}
                  value={value}
                  onChange={(e) => {
                    set(e.target.value);
                    setTaken(false);
                    setTouched(true);
                  }}
                  placeholder={id === "h-rate" ? "—" : "0"}
                  className={`${FIELD} mt-3 text-2xl`}
                />
              </div>
            ))}
          </div>

          {/*
            La aritmética a la vista.

            No es decoración: es lo que permite discutir el resultado. Un
            número solo se acepta o se ignora; un número con su operación
            delante se puede corregir, y corregirlo es exactamente la
            conversación que queremos tener.
          */}
          <p className="mt-14 font-mono text-[13px] leading-relaxed tracking-wide text-plan-ink/70">
            <span className="tabular-nums">{fmt.format(n.perWeek)}</span>{" "}
            {unitWeek} ×{" "}
            <span className="tabular-nums">{fmt.format(n.minutes)}</span> min ×{" "}
            <span className="tabular-nums">{fmt.format(n.people)}</span>{" "}
            {unitPeople} × {WEEKS_PER_YEAR} {unitWeeks} ={" "}
            <span className="tabular-nums text-plan-ink">
              {fmt.format(hours)} h
            </span>
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-plan-ink/40">
            {t(HOURS.assumption)}
          </p>

          {/* El resultado */}
          <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <p className={LABEL}>{t(HOURS.resultLabel)}</p>
              <p className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-[clamp(3rem,8vw,5.5rem)] font-bold leading-[0.85] tabular-nums text-plan-ink">
                  {fmt.format(hours)}
                </span>
                <span className="font-mono text-sm uppercase tracking-[0.2em] text-plan-ink/50">
                  {lang === "es" ? "horas" : "hours"}
                </span>
              </p>

              {n.rate > 0 && (
                <p className="mt-8">
                  <span className={LABEL}>{t(HOURS.costLabel)}</span>
                  <span className="mt-2 block font-display text-3xl font-bold tabular-nums text-plan-ink/80">
                    ${fmt.format(cost)}
                  </span>
                </p>
              )}
            </div>

            <div className="lg:col-span-7">
              <p className={LABEL}>{t(HOURS.verdictLabel)}</p>
              <h3
                className={`mt-3 font-display text-[clamp(1.5rem,3.4vw,2.5rem)] font-bold leading-[1.05] ${tone}`}
              >
                {t(verdict.title)}
              </h3>
              <p className="sheet-dim mt-4 max-w-xl text-[15px] leading-relaxed">
                {t(verdict.body)}
              </p>

              {/*
                El botón solo aparece cuando la cuenta da algo que llevar.
                Ofrecer "hablemos" debajo de un veredicto que acaba de decir
                que no hace falta sería desmentirlo en la línea siguiente.
              */}
              {hours >= HOURS_LOW && (
                <button
                  type="button"
                  onClick={carry}
                  data-cursor="link"
                  className="mt-8 border border-plan-line/50 px-6 py-3.5 text-sm font-semibold text-plan-ink transition-colors duration-300 hover:bg-plan-line hover:text-navy-950"
                >
                  {taken ? t(HOURS.taken) : t(HOURS.cta)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
