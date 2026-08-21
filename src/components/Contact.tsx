"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  COMPANY,
  CONTACT,
  SYMPTOMS,
  WEEKS_PER_YEAR,
  type Lang,
  type Localized,
} from "@/lib/content";
import { getBrief, getBriefServer, subscribeBrief, setBrief, type Brief } from "@/lib/brief";
import { useLang } from "@/lib/i18n";
import FireCta from "./FireCta";
import Reveal from "./Reveal";

const FIELD =
  "w-full border border-white/10 bg-navy-950/70 px-4 py-3.5 text-sm text-ink placeholder:text-ink-dim/60 outline-none transition-colors focus:border-cyan-brand focus:bg-navy-950";

const LABEL =
  "mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim";

/**
 * Redacta el mensaje con lo que el visitante ya respondió arriba.
 *
 * Las dos herramientas de la página producen un dato concreto sobre su
 * operación. Si al llegar aquí encuentra un cuadro en blanco, ese dato se
 * pierde y lo que escribe es "hola, quisiera información" — que es
 * exactamente el mensaje que no sirve para contestar nada.
 */
function draftFrom(brief: Brief, t: (v: Localized) => string, lang: Lang) {
  const lines: string[] = [];

  if (brief.symptoms.length > 0) {
    lines.push(
      lang === "es"
        ? "Marqué en el diagnóstico:"
        : "Ticked in the diagnosis:",
    );
    for (const id of brief.symptoms) {
      const s = SYMPTOMS.find((x) => x.id === id);
      if (s) lines.push(`· ${t(s.label)}`);
    }
  }

  const c = brief.count;
  if (c) {
    if (lines.length) lines.push("");
    const what =
      c.task ||
      (lang === "es" ? "una tarea que hacemos a mano" : "a task we do by hand");
    const people =
      lang === "es"
        ? c.people === 1
          ? "1 persona"
          : `${c.people} personas`
        : `${c.people} ${c.people === 1 ? "person" : "people"}`;
    lines.push(
      lang === "es"
        ? `La cuenta de horas, sobre ${what}: ${c.perWeek} veces por semana × ${c.minutes} min × ${people} × ${WEEKS_PER_YEAR} semanas = ${c.hours} horas al año${c.cost ? ` (unos $${c.cost})` : ""}.`
        : `The hours count, on ${what}: ${c.perWeek} times a week × ${c.minutes} min × ${people} × ${WEEKS_PER_YEAR} weeks = ${c.hours} hours a year${c.cost ? ` (about $${c.cost})` : ""}.`,
    );
  }

  return lines.join("\n");
}

