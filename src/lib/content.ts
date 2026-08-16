/**
 * Contenido del sitio de BOUW — Automation & Digital Solutions.
 * Todo el copy vive aquí para poder editarlo sin tocar componentes.
 * Cada campo tiene versión `es` y `en`.
 */

export type Lang = "es" | "en";

export type Localized = Record<Lang, string>;

export const COMPANY = {
  name: "BOUW",
  tagline: {
    es: "Automation & Digital Solutions",
    en: "Automation & Digital Solutions",
  } satisfies Localized,
  email: "bouw.contacto@gmail.com",
  phoneDisplay: "+593 96 368 4012",
  phoneRaw: "593963684012",
  whatsapp: "https://wa.me/593963684012",
  locations: ["Quito, Ecuador", "Monterrey, México"],
  yearsExperience: 7,
};

/* ------------------------------------------------------------------ */
/* Navegación                                                          */
/* ------------------------------------------------------------------ */

export const NAV: { id: string; label: Localized }[] = [
  { id: "proyectos", label: { es: "Proyectos", en: "Work" } },
  { id: "servicios", label: { es: "Servicios", en: "Services" } },
  { id: "nosotros", label: { es: "Nosotros", en: "About" } },
  { id: "contacto", label: { es: "Contacto", en: "Contact" } },
];

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export const HERO = {
  eyebrow: {
    es: "Quito · Monterrey",
    en: "Quito · Monterrey",
  } satisfies Localized,
  titleTop: {
    es: "Del diseño",
    en: "From design",
  } satisfies Localized,
  titleAccent: {
    es: "a la realidad",
    en: "to reality",
  } satisfies Localized,
  subtitle: {
    es: "Automatizamos procesos, elevamos la calidad y convertimos ideas de ingeniería en productos que funcionan. Más de 7 años de experiencia combinada.",
    en: "We automate processes, raise quality standards and turn engineering ideas into products that actually work. 7+ years of combined experience.",
  } satisfies Localized,
  ctaPrimary: {
    es: "Ver proyectos",
    en: "See our work",
  } satisfies Localized,
  ctaSecondary: {
    es: "Hablemos",
    en: "Let's talk",
  } satisfies Localized,
  scrollHint: {
    es: "Desliza",
    en: "Scroll",
  } satisfies Localized,
};

/* ------------------------------------------------------------------ */
/* Métricas                                                            */
/* ------------------------------------------------------------------ */

export const STATS: { value: string; label: Localized }[] = [
  { value: "7+", label: { es: "Años de experiencia", en: "Years of experience" } },
  { value: "2", label: { es: "Sedes: Quito y Monterrey", en: "Offices: Quito & Monterrey" } },
  { value: "4", label: { es: "Industrias atendidas", en: "Industries served" } },
  { value: "3D", label: { es: "Visualización propia", en: "In-house visualization" } },
];

/* ------------------------------------------------------------------ */
/* Proyectos                                                           */
/* ------------------------------------------------------------------ */

