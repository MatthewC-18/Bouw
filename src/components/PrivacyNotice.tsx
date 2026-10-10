"use client";

import { COMPANY, type Localized } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import LogoMark from "./LogoMark";

/**
 * Aviso de privacidad del formulario de contacto.
 *
 * Lo pide la Ley Orgánica de Protección de Datos Personales (Ecuador): quien
 * recoge datos tiene que decir quién es, qué recoge, para qué, a quién se los
 * pasa, cuánto los guarda y cómo se ejercen los derechos. Está escrito para lo
 * que la web hace de verdad: un formulario que manda un correo, el idioma
 * guardado en el navegador, y nada más — sin analítica ni cookies de
 * seguimiento. Si eso cambia, este texto cambia con ello.
 */

type Section = { title: Localized; body: Localized[] };

const UPDATED: Localized = { es: "1 de octubre de 2026", en: "October 1, 2026" };

const SECTIONS: Section[] = [
  {
    title: { es: "Qué datos recogemos", en: "What we collect" },
    body: [
      {
        es: "Solo lo que escribes en el formulario de contacto: nombre, empresa (opcional), correo y mensaje. Si usaste el diagnóstico o la cuenta de horas, lo que marcaste entra en el mensaje y puedes borrarlo antes de enviar.",
        en: "Only what you type in the contact form: name, company (optional), email and message. If you used the diagnosis or the hours count, what you ticked goes into the message, and you can delete it before sending.",
      },
      {
        es: "No usamos cookies de seguimiento ni herramientas de analítica. El navegador guarda únicamente el idioma que elegiste para la página.",
        en: "We use no tracking cookies and no analytics. Your browser stores only the language you picked for the page.",
      },
    ],
  },
  {
    title: { es: "Para qué los usamos", en: "What we use it for" },
    body: [
      {
        es: "Para responder a tu mensaje y, si nos lo pides, preparar una propuesta. No los usamos para publicidad, no los vendemos y no los cedemos a terceros para sus propios fines.",
        en: "To reply to your message and, if you ask, to prepare a proposal. We don't use it for advertising, we don't sell it, and we don't hand it to third parties for their own purposes.",
      },
      {
        es: "La base para tratarlos es tu consentimiento, que das al marcar la casilla del formulario y que puedes retirar cuando quieras.",
        en: "The legal basis is your consent, given by ticking the box on the form, which you can withdraw at any time.",
      },
    ],
  },
  {
    title: { es: "Quién más los toca", en: "Who else handles it" },
    body: [
      {
        es: "Para que el mensaje llegue intervienen proveedores que actúan por encargo nuestro: Vercel (alojamiento de la web), Resend (envío del correo) y Google (nuestro buzón). Sus servidores están fuera de Ecuador, principalmente en Estados Unidos, así que enviar el formulario implica esa transferencia internacional.",
        en: "Delivering your message involves providers acting on our behalf: Vercel (website hosting), Resend (email delivery) and Google (our mailbox). Their servers are outside Ecuador, mainly in the United States, so sending the form involves that international transfer.",
      },
      {
        es: "Si escribes por WhatsApp, el mensaje lo procesa WhatsApp (Meta) según sus propias condiciones.",
        en: "If you write on WhatsApp, the message is processed by WhatsApp (Meta) under its own terms.",
      },
    ],
  },
  {
    title: { es: "Cuánto tiempo los guardamos", en: "How long we keep it" },
    body: [
      {
        es: "Hasta dos años desde el último intercambio, salvo que haya una relación comercial: entonces, lo que exijan las normas tributarias para facturas y contratos.",
        en: "Up to two years from our last exchange, unless there is a business relationship: then, whatever tax rules require for invoices and contracts.",
      },
    ],
  },
  {
    title: { es: "Tus derechos", en: "Your rights" },
    body: [
      {
        es: "Puedes pedir acceso a tus datos, corregirlos, eliminarlos, oponerte a su uso, pedir su portabilidad o la suspensión del tratamiento. Escríbenos al correo de abajo; respondemos en un máximo de 15 días.",
        en: "You can ask to access your data, correct it, delete it, object to its use, request portability or suspension of processing. Write to the address below; we answer within 15 days at most.",
      },
      {
        es: "Si no quedas conforme, puedes acudir a la Superintendencia de Protección de Datos Personales.",
        en: "If you are not satisfied, you can turn to Ecuador's Superintendency of Personal Data Protection.",
      },
    ],
  },
];

export default function PrivacyNotice() {
  const { t, lang, setLang } = useLang();

  return (
    <main className="min-h-screen bg-navy-950 text-ink">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <a href="/" data-cursor="link" aria-label={COMPANY.name}>
            <LogoMark className="h-10 w-auto" preload />
          </a>
          <button
            type="button"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            data-cursor="link"
            className="rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim hover:text-ink"
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
          {lang === "es" ? "Protección de datos" : "Data protection"}
        </p>
        <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] font-bold leading-[1.08]">
          {lang === "es" ? "Aviso de privacidad" : "Privacy notice"}
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-soft">
          {lang === "es"
            ? "Qué hacemos con los datos que nos dejas en el formulario de contacto, en cumplimiento de la Ley Orgánica de Protección de Datos Personales del Ecuador."
            : "What we do with the data you leave in the contact form, under Ecuador's Organic Law on Personal Data Protection."}
        </p>

        <section className="mt-12 border border-white/10 bg-navy-900/60 p-6 text-[15px] leading-relaxed text-ink-soft">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">
            {lang === "es" ? "Responsable" : "Data controller"}
          </h2>
          <p className="mt-3 text-ink">
            {COMPANY.legalName ? `${COMPANY.legalName} (${COMPANY.name})` : COMPANY.name}
            {COMPANY.ruc ? ` · RUC ${COMPANY.ruc}` : ""}
          </p>
          <p>{COMPANY.locations[0]}</p>
          <p>
            <a
              href={`mailto:${COMPANY.email}`}
              data-cursor="link"
              className="text-cyan-light underline underline-offset-2"
            >
              {COMPANY.email}
            </a>
          </p>
        </section>

        {SECTIONS.map((s) => (
          <section key={s.title.es} className="mt-12">
            <h2 className="font-display text-xl font-bold text-ink">{t(s.title)}</h2>
            {s.body.map((p) => (
              <p key={p.es} className="mt-4 text-[16px] leading-relaxed text-ink-soft">
                {t(p)}
              </p>
            ))}
          </section>
        ))}

        <p className="mt-16 border-t border-white/[0.07] pt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim">
          {lang === "es" ? "Actualizado el " : "Updated "}
          {t(UPDATED)}
        </p>
      </article>
    </main>
  );
}
