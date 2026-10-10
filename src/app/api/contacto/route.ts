import { COMPANY } from "@/lib/content";

/**
 * Envío del formulario de contacto.
 *
 * Antes el formulario solo componía un `mailto:` y abría el cliente de correo
 * del visitante. En un portátil sin Outlook configurado —la mayoría de los que
 * usan Gmail en el navegador— el botón no hacía nada y el mensaje se perdía
 * sin que nadie se enterara. Ahora el mensaje sale desde el servidor.
 *
 * Proveedor: Resend, por su API REST (sin SDK; es un solo `fetch`).
 * Variables de entorno, en Vercel y en `.env.local`:
 *
 *   RESEND_API_KEY   obligatoria. Sin ella la ruta responde 503 y el
 *                    formulario ofrece WhatsApp o el correo como antes.
 *   CONTACT_TO       a dónde llega. Por defecto, el correo de la empresa.
 *   CONTACT_FROM     remitente. Hasta verificar un dominio propio en Resend
 *                    solo vale `onboarding@resend.dev`, y entonces Resend
 *                    solo entrega al correo de la cuenta. Con bouw.ec
 *                    verificado: "BOUW <contacto@bouw.ec>".
 */

const LIMITS = { name: 120, company: 160, email: 200, message: 5000 } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Body = {
  name?: unknown;
  company?: unknown;
  email?: unknown;
  message?: unknown;
  lang?: unknown;
  /** Trampa: va oculto en el formulario. Una persona lo deja vacío. */
  website?: unknown;
};

const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  // Un robot rellena todo. Se le contesta como si hubiera ido bien, para que
  // no aprenda a esquivar la trampa.
  if (text(body.website, 200) !== "") {
    return Response.json({ ok: true });
  }

  const name = text(body.name, LIMITS.name);
  const company = text(body.company, LIMITS.company);
  const email = text(body.email, LIMITS.email);
  const message = text(body.message, LIMITS.message);
  const lang = body.lang === "en" ? "en" : "es";

  if (!name || !message || !EMAIL.test(email)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return Response.json({ error: "not-configured" }, { status: 503 });
  }

  const subject =
    lang === "es"
      ? `Contacto web: ${name}${company ? ` (${company})` : ""}`
      : `Website contact: ${name}${company ? ` (${company})` : ""}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "BOUW <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO || COMPANY.email],
      // Responder desde el correo contesta directamente a quien escribió.
      reply_to: email,
      subject,
      text: [
        `Nombre: ${name}`,
        company ? `Empresa: ${company}` : null,
        `Correo: ${email}`,
        `Idioma de la página: ${lang}`,
        "",
        message,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    }),
  });

  if (!res.ok) {
    // El detalle va al registro de Vercel, no al visitante.
    console.error("contacto: Resend respondió", res.status, await res.text());
    return Response.json({ error: "send-failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
