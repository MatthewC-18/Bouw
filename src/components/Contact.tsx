"use client";

import { useMemo, useState } from "react";
import { COMPANY, CONTACT } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import Reveal from "./Reveal";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-navy-950/70 px-4 py-3.5 text-sm text-ink placeholder:text-ink-dim/60 outline-none transition-colors focus:border-cyan-brand focus:bg-navy-950";

const LABEL =
  "mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim";

export default function Contact() {
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

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

  return (
    <section
      id="contacto"
      className="relative border-t border-white/[0.06] py-28 lg:py-40"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-brand/60 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
              {t(CONTACT.eyebrow)}
            </p>
            <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.06] text-ink">
              {t(CONTACT.title)}
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-ink-dim">
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
              className="rounded-3xl border border-white/10 bg-navy-900/60 p-7 backdrop-blur-xl sm:p-10"
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
                <label className={LABEL} htmlFor="c-message">
                  {t(CONTACT.form.message)}
                </label>
                <textarea
                  id="c-message"
                  rows={5}
                  className={`${FIELD} resize-none`}
                  value={form.message}
                  onChange={update("message")}
                  placeholder={t(CONTACT.form.messagePlaceholder)}
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={canSend ? mailto : undefined}
                  aria-disabled={!canSend}
                  data-cursor="link"
                  className={`flex-1 rounded-full px-7 py-4 text-center text-sm font-semibold transition-all duration-300 ${
                    canSend
                      ? "bg-gradient-to-r from-cyan-brand to-cyan-light text-navy-950 hover:scale-[1.02]"
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
                  className={`flex-1 rounded-full border px-7 py-4 text-center text-sm font-semibold transition-all duration-300 ${
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
