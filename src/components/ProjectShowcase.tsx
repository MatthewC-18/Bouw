"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ChevronsRight, MousePointerClick, Pointer } from "lucide-react";
import { PROJECTS, VITRINA, type Localized, type Project } from "@/lib/content";
import { setBrief } from "@/lib/brief";
import { dragonScreen } from "@/lib/dragonScreen";
import { useLang } from "@/lib/i18n";
import LiveSystem from "./LiveSystem";
import { Media } from "./ProjectMedia";

/**
 * La vitrina de proyectos.
 *
 * 25 nov 2026, Matthew: había que sumar dos proyectos sin que la página
 * pareciera «una página que baja interminablemente». Antes cada proyecto era
 * una fila de casi una pantalla, alternando el lado; Proyectos se llevaba la
 * mitad del recorrido. Ahora es una sola vitrina: la lista a un lado y el
 * escaparate del proyecto elegido al otro. Sumar un proyecto ya no alarga la
 * página.
 *
 * Lo que la distingue de la competencia, revisada ese día: el resultado en
 * el titular de cada ficha, el mismo recuadro para todos (sector, disciplina,
 * estado y tres cifras: cambiar de proyecto es comparar), los clientes sin
 * nombre descritos por su sector con «Nombre reservado», y el proyecto
 * elegido viaja al formulario («Quiero algo así»).
 *
 * Pasa sola cada `STEP_MS` mientras está a la vista, para quien solo baja;
 * se detiene con el ratón encima y se queda quieta para siempre en cuanto se
 * toca algo. Con «reducir movimiento», nunca pasa sola.
 *
 * 26 nov 2026, Matthew: «debe haber algo que les indique que le den clic a
 * cada proyecto». Encima de la lista, la invitación con su mano que toca
 * (`vit-hand`) y el contador «02 / 06»; cada fila con el punto de su color y
 * una flecha que entra al pasar el ratón; en el teléfono, «Desliza y toca»
 * y unas flechas al borde de las pastillas. Lo que se mueve solo se mueve
 * mientras la vitrina pasa sola y está a la vista.
 *
 * Alto fijo: el escaparate tiene proporción fija y los textos de todos los
 * proyectos se apilan en la misma celda (se ve uno). Si el alto cambiara al
 * pasar de proyecto, el dragón volvería a medir toda la página cada vez.
 */

const STEP_MS = 9000;
const PERCH = "vitrina";
const ASPECT = "aspect-[1/1] sm:aspect-[6/5] lg:aspect-[3/2]";

const num = (i: number) => String(i + 1).padStart(2, "0");

const LIST: Project[] = VITRINA.map((slug) => PROJECTS.find((p) => p.slug === slug)).filter(
  (p): p is Project => Boolean(p),
);

function stateOf(p: Project): Localized | null {
  if (p.status) return p.status;
  if (p.live) return p.live.kind === "simulador" ? { es: "Simulador", en: "Simulator" } : { es: "En vivo", en: "Live" };
  if (p.caseHref) return { es: "Caso", en: "Case study" };
  return null;
}

