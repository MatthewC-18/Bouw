"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { setBrief } from "@/lib/brief";
import { COMPLIANCE, LEAN, PROJECTS, pickAsset, type Localized, type Service } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import FlowTwin from "../linea/FlowTwin";
import LoopVideo from "../LoopVideo";
import Reveal from "../Reveal";
import Stage from "../Stage";
import AuditCheck from "./AuditCheck";
import { ICONS } from "./icons";
import KeywordSearch from "./KeywordSearch";
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
 *    las mejoras que el visitante enciende (`FlowTwin`). En cumplimiento, un
 *    simulacro de auditoría: marca lo que su planta cumple y ve qué vería un
 *    inspector (`AuditCheck`).
 * 2. Al lado, el titular y lo que lo respalda: las cifras medidas en el caso
 *    (Lean) o los cuatro entregables (cumplimiento).
 * 3. Debajo, en una sola fila: la planta antes y después, en video, y al
 *    lado el problema de hoy contra la solución, uno a uno.
 * 4. Y la llamada, que se lleva al formulario el servicio que se pidió.
 */
export default function ServiceRow({ service, i }: { service: Service; i: number }) {
  const { t, lang } = useLang();
  const mediaFirst = i % 2 === 1;
  const corner = mediaFirst ? "right" : "left";
  const lean = service.id === "lean";
  // El resultado del simulacro de auditoría, si el visitante marcó algo
  const auditLine = useRef<Localized | null>(null);

  const ask = () => {
    setBrief({ service: auditLine.current ?? service.cta.brief });
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
      frameLg="16 / 9"
      tall
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
      category={lang === "es" ? "Autoevaluación · BPM" : "Self-check · GMP"}
      status={lang === "es" ? "Simulacro" : "Mock audit"}
      pulse
      chip={lang === "es" ? "simulacro-de-auditoria · tu planta" : "mock-audit · your plant"}
      frame="4 / 3"
      frameLg="16 / 9"
      tall
      foot={{
        title: lang === "es" ? "Simulacro de auditoría" : "Mock audit",
        body:
          lang === "es"
            ? "Marca lo que tu planta ya cumple y mira qué encontraría hoy un inspector. Tu resultado viaja con la solicitud de diagnóstico."
            : "Tick what your plant already does and see what an inspector would find today. Your result travels with the diagnosis request.",
      }}
      action={lang === "es" ? "Agendar diagnóstico" : "Book the diagnosis"}
      onAction={ask}
      perchId={`proyecto-${service.slug}`}
      ledgeId={`pie-${service.slug}`}
      perchCorner={corner}
    >
      <AuditCheck
        audit={COMPLIANCE.audit}
        onResult={(line) => {
          auditLine.current = line;
        }}
      />
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

          <h3 className="mt-5 font-display text-[clamp(1.7rem,2.7vw,2.3rem)] font-bold leading-[1.06] text-ink">
            {/* Segunda percha: el dragón salta al titular cuando el panel se va */}
            <span
              className="relative inline-block"
              data-perch={`titulo-${service.slug}`}
              data-perch-corner="right"
            >
              {t(service.title)}
            </span>
          </h3>

          <p className="mt-4 text-[16px] leading-snug text-ink-soft">{t(service.subtitle)}</p>

          {/* Lo que el cliente busca, en grande: se vende antes de leer */}
          <div className="mt-6">
            <KeywordSearch words={service.keywords[lang]} />
          </div>

          {lean && (
            <>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-(--p-line) pt-5">
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
          )}
          {/*
            Los cuatro entregables de cumplimiento ya no van aquí con su
            párrafo: sus nombres están entre las palabras clave, en grande
            (auditorías internas, gap analysis, batch records, CAPA,
            integridad de datos).
          */}
        </Reveal>
      </div>

      {/*
        La planta antes y después y, al lado, el problema contra la solución
        con la llamada. Antes eran tres bandas una debajo de otra (video,
        problemas, botón) y cada servicio ocupaba más de dos pantallas
        (Matthew, 18 oct 2026: «compactemos la parte de proyectos»). El video
        va del lado contrario al panel de arriba, para que la lectura
        zigzaguee; lo que antes se contaba al lado del video (hoy y con Bouw)
        ya lo señala el propio video, y queda como pie.
      */}
      <div className="mt-12 grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-14">
        <Reveal
          className={`min-w-0 lg:col-span-7 lg:row-start-1 ${mediaFirst ? "lg:col-start-6" : "lg:col-start-1"}`}
        >
          {/* Percha: sin ella, en el tramo largo del servicio el dragón
              volaba a tu lado y parecía bajar contigo */}
          <figure
            data-perch={`video-${service.slug}`}
            data-perch-corner={mediaFirst ? "left" : "right"}
          >
            <div className="relative overflow-hidden rounded-[24px] bg-[#0b1626] shadow-[0_40px_80px_-40px_var(--p-shadow)] ring-1 ring-(--p-line)">
              <LoopVideo
                src={pickAsset(service.film.src, lang)}
                poster={pickAsset(service.film.poster, lang)}
                label={t(service.film.label)}
                className="block aspect-video w-full rounded-[24px] object-cover"
              />
            </div>
            <figcaption className="mt-4 grid gap-x-8 gap-y-2 text-[14px] leading-snug sm:grid-cols-2">
              <p className="flex gap-3">
                <span className="mt-0.5 w-[3px] shrink-0 self-stretch rounded-full bg-orange-brand" aria-hidden />
                <span>
                  <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-light">
                    {lang === "es" ? "Hoy" : "Today"}
                  </span>
                  <span className="text-ink-soft">{t(service.film.before)}</span>
                </span>
              </p>
              <p className="flex gap-3">
                <span className="mt-0.5 w-[3px] shrink-0 self-stretch rounded-full bg-(--p-good)" aria-hidden />
                <span>
                  <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.2em] text-(--p-good)">
                    {lang === "es" ? "Con Bouw" : "With Bouw"}
                  </span>
                  <span className="text-ink">{t(service.film.after)}</span>
                </span>
              </p>
            </figcaption>
          </figure>
        </Reveal>

        <Reveal
          delay={60}
          className={`min-w-0 lg:col-span-5 lg:row-start-1 ${mediaFirst ? "lg:col-start-1" : "lg:col-start-8"}`}
        >
          {/*
            Problema contra solución. Sin percha propia: al lado del video ya
            hay una, y posado aquí el dragón tapaba una de las pestañas.
          */}
          <PainSwitch pains={service.pains} />

          {/* La llamada: se lleva el servicio al formulario */}
          <div className="mt-6 flex flex-col items-start gap-3">
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
            <p className="text-[13px] leading-snug text-ink-dim">{t(service.cta.note)}</p>
          </div>
        </Reveal>
      </div>
    </article>
  );
}
