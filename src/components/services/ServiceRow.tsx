"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { setBrief } from "@/lib/brief";
import { COMPLIANCE, LEAN, PROJECTS, type Service } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import FlowTwin from "../linea/FlowTwin";
import LoopVideo from "../LoopVideo";
import Reveal from "../Reveal";
import Stage from "../Stage";
import AuditBoard from "./AuditBoard";
import { ICONS } from "./icons";
import PainSwitch from "./PainSwitch";

/**
 * Un servicio en la lista de proyectos.
 *
 * Matthew, 13 oct 2026: el servicio de cumplimiento normativo y BPM va donde
 * estaba «Dispositivo médico», y el de Lean y layout donde estaba «Mejora
 * continua». Misma fila que un proyecto (panel de un lado, texto del otro,
 * el lado alternando) y debajo lo propio de un servicio:
 *
 * 1. Arriba, el panel con algo que se mueve. En Lean, la simulación de
 *    flujos de la que habla la tarjeta, funcionando: el escenario actual y
 *    el propuesto a la vez, con sus indicadores (`FlowTwin`). En cumplimiento, un tablero de auditoría de
 *    muestra que se va cerrando hasta quedar listo para inspección.
 * 2. Al lado, el titular y lo que lo respalda: las cifras medidas en el caso
 *    (Lean) o los cuatro entregables (cumplimiento).
 * 3. La planta antes y después, en video, con lo que cambia dicho al lado.
 * 4. Debajo, el problema de hoy contra la solución, uno a uno.
 * 5. Y la llamada, que se lleva al formulario el servicio que se pidió.
 */
