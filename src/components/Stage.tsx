"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent, ReactNode, Ref } from "react";

/**
 * El chasis de cada ficha de la lista: escenario, ventana y pie.
 *
 * Las piezas vienen de mundos distintos: una interfaz oscura, una web de
 * colores pastel, una hoja de cálculo, fotos de planta, un tablero. Antes cada
 * una iba como venía y la fila parecía de cinco portafolios distintos. Ahora
 * todas pasan por el mismo molde, de arriba abajo:
 *
 * 1. Cabecera: número, tipo de material y estado.
 * 2. La ventana, con su barra y la dirección o el nombre del archivo. Lo de
 *    dentro entra entero, a su proporción (`frame`): ni se recorta ni se le
 *    pone un paspartú distinto a cada uno.
 * 3. Pie: la cifra (o la frase) que lo resume y lo que pasa al tocarlo.
 *
 * Todo sobre un escenario del color de la ficha (`.project` en `globals.css`).
 * Lo usan los proyectos (`Projects`) y los servicios (`ServiceRow`).
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
   * Escenario más alto en escritorio (4/3 en vez de 3/2): para los tableros
   * de los servicios, que necesitan sitio para leerse. Su fila no crece por
   * ello: ahí manda el alto del texto de al lado.
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
  return (
    <div
      // Más apaisado que antes (5/4): «achica el panel de cada proyecto»
      // (Matthew, 18 oct 2026). La ventana gana ancho y la ficha pierde alto
      className={`p-stage aspect-[10/11] sm:aspect-[6/5] ${tall ? "lg:aspect-[4/3]" : "lg:aspect-[3/2]"} ${press ? "cursor-pointer" : ""}`}
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
      {/* Cabecera */}
      <div className="relative flex items-center gap-3 px-5 pb-3 pt-4 font-mono text-[10px] uppercase tracking-[0.24em] sm:px-7 sm:pt-5">
        <span className="font-semibold text-(--p-accent)">{index}</span>
        <span className="h-px w-6 bg-(--p-line)" aria-hidden />
        {/* `min-w-0` o el rótulo no se corta: ensancha el panel y la fila
            entera se sale de la pantalla en el teléfono */}
        <span className="min-w-0 truncate text-ink-dim">{category}</span>
        <span className="ml-auto flex shrink-0 items-center gap-2 text-(--p-accent)">
          <span
            className={`h-1.5 w-1.5 rounded-full bg-(--p-accent) ${pulse ? "live-dot" : ""}`}
            aria-hidden
          />
          {status}
        </span>
      </div>

      {/* La ventana */}
      <div className="p-area relative flex-1 px-5 sm:px-7">
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
        Pie: la cifra y lo que pasa al tocar, y entre las dos, sitio para el
        dragón. Con la ficha centrada en pantalla el borde de arriba del
        escenario queda pegado a la barra y el bicho no cabe encima; aquí
        abajo sí (ver la repisa al final).
      */}
      <div className="relative flex min-h-[4.5rem] items-end gap-4 px-5 pb-4 pt-3 sm:min-h-[5.5rem] sm:px-7 sm:pb-5 lg:min-h-[6.25rem]">
        {feature && (
          <div className="flex items-baseline gap-3">
            <span className="whitespace-nowrap font-display text-[1.6rem] font-bold leading-none text-(--p-accent) sm:text-[2rem] lg:text-[2.5rem]">
              {feature.value}
            </span>
            <span className="max-w-[11rem] text-[12px] leading-snug text-ink-soft">
              {feature.label}
            </span>
          </div>
        )}
        {foot && (
          <div className="min-w-0 max-w-[30rem]">
            <p className="font-display text-[15px] font-bold leading-tight text-(--p-accent) sm:text-[17px]">
              {foot.title}
            </p>
            {/* En el teléfono el pie no da para el párrafo: va debajo del panel */}
            <p className="mt-1.5 hidden text-[12.5px] leading-snug text-ink-soft sm:block">
              {foot.body}
            </p>
          </div>
        )}
        {actionHref ? (
          <Link
            href={actionHref}
            className="group/act ml-auto flex shrink-0 items-center gap-2 pb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim transition-colors duration-500 hover:text-(--p-accent)"
          >
            {action}
            <span aria-hidden className="transition-transform duration-500 group-hover/act:translate-x-1">
              {arrow}
            </span>
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="group/act ml-auto flex shrink-0 items-center gap-2 pb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim transition-colors duration-500 hover:text-(--p-accent)"
          >
            {action}
            <span aria-hidden className="transition-transform duration-500 group-hover/act:translate-x-1">
              {arrow}
            </span>
          </button>
        ) : (
          <span className="ml-auto flex shrink-0 items-center gap-2 pb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim transition-colors duration-500 group-hover:text-(--p-accent)">
            {action}
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-1"
            >
              {arrow}
            </span>
          </span>
        )}
      </div>

      {/*
        Repisa: segunda percha del panel, en el pie. El dragón busca a lo
        largo de ella el tramo sin texto, que es el hueco entre la cifra y la
        acción, y se queda de pie delante de la ventana.
      */}
      <span
        aria-hidden
        data-perch={ledgeId}
        data-perch-corner={perchCorner}
        className="pointer-events-none absolute inset-x-0 bottom-4 h-px sm:bottom-5"
      />
    </div>
  );
}