/** El texto de un proyecto: resultado, recuadro fijo y acciones. */
function Details({
  project,
  on,
  onLive,
}: {
  project: Project;
  on: boolean;
  onLive: () => void;
}) {
  const { t, lang } = useLang();
  const es = lang === "es";
  const state = stateOf(project);
  const sim = project.live?.kind === "simulador";

  const want = () => {
    setBrief({
      service: {
        es: `Me interesa algo como el proyecto «${project.title.es}».`,
        en: `I'm interested in something like the «${project.title.en}» project.`,
      },
    });
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`[grid-area:1/1] min-w-0 transition-opacity duration-500 ${
        on ? "opacity-100" : "pointer-events-none invisible opacity-0"
      }`}
      aria-hidden={!on}
      inert={!on}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-(--p-accent)">
        {t(project.category)}
      </p>
      <h3 className="mt-3 font-display text-[clamp(1.75rem,2.6vw,2.4rem)] font-bold leading-[1.02] text-ink">
        {t(project.title)}
      </h3>
      {/* El resultado va de titular, no al final */}
      <p className="mt-3 text-[16.5px] leading-snug text-ink">{t(project.outcome)}</p>

      {/* El mismo recuadro para todos: cambiar de proyecto es comparar */}
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-dim/15 pt-4">
        {project.metrics.map((m) => (
          <div key={m.value + m.label.es} className="min-w-0">
            <dt className="font-display text-[1.6rem] font-bold leading-none text-ink">{m.value}</dt>
            <dd className="mt-1.5 text-[12px] leading-snug text-ink-dim">{t(m.label)}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-4 grid gap-x-4 gap-y-1.5 border-t border-ink-dim/15 pt-4 text-[13px] leading-snug sm:grid-cols-[auto_1fr]">
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim sm:pt-[3px]">
          {es ? "Cliente" : "Client"}
        </dt>
        <dd className="flex flex-wrap items-center gap-2 text-ink-soft">
          {t(project.client)}
          {project.reserved && (
            <span className="rounded-full border border-(--p-line) px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-(--p-accent)">
              {es ? "Nombre reservado" : "Name withheld"}
            </span>
          )}
        </dd>
        {state && (
          <>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim sm:pt-[3px]">
              {es ? "Estado" : "Status"}
            </dt>
            <dd className="text-ink-soft">{t(state)}</dd>
          </>
        )}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {project.live ? (
          <button
            type="button"
            onClick={onLive}
            data-cursor="link"
            className="inline-flex items-center gap-2.5 rounded-full bg-(--p-accent) px-5 py-2.5 text-sm font-semibold text-(--p-on-accent) transition-opacity hover:opacity-90"
          >
            <svg width="9" height="11" viewBox="0 0 10 12" aria-hidden>
              <path d="M0 0l10 6-10 6z" fill="currentColor" />
            </svg>
            {sim ? (es ? "Ver la línea en marcha" : "See the line running") : es ? "Abrir en vivo" : "Open it live"}
          </button>
        ) : null}
        {project.caseHref && (
          <Link
            href={project.caseHref}
            className="inline-flex items-center gap-2 rounded-full border border-(--p-accent) px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-(--p-accent) hover:text-(--p-on-accent)"
          >
            {project.caseLabel ? t(project.caseLabel) : es ? "Ver el caso completo" : "See the full case"}
            <span aria-hidden>→</span>
          </Link>
        )}
        <button
          type="button"
          onClick={want}
          data-cursor="link"
          className="inline-flex items-center gap-2 rounded-full border border-ink-dim/30 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-(--p-accent) hover:text-(--p-accent)"
        >
          {es ? "Quiero algo así" : "I want something like this"}
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

export default function ProjectShowcase() {
  const { t, lang } = useLang();
  const es = lang === "es";
  const [active, setActive] = useState(0);
  // Pasa sola hasta que se toca algo; `hold` es la pausa con el ratón encima
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const [hold, setHold] = useState(false);
  const root = useRef<HTMLElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const project = LIST[active];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAuto(false);
      return;
    }
    const el = root.current;
    if (!el) return;
    let inView = false;
    const update = () => setVisible(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        update();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  // En el teléfono, la pastilla del elegido a la vista (solo en horizontal:
  // `scrollIntoView` movería también la página)
  useEffect(() => {
    const row = chips.current;
    const chip = row?.children[active] as HTMLElement | undefined;
    if (!row || !chip || row.offsetParent === null) return;
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  const next = useCallback(() => setActive((i) => (i + 1) % LIST.length), []);
  const pick = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  // Sistema en vivo: se abre desde el escaparate, como en las fichas
  const [liveFrom, setLiveFrom] = useState<DOMRect | null>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const panelEl = useRef<HTMLElement | null>(null);
  const openLive = useCallback((panel: HTMLElement) => {
    panelEl.current = panel;
    setAuto(false);
    window.dispatchEvent(new CustomEvent("bouw:project-open", { detail: { id: PERCH } }));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = !still && dragonScreen.target === PERCH ? 450 : 0;
    setTimeout(() => {
      setLiveFrom(panel.getBoundingClientRect());
      setLiveOpen(true);
    }, wait);
  }, []);
  const openFromButton = () => {
    const panel = root.current?.querySelector<HTMLElement>(".p-window, .p-bare");
    if (panel) openLive(panel);
  };
  const closeLive = useCallback(() => {
    setLiveOpen(false);
    panelEl.current?.closest<HTMLElement>("[data-perch-open]")?.focus();
  }, []);

  const running = auto && visible && !hold;
  const bar = (
    <span
      key={`bar-${active}`}
      aria-hidden
      className="vit-bar pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-(--p-accent)"
      style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: running ? "running" : "paused" }}
      onAnimationEnd={next}
    />
  );

  return (
    <article
      ref={root}
      data-tone={project.hue}
      className="project vitrina relative isolate"
      style={{ "--p-h": project.hue, "--p-glow-x": "70%" } as CSSProperties}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHold(false)}
      onClickCapture={() => setAuto(false)}
      aria-roledescription={es ? "vitrina de proyectos" : "project showcase"}
    >
      <div aria-hidden className="project-glow" />

      <div className="relative grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-12 lg:gap-12">
        {/* La lista */}
        <div className="min-w-0 lg:col-span-5 xl:col-span-4">
          {/* La invitación: que se note que cada proyecto se toca */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-(--p-accent)">
              <span aria-hidden className={`vit-hand ${running ? "is-on" : ""}`}>
                <MousePointerClick className="hidden lg:block" size={17} strokeWidth={1.8} />
                <Pointer className="lg:hidden" size={17} strokeWidth={1.8} />
              </span>
              <span className="hidden lg:inline">{es ? "Haz clic en un proyecto" : "Click a project"}</span>
              <span className="lg:hidden">{es ? "Desliza y toca un proyecto" : "Swipe and tap a project"}</span>
            </p>
            <span className="font-mono text-[11px] tabular-nums text-ink-dim" aria-live="polite">
              {num(active)} / {num(LIST.length - 1)}
            </span>
          </div>

          {/* Teléfono: pastillas que se deslizan de lado */}
          <div className="relative lg:hidden">
          <div
            ref={chips}
            role="tablist"
            aria-label={es ? "Proyectos" : "Projects"}
            className="-mx-6 flex snap-x gap-1.5 overflow-x-auto px-6 pb-1 pr-12 [mask-image:linear-gradient(to_right,black_78%,transparent)] [scrollbar-width:none]"
          >
            {LIST.map((p, i) => {
              const on = i === active;
              return (
                <button
                  key={p.slug}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => pick(i)}
                  className={`relative shrink-0 snap-start overflow-hidden rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
                    on ? "border-(--p-accent) bg-(--p-accent-soft) text-ink" : "border-ink-dim/25 text-ink-soft"
                  }`}
                >
                  <span
                    aria-hidden
                    className="vit-dot mr-2 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ "--dot-h": p.hue } as CSSProperties}
                  />
                  {t(p.title)}
                  {on && auto && bar}
                </button>
              );
            })}
          </div>
            {/* Hay más a la derecha */}
            <span
              aria-hidden
              className={`vit-swipe pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-(--p-accent) ${running ? "is-on" : ""}`}
            >
              <ChevronsRight size={20} strokeWidth={2} />
            </span>
          </div>

          {/* Escritorio: la lista entera */}
          <ol role="tablist" aria-orientation="vertical" aria-label={es ? "Proyectos" : "Projects"} className="hidden border-b border-ink-dim/15 lg:block">
            {LIST.map((p, i) => {
              const on = i === active;
              const state = stateOf(p);
              return (
                <li key={p.slug} role="presentation">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => pick(i)}
                    data-cursor="link"
                    className={`group/row relative flex w-full items-center gap-3.5 border-t border-ink-dim/15 px-3 py-3 text-left transition-colors duration-300 ${
                      on ? "bg-(--p-accent-soft)" : "hover:bg-ink/[0.035]"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`vit-dot h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-300 ${on ? "scale-125" : "group-hover/row:scale-125"}`}
                      style={{ "--dot-h": p.hue } as CSSProperties}
                    />
                    <span className={`font-mono text-[11px] tabular-nums ${on ? "text-(--p-accent)" : "text-ink-dim"}`}>
                      {num(i)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate font-display text-[17px] font-bold leading-tight transition-colors ${
                          on ? "text-ink" : "text-ink-soft group-hover/row:text-ink"
                        }`}
                      >
                        {t(p.title)}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
                        {t(p.client)}
                      </span>
                    </span>
                    {state && (
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                          on ? "border-(--p-accent) text-(--p-accent)" : "border-ink-dim/25 text-ink-dim"
                        }`}
                      >
                        {t(state)}
                      </span>
                    )}
                    {/* La flecha: el elegido la lleva fija; los demás, al pasar el ratón */}
                    <span
                      aria-hidden
                      className={`w-4 shrink-0 text-right transition-[opacity,translate] duration-300 ${
                        on
                          ? "text-(--p-accent)"
                          : "-translate-x-1.5 text-ink-dim opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100"
                      }`}
                    >
                      →
                    </span>
                    {on && auto && bar}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Escritorio: el texto del elegido, debajo de la lista */}
          <div className="mt-8 hidden lg:grid">
            {LIST.map((p, i) => (
              <Details key={p.slug} project={p} on={i === active} onLive={openFromButton} />
            ))}
          </div>
        </div>

        {/* El escaparate */}
        <div className="min-w-0 lg:col-span-7 xl:col-span-8">
          <Media
            project={project}
            index={num(active)}
            perchId={PERCH}
            ledgeId={`pie-${PERCH}`}
            perchCorner="left"
            fixedAspect={ASPECT}
            onOpen={project.live ? openLive : undefined}
          />
          {liveOpen && <LiveSystem project={project} from={liveFrom} onClose={closeLive} />}

          {/* Teléfono: el texto debajo del escaparate */}
          <div className="mt-6 grid lg:hidden">
            {LIST.map((p, i) => (
              <Details key={p.slug} project={p} on={i === active} onLive={openFromButton} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
