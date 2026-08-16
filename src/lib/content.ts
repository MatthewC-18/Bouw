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
  { id: "proceso", label: { es: "Proceso", en: "Process" } },
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
/* Bandas entre secciones                                              */
/* ------------------------------------------------------------------ */

/**
 * Frases cortas que ocupan las bandas donde la escena 3D queda a la vista.
 * Deben poder leerse solas: son la postura de la empresa, no relleno.
 */
export const BREAKS: { mark: string; quote: Localized }[] = [
  {
    mark: "A—01",
    quote: {
      es: "No entregamos diagnósticos. Entregamos el proceso corriendo.",
      en: "We don't deliver diagnoses. We deliver the process, running.",
    },
  },
  {
    mark: "A—02",
    quote: {
      es: "Si no se puede medir, no lo llamamos mejora.",
      en: "If it can't be measured, we don't call it an improvement.",
    },
  },
  {
    mark: "A—03",
    quote: {
      es: "Dos husos horarios, una sola conversación.",
      en: "Two time zones, one conversation.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Proyectos                                                           */
/* ------------------------------------------------------------------ */

export type Project = {
  slug: string;
  index: string;
  title: Localized;
  client: Localized;
  category: Localized;
  summary: Localized;
  description: Localized;
  /** Lo que cambió, en concreto */
  outcome: Localized;
  tags: string[];
  /** Cifras reales del proyecto */
  metrics: { value: string; label: Localized }[];
  accent: "cyan" | "orange" | "navy" | "mixed";
  /** Marca los proyectos donde el 3D es el diferenciador */
  has3D: boolean;
  /**
   * Cómo se presenta el panel de medios.
   * `screen` captura de interfaz, `photo` foto de producto (va sobre un
   * paspartú oscuro para que una imagen clara no rompa la paleta),
   * `drawing` gráfico técnico dibujado en SVG.
   */
  mediaKind: "screen" | "photo" | "drawing";
  /** Texto del chip en la barra del panel */
  mediaChip: string;
  /** Imagen real en /public/proyectos, si existe */
  image?: string;
  imageAlt?: Localized;
  /** Cuando no hay imagen, se dibuja este gráfico técnico */
  visual?: "device" | "ledger";
  href?: string;
  year: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "anatris",
    index: "01",
    year: "2026",
    title: { es: "Anatris", en: "Anatris" },
    client: {
      es: "Producto propio · Fisioterapia",
      en: "In-house product · Physiotherapy",
    },
    category: {
      es: "Salud · Atlas 3D",
      en: "Healthcare · 3D atlas",
    },
    summary: {
      es: "Atlas 3D de anatomía y biomecánica para fisioterapia, en el navegador.",
      en: "A 3D anatomy and biomechanics atlas for physiotherapy, in the browser.",
    },
    description: {
      es: "El cuerpo completo cargado como modelo navegable: se explora por región clínica, se inspecciona músculo por músculo y se revisan rangos de movimiento reales. Cada dato clínico va con su fuente citada.",
      en: "The full body loaded as a navigable model: explore it by clinical region, inspect it muscle by muscle and review real ranges of motion. Every clinical figure carries its citation.",
    },
    outcome: {
      es: "En línea y en producción en anatris.app, con recorrido guiado y aviso legal antes de usarse.",
      en: "Live in production at anatris.app, with a guided tour and a legal disclaimer before use.",
    },
    tags: ["React", "Three.js", "WebGL", "Supabase", "PWA"],
    metrics: [
      { value: "6", label: { es: "Regiones clínicas", en: "Clinical regions" } },
      { value: "113", label: { es: "Músculos con ficha", en: "Muscles documented" } },
      { value: "79", label: { es: "Tests con sens/spec", en: "Tests with sens/spec" } },
    ],
    accent: "cyan",
    has3D: true,
    mediaKind: "screen",
    mediaChip: "anatris.app",
    image: "/proyectos/anatris.png",
    imageAlt: {
      es: "Pantalla de Anatris mostrando un rango de movimiento de 116 grados",
      en: "Anatris screen showing a 116-degree range of motion",
    },
    href: "https://anatris.app",
  },
  {
    slug: "dispositivos-medicos",
    index: "02",
    year: "2025",
    title: {
      es: "Dispositivo médico",
      en: "Medical device",
    },
    client: {
      es: "Cliente del sector salud",
      en: "Healthcare sector client",
    },
    category: {
      es: "Diseño y validación de producto",
      en: "Product design and validation",
    },
    summary: {
      es: "Del concepto al prototipo validado, con la documentación técnica que exige el sector.",
      en: "From concept to validated prototype, with the technical file the sector demands.",
    },
    description: {
      es: "Diseño del dispositivo, definición de materiales y tolerancias, prototipado y campaña de pruebas. El expediente técnico se armó en paralelo al desarrollo, no después, para que la validación no fuera un cuello de botella al final.",
      en: "Device design, material and tolerance definition, prototyping and a test campaign. The technical file was built alongside development, not after, so validation never became a bottleneck at the end.",
    },
    outcome: {
      es: "Prototipo validado y expediente técnico listo para el proceso regulatorio del cliente.",
      en: "Validated prototype and a technical file ready for the client's regulatory process.",
    },
    tags: ["CAD", "Tolerancias", "Prototipado", "Validación", "ISO 13485"],
    metrics: [
      { value: "±0.01", label: { es: "Tolerancia crítica (mm)", en: "Critical tolerance (mm)" } },
      { value: "3", label: { es: "Iteraciones de prototipo", en: "Prototype iterations" } },
      { value: "100%", label: { es: "Requisitos trazados", en: "Requirements traced" } },
    ],
    accent: "navy",
    has3D: false,
    mediaKind: "drawing",
    mediaChip: "PLANO · REV C · 1:1",
    visual: "device",
  },
  {
    slug: "programa-contable",
    index: "03",
    year: "2025",
    title: {
      es: "Programa contable",
      en: "Accounting system",
    },
    client: {
      es: "Taller de manufactura",
      en: "Manufacturing workshop",
    },
    category: {
      es: "Automatización · Gestión",
      en: "Automation · Operations",
    },
    summary: {
      es: "Un ERP pequeño montado sobre Excel: inventario, kits, ventas y caja en un solo archivo.",
      en: "A small ERP built on Excel: inventory, kits, sales and cash in a single file.",
    },
    description: {
      es: "Once hojas conectadas por macros: clientes, productos, componentes, kits con su despiece, ventas, compras y gastos, anticipos y un tablero que se recalcula solo. El equipo siguió trabajando en la herramienta que ya sabía usar, sin migrar a otro sistema ni pagar licencias nuevas.",
      en: "Eleven sheets wired together with macros: customers, products, components, kits with their bill of materials, sales, purchases and expenses, advance payments and a dashboard that recalculates itself. The team kept working in the tool they already knew — no migration, no new licenses.",
    },
    outcome: {
      es: "El cierre mensual dejó de ser un armado manual: se genera desde los movimientos ya capturados.",
      en: "Month-end close stopped being manual assembly: it now builds itself from the entries already captured.",
    },
    tags: ["Excel", "VBA", "Inventario", "Kits / BOM", "Dashboard"],
    metrics: [
      { value: "11", label: { es: "Hojas conectadas", en: "Connected sheets" } },
      { value: "1", label: { es: "Archivo, cero licencias", en: "File, zero licenses" } },
      { value: "0", label: { es: "Migraciones de sistema", en: "System migrations" } },
    ],
    accent: "orange",
    has3D: false,
    mediaKind: "drawing",
    mediaChip: "Programa_contable.xlsm",
    visual: "ledger",
  },
  {
    slug: "charms-ecuador",
    index: "04",
    year: "2026",
    title: { es: "Charms Ecuador", en: "Charms Ecuador" },
    client: {
      es: "Taller de regalos en porcelana fría",
      en: "Cold porcelain gift workshop",
    },
    category: {
      es: "E-commerce · Marca",
      en: "E-commerce · Brand",
    },
    summary: {
      es: "De vender por Instagram a tener catálogo propio y cotizador automático.",
      en: "From selling over Instagram to a proper catalog with an automatic quote builder.",
    },
    description: {
      es: "Cada pieza es hecha a mano y a medida, así que el reto no era un carrito: era cotizar. El configurador arma el pedido paso a paso —tipo de pieza, personajes, mascotas, texto— calcula el precio y lo manda listo por WhatsApp al taller.",
      en: "Every piece is handmade to order, so the challenge was never a cart — it was quoting. The configurator builds the order step by step (piece type, characters, pets, text), prices it, and sends it ready to the workshop over WhatsApp.",
    },
    outcome: {
      es: "Sitio construido y listo para publicar; falta cerrar fotos finales y precios con la clienta.",
      en: "Site built and ready to publish; final photos and pricing still to be signed off with the client.",
    },
    tags: ["React", "Vite", "Tailwind", "Cotizador", "WhatsApp"],
    metrics: [
      { value: "3D", label: { es: "Renders de producto", en: "Product renders" } },
      { value: "1", label: { es: "Cotizador paso a paso", en: "Step-by-step quoter" } },
      { value: "0", label: { es: "Comisiones de plataforma", en: "Platform fees" } },
    ],
    accent: "mixed",
    has3D: false,
    mediaKind: "photo",
    mediaChip: "Pieza personalizada · porcelana fría",
    image: "/proyectos/charms-cuadro.webp",
    imageAlt: {
      es: "Cuadro de porcelana fría con figuras de una familia hecho por Charms",
      en: "Cold porcelain family portrait handmade by Charms",
    },
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
/* Proceso                                                             */
/* ------------------------------------------------------------------ */

export const PROCESS_INTRO = {
  eyebrow: { es: "Cómo trabajamos", en: "How we work" } satisfies Localized,
  title: {
    es: "Cuatro pasos, sin sorpresas",
    en: "Four steps, no surprises",
  } satisfies Localized,
  subtitle: {
    es: "El alcance y el precio se cierran antes de escribir la primera línea o tocar la primera máquina.",
    en: "Scope and price are locked before the first line of code or the first machine setup.",
  } satisfies Localized,
};

export const PROCESS: {
  step: string;
  title: Localized;
  body: Localized;
  duration: Localized;
}[] = [
  {
    step: "01",
    title: { es: "Diagnóstico", en: "Diagnosis" },
    body: {
      es: "Vamos al proceso real, no al que dice el manual. Medimos tiempos, contamos reprocesos y anotamos dónde duele.",
      en: "We go to the real process, not the one in the manual. We time it, count rework and write down where it hurts.",
    },
    duration: { es: "1–2 semanas", en: "1–2 weeks" },
  },
  {
    step: "02",
    title: { es: "Propuesta cerrada", en: "Fixed proposal" },
    body: {
      es: "Alcance, entregables, plazo y precio por escrito. Si algo no se puede prometer, lo decimos aquí y no después.",
      en: "Scope, deliverables, timeline and price in writing. If something can't be promised, we say it here — not later.",
    },
    duration: { es: "3–5 días", en: "3–5 days" },
  },
  {
    step: "03",
    title: { es: "Construcción", en: "Build" },
    body: {
      es: "Entregas parciales cada semana para que veas avance real y puedas corregir el rumbo a tiempo.",
      en: "Weekly partial deliveries so you see real progress and can change course in time.",
    },
    duration: { es: "4–10 semanas", en: "4–10 weeks" },
  },
  {
    step: "04",
    title: { es: "Entrega y acompañamiento", en: "Handover and support" },
    body: {
      es: "Capacitamos al equipo, dejamos la documentación y seguimos disponibles mientras el proceso se estabiliza.",
      en: "We train the team, leave the documentation and stay available while the process settles.",
    },
    duration: { es: "30 días", en: "30 days" },
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
      es: "Nuevo contacto desde el sitio de BOUW",
      en: "New enquiry from the BOUW site",
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