export default function ServiceRow({ service, i }: { service: Service; i: number }) {
  const { t, lang } = useLang();
  const mediaFirst = i % 2 === 1;
  const corner = mediaFirst ? "right" : "left";
  const lean = service.id === "lean";
  const [run, setRun] = useState(0);

  const ask = () => {
    setBrief({ service: service.cta.brief });
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  };

  const mediaClass = mediaFirst
    ? "lg:col-start-1 lg:col-span-7 lg:row-start-1"
    : "lg:col-start-6 lg:col-span-7 lg:row-start-1";
  const textClass = mediaFirst
    ? "lg:col-start-8 lg:col-span-5 lg:row-start-1"
    : "lg:col-start-1 lg:col-span-5 lg:row-start-1";

  // Las cifras de Lean son las del caso de mejora continua, y ahí lleva
  const floor = PROJECTS.find((p) => p.slug === LEAN.from);
  const caseHref = floor?.caseHref ?? "/proyectos/mejora-continua";

  // En Lean el panel no es un enlace: dentro hay interruptores. Lleva al
  // caso la acción del pie
  const stage = lean ? (
    <Stage
      index={service.index}
      category={lang === "es" ? "Simulación · pruébala" : "Simulation · try it"}
      status={lang === "es" ? "Simulador" : "Simulator"}
      pulse
      chip={lang === "es" ? "modelo de la línea · 4 estaciones" : "line model · 4 stations"}
      frame="16 / 11"
      foot={{ title: t(LEAN.highlight.title), body: t(LEAN.highlight.body) }}
      action={t(LEAN.highlight.action)}
      actionHref={`${caseHref}#linea`}
      perchId={`proyecto-${service.slug}`}
      ledgeId={`pie-${service.slug}`}
      perchCorner={corner}
    >
      <FlowTwin />
    </Stage>
  ) : (
    <Stage
      index={service.index}
      category={lang === "es" ? "Auditoría · BPM" : "Audit · GMP"}
      status={lang === "es" ? "Muestra" : "Sample"}
      chip={lang === "es" ? "estado-de-auditoria · muestra" : "audit-status · sample"}
      frame="4 / 3"
      feature={{
        value: "98 %",
        label: lang === "es" ? "Preparación, en el tablero de muestra" : "Readiness, on the sample board",
      }}
      action={lang === "es" ? "Contarlo otra vez" : "Run it again"}
      arrow="↻"
      perchId={`proyecto-${service.slug}`}
      ledgeId={`pie-${service.slug}`}
      perchCorner={corner}
      press={{
        label: lang === "es" ? "Volver a contar el tablero de auditoría" : "Run the audit board again",
        onPress: () => setRun((r) => r + 1),
      }}
    >
      <AuditBoard key={run} board={COMPLIANCE.board} />
    </Stage>
  );

  const CtaIcon = ICONS[service.cta.icon];

  return (
    <article
      className="project relative isolate"
      style={
        {
          "--p-h": service.hue,
          "--p-glow-x": mediaFirst ? "28%" : "72%",
        } as CSSProperties
      }
    >
      <div aria-hidden className="project-glow" />

      {/* El grupo es solo la fila de arriba: pasar por los problemas no levanta el panel */}
      <div className="group relative grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-12 lg:gap-14">
        <div className={`min-w-0 ${mediaClass}`}>
          {stage}
          {lean && (
            // En el teléfono el pie del panel no da para el párrafo: va aquí
            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft sm:hidden">
              {t(LEAN.highlight.body)}
            </p>
          )}
        </div>

        <Reveal delay={40} className={textClass}>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-(--p-line) bg-(--p-accent-soft) px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-(--p-accent)">
            <span className="h-1.5 w-1.5 rounded-full bg-(--p-accent)" aria-hidden />
            {t(service.badge)}
          </span>

          <h3 className="mt-6 font-display text-[clamp(1.85rem,3.3vw,2.75rem)] font-bold leading-[1.04] text-ink">
            {/* Segunda percha: el dragón salta al titular cuando el panel se va */}
            <span
              className="relative inline-block"
              data-perch={`titulo-${service.slug}`}
              data-perch-corner="right"
            >
              {t(service.title)}
            </span>
          </h3>

          <p className="mt-5 text-lg leading-snug text-ink-soft">{t(service.subtitle)}</p>

          {lean ? (
            <>
              <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-(--p-line) pt-6">
                {LEAN.stats.map((s) => (
                  <div key={s.value}>
                    <dt className="font-display text-[1.75rem] font-bold leading-none text-(--p-accent) sm:text-[2.1rem]">
                      {s.value}
                    </dt>
                    <dd className="mt-2 text-[12px] leading-snug text-ink-dim">{t(s.label)}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href={caseHref}
                className="group/case mt-6 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-dim transition-colors hover:text-(--p-accent)"
              >
                {lang === "es"
                  ? "Medido en el caso de mejora continua"
                  : "Measured in the continuous improvement case"}
                <span aria-hidden className="transition-transform duration-500 group-hover/case:translate-x-1">
                  →
                </span>
              </Link>
            </>
          ) : (
            <div className="mt-8 border-t border-(--p-line) pt-6">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-dim">
                {lang === "es" ? "Método Bouw · entregables clave" : "The Bouw method · key deliverables"}
              </p>
              <ul className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                {COMPLIANCE.deliverables.map((d) => {
                  const Glyph = ICONS[d.icon];
                  return (
                    <li key={t(d.title)} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-(--p-accent-soft) text-(--p-accent) ring-1 ring-(--p-line)">
                        <Glyph aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14.5px] font-bold leading-snug text-ink">{t(d.title)}</p>
                        <p className="mt-1 text-[13px] leading-snug text-ink-dim">{t(d.body)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Reveal>
      </div>

      {/*
        La planta antes y después. Del lado contrario al panel de arriba, para
        que la lectura zigzaguee.
      */}
      <div className="mt-20 grid grid-cols-[minmax(0,1fr)] items-end gap-8 lg:mt-28 lg:grid-cols-12 lg:gap-14">
        <Reveal
          className={`min-w-0 lg:col-span-8 lg:row-start-1 ${mediaFirst ? "lg:col-start-5" : "lg:col-start-1"}`}
        >
          {/* Percha: sin ella, en el tramo largo del servicio el dragón
              volaba a tu lado y parecía bajar contigo */}
          <figure
            data-perch={`video-${service.slug}`}
            data-perch-corner={mediaFirst ? "left" : "right"}
            className="relative overflow-hidden rounded-[24px] bg-[#0b1626] shadow-[0_40px_80px_-40px_var(--p-shadow)] ring-1 ring-(--p-line)">
            <LoopVideo
              src={service.film.src}
              poster={service.film.poster}
              label={t(service.film.label)}
              className="block aspect-video w-full rounded-[24px] object-cover"
            />
          </figure>
        </Reveal>
        <Reveal
          delay={60}
          className={`lg:col-span-4 lg:row-start-1 ${mediaFirst ? "lg:col-start-1" : "lg:col-start-9"}`}
        >
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-dim">
            {lang === "es" ? "Así cambia la planta" : "How the plant changes"}
          </p>
          <div className="mt-6 space-y-6">
            <div className="flex gap-4">
              <span className="mt-1 h-[calc(100%-0.5rem)] w-[3px] shrink-0 rounded-full bg-orange-brand" aria-hidden />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-light">
                  {lang === "es" ? "Hoy" : "Today"}
                </p>
                <p className="mt-1.5 text-[16px] leading-relaxed text-ink-soft">{t(service.film.before)}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="mt-1 h-[calc(100%-0.5rem)] w-[3px] shrink-0 rounded-full bg-(--p-good)" aria-hidden />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--p-good)">
                  {lang === "es" ? "Con Bouw" : "With Bouw"}
                </p>
                <p className="mt-1.5 text-[16px] leading-relaxed text-ink">{t(service.film.after)}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Problema contra solución */}
      <Reveal className="mt-20 lg:mt-24">
        <PainSwitch pains={service.pains} perch={`problemas-${service.slug}`} />
      </Reveal>

      {/* La llamada: se lleva el servicio al formulario */}
      <Reveal className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
        <button
          type="button"
          onClick={ask}
          className="group/cta inline-flex items-center gap-3 rounded-full text-left bg-(--p-accent) px-6 py-4 text-[15px] font-semibold text-(--p-on-accent) shadow-[0_18px_40px_-18px_var(--p-shadow)] transition-[filter,translate] duration-300 hover:-translate-y-0.5 hover:brightness-110"
        >
          {service.cta.icon !== "arrow" && <CtaIcon aria-hidden className="h-[18px] w-[18px]" strokeWidth={2} />}
          {t(service.cta.label)}
          <span aria-hidden className="transition-transform duration-500 group-hover/cta:translate-x-1">
            →
          </span>
        </button>
        <p className="text-[14px] leading-snug text-ink-dim">{t(service.cta.note)}</p>
      </Reveal>
    </article>
  );
}