export default function Contact() {
  const { t, lang } = useLang();

  /*
   * `useSyncExternalStore` y no un contexto: el que escribe está a dos
   * secciones de aquí y el que lee es solo este componente. Un proveedor
   * envolviendo media página para conectar dos puntos es más cañería de la
   * que hace falta.
   */
  const brief = useSyncExternalStore(subscribeBrief, getBrief, getBriefServer);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });

  const draft = useMemo(() => draftFrom(brief, t, lang), [brief, t, lang]);

  /*
   * El borrador no pisa lo que el visitante haya escrito.
   *
   * Solo entra si el cuadro está vacío o si lo que hay dentro es el borrador
   * anterior — o sea, si nadie lo ha tocado. Sobrescribir un párrafo escrito
   * a mano porque alguien marcó otra casilla arriba sería peor que no
   * rellenar nada.
   */
  /*
   * El borrador anterior se guarda en una variable local antes de tocar el
   * `ref`, y no se lee desde dentro del actualizador.
   *
   * La función que se le pasa a `setForm` no corre aquí: corre en el render
   * siguiente. Leyendo `lastDraft.current` dentro, para entonces ya valía el
   * borrador NUEVO, la comparación nunca se cumplía y la cuenta de horas no
   * llegaba a escribirse — el diagnóstico sí, porque ese caso entraba por la
   * rama del cuadro vacío.
   */
  const lastDraft = useRef("");
  useEffect(() => {
    if (!draft) return;
    const previous = lastDraft.current;
    lastDraft.current = draft;
    setForm((f) =>
      f.message === "" || f.message === previous ? { ...f, message: draft } : f,
    );
  }, [draft]);

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const clearDraft = () => {
    setBrief({ symptoms: [], count: null });
    lastDraft.current = "";
    setForm((f) => ({ ...f, message: "" }));
  };

  // El sitio no tiene backend: el formulario compone el mensaje y lo abre
  // en el cliente de correo o en WhatsApp. Cero dependencias de servidor.
  const body = useMemo(() => {
    const lines = [
      `${t(CONTACT.form.name)}: ${form.name}`,
      form.company ? `${t(CONTACT.form.company)}: ${form.company}` : null,
      `${t(CONTACT.form.email)}: ${form.email}`,
      "",
      form.message,
    ].filter(Boolean);
    return lines.join("\n");
  }, [form, t]);

  const mailto = `mailto:${COMPANY.email}?subject=${encodeURIComponent(
    t(CONTACT.form.subject),
  )}&body=${encodeURIComponent(body)}`;

  const whatsapp = `${COMPANY.whatsapp}?text=${encodeURIComponent(
    `${t(CONTACT.form.subject)}\n\n${body}`,
  )}`;

  const canSend = form.name.trim() !== "" && form.message.trim() !== "";
  const carried = brief.symptoms.length > 0 || brief.count !== null;

  return (
    <section
      id="contacto"
      /*
        Con velo, y aquí era lo más urgente: la marca de tres dimensiones se
        arma justo detrás del correo, del teléfono y del formulario, en
        naranja y cián a plena luz. Es la sección que decide si alguien
        escribe, y era la menos legible de la página.
      */
      className="veil relative border-t border-white/[0.06] py-28 lg:py-40"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-brand/60 to-transparent" />

      {/*
        `relative` no es decorativo: el velo de la sección es un `::before`
        posicionado, y un hijo sin posicionar se pinta por debajo de él. Sin
        esto el velo se pone delante del texto en vez de detrás.
      */}
      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        {/* Se enciende cuando el dragón escupe fuego al final del recorrido */}
        <FireCta />

        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
              {t(CONTACT.eyebrow)}
            </p>
            <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.06] text-ink">
              {t(CONTACT.title)}
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-soft">
              {t(CONTACT.subtitle)}
            </p>

            <dl className="mt-10 space-y-6">
              <div>
                <dt className={LABEL}>{lang === "es" ? "Correo" : "Email"}</dt>
                <dd>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    data-cursor="link"
                    className="text-lg text-ink transition-colors hover:text-cyan-light"
                  >
                    {COMPANY.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className={LABEL}>
                  {lang === "es" ? "Teléfono / WhatsApp" : "Phone / WhatsApp"}
                </dt>
                <dd>
                  <a
                    href={COMPANY.whatsapp}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-cursor="link"
                    className="text-lg text-ink transition-colors hover:text-cyan-light"
                  >
                    {COMPANY.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className={LABEL}>{lang === "es" ? "Sedes" : "Offices"}</dt>
                <dd className="text-lg text-ink">
                  {COMPANY.locations.join("  ·  ")}
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={120}>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="border border-white/10 bg-navy-900/82 p-7 sm:p-10"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={LABEL} htmlFor="c-name">
                    {t(CONTACT.form.name)}
                  </label>
                  <input
                    id="c-name"
                    className={FIELD}
                    value={form.name}
                    onChange={update("name")}
                    placeholder={t(CONTACT.form.namePlaceholder)}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="c-company">
                    {t(CONTACT.form.company)}
                  </label>
                  <input
                    id="c-company"
                    className={FIELD}
                    value={form.company}
                    onChange={update("company")}
                    placeholder={t(CONTACT.form.companyPlaceholder)}
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className={LABEL} htmlFor="c-email">
                  {t(CONTACT.form.email)}
                </label>
                <input
                  id="c-email"
                  type="email"
                  className={FIELD}
                  value={form.email}
                  onChange={update("email")}
                  placeholder={t(CONTACT.form.emailPlaceholder)}
                  autoComplete="email"
                />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-baseline justify-between gap-4">
                  <label className={`${LABEL} mb-0`} htmlFor="c-message">
                    {t(CONTACT.form.message)}
                  </label>
                  {carried && (
                    <button
                      type="button"
                      onClick={clearDraft}
                      data-cursor="link"
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-light/70 transition-colors hover:text-cyan-light"
                    >
                      {lang === "es"
                        ? "Viene de arriba · vaciar"
                        : "Filled from above · clear"}
                    </button>
                  )}
                </div>
                <textarea
                  id="c-message"
                  rows={7}
                  className={`${FIELD} resize-none`}
                  value={form.message}
                  onChange={update("message")}
                  placeholder={t(CONTACT.form.messagePlaceholder)}
                />
              </div>

              {/*
                Tinta plana. Iban con degradado cián→cián y un escalado al
                pasar el ratón; el mismo recurso que ya se había quitado del
                titular y de la barra de desplazamiento por ser lo que más
                delata una plantilla generada.
              */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={canSend ? mailto : undefined}
                  aria-disabled={!canSend}
                  data-cursor="link"
                  className={`flex-1 px-7 py-4 text-center text-sm font-semibold transition-colors duration-300 ${
                    canSend
                      ? "bg-cyan-brand text-navy-950 hover:bg-cyan-light"
                      : "cursor-not-allowed border border-white/10 text-ink-dim/60"
                  }`}
                >
                  {t(CONTACT.form.sendEmail)}
                </a>

                <a
                  href={canSend ? whatsapp : undefined}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-disabled={!canSend}
                  data-cursor="link"
                  className={`flex-1 border px-7 py-4 text-center text-sm font-semibold transition-colors duration-300 ${
                    canSend
                      ? "border-orange-brand/60 text-orange-light hover:bg-orange-brand/10"
                      : "cursor-not-allowed border-white/10 text-ink-dim/60"
                  }`}
                >
                  {t(CONTACT.form.sendWhatsapp)}
                </a>
              </div>

              <p className="mt-4 text-center text-[11px] text-ink-dim/70">
                {lang === "es"
                  ? "Al enviar se abre tu correo o WhatsApp con el mensaje listo."
                  : "Sending opens your mail app or WhatsApp with the message ready."}
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