export type Project = {
  slug: string;
  index: string;
  title: Localized;
  category: Localized;
  summary: Localized;
  description: Localized;
  tags: string[];
  /** Acento visual de la tarjeta */
  accent: "cyan" | "orange" | "navy" | "mixed";
  /** Marca los proyectos donde el 3D es el diferenciador */
  has3D: boolean;
  /** Enlace externo, opcional */
  href?: string;
  year: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "fisio-3d",
    index: "01",
    year: "2026",
    title: { es: "Fisio 3D", en: "Fisio 3D" },
    category: {
      es: "Salud · Visualización 3D",
      en: "Healthcare · 3D visualization",
    },
    summary: {
      es: "Plataforma de rehabilitación con anatomía interactiva en 3D.",
      en: "Rehabilitation platform with interactive 3D anatomy.",
    },
    description: {
      es: "Modelo anatómico navegable en el navegador: el terapeuta selecciona la zona, marca el ejercicio y el paciente ve exactamente qué músculo trabaja. Todo corre en tiempo real, sin instalar nada.",
      en: "A navigable anatomical model right in the browser: the therapist picks the area, assigns the exercise, and the patient sees exactly which muscle is working. Real-time, zero install.",
    },
    tags: ["Three.js", "WebGL", "React", "UX clínica"],
    accent: "cyan",
    has3D: true,
  },
  {
    slug: "dispositivos-medicos",
    index: "02",
    year: "2025",
    title: {
      es: "Soluciones para dispositivos médicos",
      en: "Medical device solutions",
    },
    category: {
      es: "Manufactura · Calidad",
      en: "Manufacturing · Quality",
    },
    summary: {
      es: "Ingeniería de proceso y control de calidad para línea de dispositivos médicos.",
      en: "Process engineering and quality control for a medical device line.",
    },
    description: {
      es: "Rediseño del flujo de producción y del sistema de control de calidad: validación de proceso, trazabilidad de lote y documentación lista para auditoría regulatoria.",
      en: "Redesign of the production flow and quality system: process validation, batch traceability and audit-ready regulatory documentation.",
    },
    tags: ["Lean", "Validación", "Trazabilidad", "ISO 13485"],
    accent: "navy",
    has3D: false,
  },
  {
    slug: "sistema-contable",
    index: "03",
    year: "2025",
    title: {
      es: "Sistema contable automatizado",
      en: "Automated accounting system",
    },
    category: {
      es: "Automatización · Finanzas",
      en: "Automation · Finance",
    },
    summary: {
      es: "Contabilidad completa sobre Excel, sin licencias ni migraciones.",
      en: "Full accounting on top of Excel — no licenses, no migration.",
    },
    description: {
      es: "Libro diario, mayor, balances y reportes generados automáticamente desde una sola captura. Cierra el mes en minutos y sin la fricción de cambiar de sistema.",
      en: "Journal, ledger, balance sheets and reports generated automatically from a single entry point. Month-end close in minutes, with no system migration.",
    },
    tags: ["Excel", "VBA", "Automatización", "Reportería"],
    accent: "orange",
    has3D: false,
  },
  {
    slug: "charms-ecuador",
    index: "04",
    year: "2026",
    title: { es: "Charms Ecuador", en: "Charms Ecuador" },
    category: {
      es: "E-commerce · Marca",
      en: "E-commerce · Brand",
    },
    summary: {
      es: "Catálogo y cotizador en línea para un taller de regalos personalizados.",
      en: "Online catalog and quote builder for a custom gift workshop.",
    },
    description: {
      es: "Sitio completo con catálogo de productos, configurador de pedidos personalizados y cotización que se envía directo a WhatsApp. Del Instagram a una tienda propia.",
      en: "Full site with product catalog, custom order configurator and quotes that go straight to WhatsApp. From an Instagram page to their own storefront.",
    },
    tags: ["React", "Tailwind", "WhatsApp API", "Diseño"],
    accent: "mixed",
    has3D: false,
  },
];

/* ------------------------------------------------------------------ */
/* Servicios                                                           */
/* ------------------------------------------------------------------ */

export type Service = {
  id: string;
  title: Localized;
  description: Localized;
  bullets: Localized[];
};

export const SERVICES_INTRO = {
  eyebrow: { es: "Qué hacemos", en: "What we do" } satisfies Localized,
  title: {
    es: "Procesos que funcionan, calidad que se comprueba",
    en: "Processes that work, quality you can prove",
  } satisfies Localized,
  subtitle: {
    es: "Trabajamos donde la ingeniería se cruza con el software: entendemos tu proceso, lo medimos y lo dejamos corriendo mejor de lo que estaba.",
    en: "We work where engineering meets software: we learn your process, measure it, and leave it running better than we found it.",
  } satisfies Localized,
};

