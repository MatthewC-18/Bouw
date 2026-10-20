"use client";

import { Check, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { setBrief } from "@/lib/brief";
import { HUNT } from "@/lib/content";
import { useLang } from "@/lib/i18n";

type Spot = (typeof HUNT.spots)[number];

const BEFORE = "/servicios/lean-antes.webp";
const AFTER = "/servicios/lean-despues.webp";
/** Cuánto se acerca cada recorte del antes y del después. */
const ZOOM = 3.4;

/** Un trozo de la ilustración, ampliado alrededor de un punto (en %). */
function Crop({ src, x, y, label, tone }: { src: string; x: number; y: number; label: string; tone: "bad" | "good" }) {
  // Con `background-size` al Z %, la posición que centra el punto (cx, cy) es
  // (cx·Z − 50) / (Z − 1), en %. Se recorta a 0–100 para no salirse.
  const pos = (c: number) => Math.min(100, Math.max(0, (c * ZOOM - 50) / (ZOOM - 1)));
  return (
    <figure className="min-w-0">
      <div
        className="aspect-[4/3] rounded-lg bg-[#0b1626] ring-1 ring-white/10"
        style={
          {
            backgroundImage: `url(${src})`,
            backgroundSize: `${ZOOM * 100}%`,
            backgroundPosition: `${pos(x)}% ${pos(y)}%`,
          } as CSSProperties
        }
      />
      <figcaption className="mt-1.5 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-dim">
        <span className={`h-1.5 w-1.5 rounded-full ${tone === "bad" ? "bg-orange-brand" : "bg-[#3ecf8e]"}`} aria-hidden />
        {label}
      </figcaption>
    </figure>
  );
}

/**
 * Encuentra los desperdicios: la planta de hoy, para tocarla.
 *
 * Ver `HUNT` en `content.ts`. Cada punto escondido se marca al tocarlo y la
 * ficha de al lado (debajo en el teléfono) dice qué es, qué cuesta y cómo
 * se ve arreglado, con el mismo rincón de la planta hoy y ordenada. Con los
 * seis, la planta entera pasa a ordenada y aparece la llamada, que se lleva
 * lo encontrado al formulario.
 *
 * Los puntos laten suave para que se encuentren también en el teléfono, sin
 * decir qué hay en cada uno: lo que se cuenta solo sale al tocar.
 */
export default function PlantHunt() {
  const { t, lang } = useLang();
  const [found, setFound] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const total = HUNT.spots.length;
  const all = found.length === total;
  const spot: Spot | undefined = HUNT.spots.find((s) => s.id === open);

  const tap = (s: Spot) => {
    setOpen(s.id);
    setFound((f) => (f.includes(s.id) ? f : [...f, s.id]));
  };

  const ask = () => {
    const names = (l: "es" | "en") => HUNT.spots.map((s) => s.name[l].toLowerCase()).join(", ");
    setBrief({
      service: {
        es: `Quiero un diagnóstico Lean de mi planta. En la planta de ejemplo encontré los ${total} desperdicios (${names("es")}) y quiero saber cuáles tengo yo.`,
        en: `I'd like a Lean diagnosis of my plant. I found all ${total} kinds of waste in the sample plant (${names("en")}) and want to know which ones I have.`,
      },
    });
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hunt relative py-20 lg:py-28">
      <div className="mx-auto max-w-[1560px] px-6 lg:px-16">
        {/* Cabecera, con el contador */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">{t(HUNT.eyebrow)}</p>
            <h2 className="mt-4 font-display text-[clamp(2.1rem,4.6vw,3.75rem)] font-bold leading-[0.98] text-ink">
              {t(HUNT.title)}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t(HUNT.body)}</p>
          </div>
          {/* Percha del dragón: sobre el contador, sin tapar el titular */}
          <div className="flex items-center gap-4" data-perch="capitulo-01" data-perch-corner="right">
            <div className="text-right">
              <p className="font-display text-[2.5rem] font-bold leading-none tabular-nums text-ink">
                {found.length}
                <span className="text-ink-dim">/{total}</span>
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">{t(HUNT.found)}</p>
            </div>
            <div className="flex gap-1" aria-hidden>
              {HUNT.spots.map((s) => (
                <span
                  key={s.id}
                  className={`h-8 w-1.5 rounded-full transition-colors duration-500 ${found.includes(s.id) ? "bg-[#3ecf8e]" : "bg-ink-dim/25"}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-12 lg:gap-8">
          {/* La planta */}
          <div className="relative overflow-hidden rounded-[24px] bg-[#0b1626] ring-1 ring-white/10 lg:col-span-8">
            <div className="relative aspect-[1400/899] w-full">
              <Image
                src={BEFORE}
                alt={
                  lang === "es"
                    ? "Planta en isométrico con piezas apiladas, recorridos cruzados, un operador esperando y una máquina en rojo"
                    : "Isometric plant with piled-up parts, crossing paths, an operator waiting and a machine in the red"
                }
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              {/* Con los seis, la planta ordenada */}
              <Image
                src={AFTER}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className={`object-cover transition-opacity duration-[1400ms] ${all ? "opacity-100" : "opacity-0"}`}
              />

              {!all &&
                HUNT.spots.map((s) => {
                  const done = found.includes(s.id);
                  const active = open === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => tap(s)}
                      aria-label={done ? t(s.name) : lang === "es" ? "Punto por descubrir" : "Spot to discover"}
                      aria-pressed={active}
                      className="group/spot absolute -translate-x-1/2 -translate-y-1/2 p-2"
                      style={{ left: `${s.x}%`, top: `${s.y}%` }}
                    >
                      {!done && <span className="hunt-ping absolute inset-2 rounded-full bg-orange-brand/50" aria-hidden />}
                      <span
                        className={`relative grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold shadow-[0_6px_18px_-6px_rgba(0,0,0,0.7)] ring-2 transition-[background-color,transform] duration-300 group-hover/spot:scale-110 sm:h-8 sm:w-8 ${
                          done
                            ? "bg-[#3ecf8e] text-[#06231a] ring-[#eafff5]"
                            : "bg-orange-brand text-[#1b0d02] ring-[#ffe2c4]"
                        } ${active ? "scale-110" : ""}`}
                      >
                        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : "?"}
                      </span>
                      {done && (
                        <span className="pointer-events-none absolute left-1/2 top-full hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-[rgba(7,17,31,0.88)] sm:block px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#eef3f9]">
                          {t(s.name)}
                        </span>
                      )}
                    </button>
                  );
                })}

              {found.length === 0 && (
                <span className="pointer-events-none absolute left-1/2 top-[6%] -translate-x-1/2 rounded-full bg-[rgba(7,17,31,0.86)] px-3 py-1.5 text-[12px] font-semibold text-[#eef3f9] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)] sm:text-[13px]">
                  {t(HUNT.hint)}
                </span>
              )}
            </div>
          </div>

          {/* La ficha de lo que se tocó */}
          <div className="flex min-h-0 flex-col lg:col-span-4" aria-live="polite">
            {all ? (
              <div key="all" className="pain-in flex h-full flex-col justify-center rounded-[24px] border border-(--hunt-good)/40 bg-(--hunt-good)/[0.07] p-6 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-(--hunt-good)">
                  {total}/{total} {t(HUNT.found)}
                </p>
                <p className="mt-3 font-display text-[clamp(1.5rem,2.4vw,2rem)] font-bold leading-[1.08] text-ink">{t(HUNT.done)}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {HUNT.spots.map((s) => (
                    <li key={s.id} className="rounded-full border border-ink-dim/30 px-2.5 py-1 font-mono text-[10.5px] text-ink-soft">
                      {t(s.name)}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={ask}
                    className="group/cta inline-flex items-center gap-3 rounded-full bg-[#3ecf8e] px-6 py-3.5 text-[15px] font-semibold text-[#06231a] transition-[filter,translate] duration-300 hover:-translate-y-0.5 hover:brightness-110"
                  >
                    {t(HUNT.cta)}
                    <span aria-hidden className="transition-transform duration-500 group-hover/cta:translate-x-1">
                      →
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFound([]);
                      setOpen(null);
                    }}
                    className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-dim transition-colors hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t(HUNT.again)}
                  </button>
                </div>
              </div>
            ) : spot ? (
              <div key={spot.id} className="pain-in flex h-full flex-col rounded-[24px] border border-ink-dim/25 bg-ink/[0.03] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#3ecf8e] text-[#06231a]">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <h3 className="font-display text-[1.6rem] font-bold leading-none text-ink">{t(spot.name)}</h3>
                  <span className="ml-auto rounded-full border border-cyan-brand/40 px-2 py-0.5 font-mono text-[10px] text-cyan-light">
                    {spot.tool}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Crop src={BEFORE} x={spot.x} y={spot.y} label={t(HUNT.today)} tone="bad" />
                  <Crop src={AFTER} x={spot.fix.x} y={spot.fix.y} label={t(HUNT.fixed)} tone="good" />
                </div>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-light">{t(HUNT.costs)}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{t(spot.cost)}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-(--hunt-good)">{t(HUNT.fix)}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{t(spot.how)}</p>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center rounded-[24px] border border-dashed border-ink-dim/35 p-6 sm:p-8">
                <p className="font-display text-[1.4rem] font-bold leading-tight text-ink">
                  {lang === "es" ? "Toca un punto naranja de la planta." : "Tap an orange spot on the plant."}
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                  {lang === "es"
                    ? "Aquí verás qué desperdicio es, cuánto cuesta y el mismo rincón ya arreglado."
                    : "You'll see which waste it is, what it costs and the same corner already fixed."}
                </p>
              </div>
            )}
            {!all && found.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFound(HUNT.spots.map((s) => s.id));
                  setOpen(null);
                }}
                className="mt-3 self-start font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-dim underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {t(HUNT.reveal)}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
