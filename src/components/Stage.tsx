"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent, ReactNode, Ref } from "react";

/**
 * El escaparate de cada ficha de la lista: el trabajo, sin caja alrededor.
 *
 * Antes era un chasis: un recuadro de color con cabecera (número, tipo,
 * estado), la ventana o el aparato dentro y un pie con la cifra. Recuadro
 * dentro de recuadro, y la cabecera y el pie repetían lo que ya dice el texto
 * de al lado. «Todavía no me gustan los recuadros» (Matthew, 19 oct 2026).
 *
 * Ahora es una foto de producto:
 *
 * 1. El trabajo (el portátil, el teléfono, el tablero) flota sobre una luz
 *    del color de la ficha, sin borde ni fondo de caja.
 * 2. Arriba, el número de la ficha en grande y a línea, como en una
 *    revista, y a la derecha el estado en una pastilla (en vivo…).
 * 3. Abajo, la cifra que lo resume (o la frase, en los servicios) y lo que
 *    pasa al tocarlo.
 *
 * El color sale de `.project` en `globals.css`: misma luz e intensidad para
 * todos, cambia solo el tono. Lo usan los proyectos (`Projects`) y los
 * servicios (`ServiceRow`).
 */
export default function Stage({
  index,
  category,
  status,
  pulse = false,
  chip,
  frame,
  frameLg,
  tall = false,
  bare = false,
  windowRef,
  feature,
  foot,
  action,
  actionHref,
  onAction,
  arrow = "→",
  perchId,
  ledgeId,
  perchCorner,
  press,
  children,
}: {
  index: string;
  category: string;
  status: string;
  /** El punto del estado late: algo está en marcha dentro. */
  pulse?: boolean;
  /** Lo que se lee en la barra de la ventana. */
  chip: string;
  /** Proporción de lo que va dentro, como `aspect-ratio`. */
  frame: string;
  /** La proporción en escritorio, si cambia. */
  frameLg?: string;
  /**
   * Escaparate más alto en escritorio (4/3 en vez de 3/2): para los
   * tableros de los servicios, que necesitan sitio para leerse. Su fila no
   * crece por ello: ahí manda el alto del texto de al lado.
   */
  tall?: boolean;
  /**
   * Sin ventana: lo de dentro ocupa el hueco entero y trae su propio marco
   * (los aparatos de `Devices`).
   */
  bare?: boolean;
  windowRef?: Ref<HTMLDivElement>;
  /** La cifra del pie. */
  feature?: { value: string; label: string };
  /** O, en su lugar, una frase con su título. */
  foot?: { title: string; body: string };
  action: string;
  /**
   * Si la acción lleva a otra página y el panel no es un enlace entero
   * (porque dentro hay botones), la acción es el enlace.
   */
  actionHref?: string;
  /** O hace algo en la misma página (con el mismo aspecto). */
  onAction?: () => void;
  arrow?: string;
  /** Percha del dragón: la esquina superior del panel que mira al texto. */
  perchId: string;
  /** Segunda percha, la repisa del pie. */
  ledgeId: string;
  perchCorner: "left" | "right";
  /** Si el panel entero es un botón: qué dice y qué hace. */
  press?: { label: string; onPress: () => void };
  children: ReactNode;
}) {
  /*
   * Proporciones. Con aparato y sin caja alrededor, en el teléfono basta un
   * escaparate apaisado (5/4): el portátil ocupa el ancho entero en vez de
   * quedarse chico en medio de un recuadro casi cuadrado. Los tableros de
   * los servicios siguen más altos, que si no no se leen.
   */
  const aspect = bare
    ? "aspect-[5/4] sm:aspect-[16/11] lg:aspect-[3/2]"
    : `aspect-[10/11] sm:aspect-[6/5] ${tall ? "lg:aspect-[4/3]" : "lg:aspect-[3/2]"}`;

  const actionClass =
    "group/act ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-(--p-line) bg-(--p-chip) px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink transition-colors duration-500 hover:border-(--p-accent) hover:text-(--p-accent)";

  return (
    <div
      className={`p-show ${aspect} ${press ? "cursor-pointer" : ""}`}
      data-perch={perchId}
      data-perch-corner={perchCorner}
      {...(press
        ? {
            "data-perch-open": "",
            role: "button",
            tabIndex: 0,
            "aria-label": press.label,
            onClick: press.onPress,
            onKeyDown: (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                press.onPress();
              }
            },
          }
        : {})}
    >
      {/* La luz del color de la ficha */}
      <span aria-hidden className="p-show-glow" />

      {/*
        Arriba, el estado en su pastilla. El tipo (`category`) ya no se
        escribe aquí: lo dice el texto de al lado, con el mismo rótulo.
      */}
      <div className="relative z-10 flex items-end gap-3 pb-3" title={category}>
        {/*
          El número de la ficha, grande y a línea. Iba detrás del portátil y
          no se leía («los números quedan por detrás de la compu», Matthew,
          19 oct 2026): ahora va en su fila, encima del trabajo.
        */}
        <span aria-hidden className="p-show-index font-display font-bold">
          {index}
        </span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-(--p-line) bg-(--p-chip) px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-(--p-accent)">
          <span className={`h-1.5 w-1.5 rounded-full bg-(--p-accent) ${pulse ? "live-dot" : ""}`} aria-hidden />
          {status}
        </span>
      </div>

      {/* El trabajo */}
      <div className="p-area relative z-10 flex-1">
        {bare ? (
          <div ref={windowRef} className="p-bare">
            {children}
          </div>
        ) : (
          <div
            ref={windowRef}
            className="p-window"
            style={{ "--p-frame-sm": frame, "--p-frame-lg": frameLg ?? frame } as CSSProperties}
          >
            <div className="p-window-bar flex items-center gap-3 px-3.5">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-(--p-line)" />
                <span className="h-2 w-2 rounded-full bg-(--p-line)" />
                <span className="h-2 w-2 rounded-full bg-(--p-line)" />
              </span>
              <span className="mx-auto max-w-[70%] truncate rounded-md bg-(--p-window) px-3 py-0.5 font-mono text-[10px] tracking-wide text-ink-dim">
                {chip}
              </span>
              <span className="w-[42px]" aria-hidden />
            </div>

            <div className="p-media">{children}</div>
          </div>
        )}
      </div>

      {/*
        Abajo: la cifra (o la frase) y lo que pasa al tocar. Entre las dos,
        sitio para el dragón (ver la repisa al final).
      */}
      <div className="relative z-10 flex min-h-[3.5rem] items-end gap-4 pt-4 sm:min-h-[4.25rem]">
        {feature && (
          <div className="flex items-baseline gap-3">
            <span className="whitespace-nowrap font-display text-[1.9rem] font-bold leading-none text-(--p-accent) sm:text-[2.4rem]">
              {feature.value}
            </span>
            <span className="max-w-[10rem] text-[12px] leading-snug text-ink-soft">{feature.label}</span>
          </div>
        )}
        {foot && (
          <div className="min-w-0 max-w-[30rem]">
            <p className="font-display text-[15px] font-bold leading-tight text-(--p-accent) sm:text-[17px]">
              {foot.title}
            </p>
            {/* En el teléfono el pie no da para el párrafo: va debajo del panel */}
            <p className="mt-1.5 hidden text-[12.5px] leading-snug text-ink-soft sm:block">{foot.body}</p>
          </div>
        )}
        {actionHref ? (
          <Link href={actionHref} className={actionClass}>
            {action}
            <span aria-hidden className="transition-transform duration-500 group-hover/act:translate-x-1">
              {arrow}
            </span>
          </Link>
        ) : onAction ? (
          <button type="button" onClick={onAction} className={actionClass}>
            {action}
            <span aria-hidden className="transition-transform duration-500 group-hover/act:translate-x-1">
              {arrow}
            </span>
          </button>
        ) : (
          <span className={`${actionClass} group-hover:border-(--p-accent) group-hover:text-(--p-accent)`}>
            {action}
            <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
              {arrow}
            </span>
          </span>
        )}
      </div>

      {/*
        Repisa: segunda percha del panel, en el pie. El dragón busca a lo
        largo de ella el tramo sin texto, que es el hueco entre la cifra y la
        acción, y se queda de pie delante del trabajo.
      */}
      <span
        aria-hidden
        data-perch={ledgeId}
        data-perch-corner={perchCorner}
        className="pointer-events-none absolute inset-x-0 bottom-1 h-px"
      />
    </div>
  );
}