export const SERVICES: Service[] = [
  {
    id: "procesos",
    title: { es: "Mejora de procesos", en: "Process improvement" },
    description: {
      es: "Mapeamos el proceso real, encontramos dónde se pierde el tiempo y rediseñamos el flujo.",
      en: "We map the real process, find where time leaks, and redesign the flow.",
    },
    bullets: [
      { es: "Diagnóstico y mapeo de flujo", en: "Diagnosis and value-stream mapping" },
      { es: "Reducción de tiempos y desperdicio", en: "Cycle time and waste reduction" },
      { es: "Indicadores y tableros de control", en: "KPIs and control dashboards" },
    ],
  },
  {
    id: "calidad",
    title: { es: "Sistemas de calidad", en: "Quality systems" },
    description: {
      es: "Documentación, validación y control listos para auditoría, sin burocracia inútil.",
      en: "Documentation, validation and control that pass audits — without useless bureaucracy.",
    },
    bullets: [
      { es: "Validación de proceso y producto", en: "Process and product validation" },
      { es: "Trazabilidad y control de lote", en: "Traceability and batch control" },
      { es: "Procedimientos y capacitación", en: "SOPs and team training" },
    ],
  },
  {
    id: "automatizacion",
    title: { es: "Automatización", en: "Automation" },
    description: {
      es: "Lo que hoy haces a mano tres veces por semana, mañana corre solo.",
      en: "Whatever you do by hand three times a week should be running on its own.",
    },
    bullets: [
      { es: "Herramientas internas a medida", en: "Custom internal tools" },
      { es: "Reportería y cierres automáticos", en: "Automated reporting and closings" },
      { es: "Integración entre sistemas", en: "System-to-system integration" },
    ],
  },
  {
    id: "producto",
    title: { es: "Diseño a producto", en: "Design to product" },
    description: {
      es: "Traemos tu diseño a la realidad: del concepto al prototipo y a la producción.",
      en: "We bring your design into reality: from concept to prototype to production.",
    },
    bullets: [
      { es: "Modelado y visualización 3D", en: "3D modeling and visualization" },
      { es: "Prototipado y validación técnica", en: "Prototyping and technical validation" },
      { es: "Acompañamiento a producción", en: "Production ramp-up support" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Nosotros                                                            */
/* ------------------------------------------------------------------ */

export const ABOUT = {
  eyebrow: { es: "Nosotros", en: "About us" } satisfies Localized,
  title: {
    es: "Dos sedes, un mismo estándar",
    en: "Two offices, one standard",
  } satisfies Localized,
  body: {
    es: "BOUW nace de un equipo de ingeniería con más de 7 años de experiencia combinada entre Ecuador y México. Nos enfocamos en la mejora de procesos, la calidad y la consultoría técnica: ayudamos a nuestros clientes a traer sus diseños a la realidad y a ahorrar tiempo en el camino.",
    en: "BOUW comes from an engineering team with 7+ years of combined experience across Ecuador and Mexico. We focus on process improvement, quality and technical consulting: we help clients bring their designs into reality and save time getting there.",
  } satisfies Localized,
  values: [
    {
      title: { es: "Medimos antes de opinar", en: "We measure before we opine" },
      body: {
        es: "Ninguna propuesta sale sin datos del proceso real detrás.",
        en: "No proposal ships without data from the real process behind it.",
      },
    },
    {
      title: { es: "Entregamos funcionando", en: "We ship it working" },
      body: {
        es: "No dejamos presentaciones bonitas: dejamos el proceso corriendo.",
        en: "We don't leave pretty slide decks — we leave the process running.",
      },
    },
    {
      title: { es: "Tu tiempo es el KPI", en: "Your time is the KPI" },
      body: {
        es: "Cada proyecto se mide en horas que tu equipo deja de perder.",
        en: "Every project is measured in hours your team stops losing.",
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Contacto                                                            */
/* ------------------------------------------------------------------ */

export const CONTACT = {
  eyebrow: { es: "Contacto", en: "Contact" } satisfies Localized,
  title: {
    es: "Cuéntanos qué quieres mejorar",
    en: "Tell us what you want to improve",
  } satisfies Localized,
  subtitle: {
    es: "Respondemos en menos de 24 horas hábiles. Escríbenos por correo o directo a WhatsApp.",
    en: "We reply within one business day. Reach us by email or straight on WhatsApp.",
  } satisfies Localized,
  form: {
    name: { es: "Nombre", en: "Name" } satisfies Localized,
    namePlaceholder: { es: "Tu nombre", en: "Your name" } satisfies Localized,
    company: { es: "Empresa", en: "Company" } satisfies Localized,
    companyPlaceholder: { es: "Opcional", en: "Optional" } satisfies Localized,
    email: { es: "Correo", en: "Email" } satisfies Localized,
    emailPlaceholder: { es: "tucorreo@empresa.com", en: "you@company.com" } satisfies Localized,
    message: { es: "Mensaje", en: "Message" } satisfies Localized,
    messagePlaceholder: {
      es: "Cuéntanos brevemente el reto…",
      en: "Briefly, what's the challenge…",
    } satisfies Localized,
    sendEmail: { es: "Enviar por correo", en: "Send by email" } satisfies Localized,
    sendWhatsapp: { es: "Enviar por WhatsApp", en: "Send on WhatsApp" } satisfies Localized,
    subject: {
      es: "Nuevo contacto desde bouw.com",
      en: "New enquiry from bouw.com",
    } satisfies Localized,
  },
};

export const FOOTER = {
  rights: {
    es: "Todos los derechos reservados.",
    en: "All rights reserved.",
  } satisfies Localized,
  builtWith: {
    es: "Hecho en Quito y Monterrey.",
    en: "Made in Quito and Monterrey.",
  } satisfies Localized,
};
