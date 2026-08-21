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

/*
 * Los anclas no cambian —hay enlaces sueltos por ahí— pero los rótulos sí:
 * dos de estas secciones ya no son un catálogo ni un método, son cosas que
 * el visitante puede usar, y el menú tiene que prometerlo.
 */
export const NAV: { id: string; label: Localized }[] = [
  { id: "proyectos", label: { es: "Proyectos", en: "Work" } },
  { id: "servicios", label: { es: "Diagnóstico", en: "Diagnosis" } },
  { id: "proceso", label: { es: "La cuenta", en: "The count" } },
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
  /*
   * El segundo botón decía "Hablemos" y llevaba al formulario. Pedir la
   * conversación en el primer pantallazo, antes de haber demostrado nada, es
   * el gesto que hace que una página se lea como un folleto.
   *
   * Ahora lleva a la calculadora, que es lo que le sirve al visitante ahora
   * mismo aunque nunca escriba. Y va como enlace de texto, no como segunda
   * píldora: dos botones iguales compitiendo es el patrón, no una decisión.
   */
  ctaSecondary: {
    es: "o calcula qué te cuesta hacerlo a mano",
    en: "or work out what doing it by hand costs you",
  } satisfies Localized,
  scrollHint: {
    es: "Desliza",
    en: "Scroll",
  } satisfies Localized,
};

/* ------------------------------------------------------------------ */
/* Sedes                                                               */
/* ------------------------------------------------------------------ */

/*
 * Aquí había cuatro métricas: "7+ años", "2 sedes", "4 industrias
 * atendidas", "3D visualización propia".
 *
 * Dos de ellas no eran métricas —"3D" no es una cantidad de nada— y las otras
 * dos ya estaban escritas en el párrafo de al lado. La fila de cifras grandes
 * bajo el titular no informa: ocupa el sitio donde el visitante espera
 * encontrar una razón para seguir bajando, y la rellena con el número de
 * oficinas.
 *
 * Lo que sí sirve saber en el primer segundo es si hay alguien despierto al
 * otro lado. Eso no se puede escribir en el HTML porque cambia cada minuto,
 * y por eso mismo es lo único de esta zona que no puede tener otra empresa
 * copiado y pegado.
 */
export const OFFICES: {
  city: string;
  country: Localized;
  /** Zona IANA: de aquí sale la hora local de verdad, sin restar a mano. */
  zone: string;
  /** Rótulo del huso. Ninguna de las dos sedes cambia la hora en verano. */
  tz: string;
  coords: string;
  since: string;
  /** Horario de oficina, en hora local. */
  opens: number;
  closes: number;
}[] = [
  {
    city: "Quito",
    country: { es: "Ecuador", en: "Ecuador" },
    zone: "America/Guayaquil",
    tz: "GMT-5",
    coords: "0.1807° S · 78.4678° W",
    since: "2019",
    opens: 8,
    closes: 18,
  },
  {
    city: "Monterrey",
    country: { es: "México", en: "Mexico" },
    zone: "America/Monterrey",
    tz: "GMT-6",
    coords: "25.6866° N · 100.3161° W",
    since: "2023",
    opens: 8,
    closes: 18,
  },
];

export const OFFICE_STATUS = {
  eyebrow: {
    es: "Ahora mismo",
    en: "Right now",
  } satisfies Localized,
  open: { es: "en horario", en: "open" } satisfies Localized,
  closed: { es: "fuera de horario", en: "closed" } satisfies Localized,
  /** Se muestra cuando al menos una de las dos sedes está trabajando. */
  someone: {
    es: "Hay alguien trabajando. Escribe y te contestamos hoy.",
    en: "Someone is at a desk. Write now and you get an answer today.",
  } satisfies Localized,
  nobody: {
    es: "Las dos sedes están cerradas. Lo que escribas ahora se contesta al abrir Quito.",
    en: "Both offices are closed. Anything you send now gets answered when Quito opens.",
  } satisfies Localized,
  overlap: {
    es: "Solape diario de las dos sedes: 09:00–18:00 hora de Quito.",
    en: "Daily overlap between both offices: 09:00–18:00 Quito time.",
  } satisfies Localized,
};

/* ------------------------------------------------------------------ */
/* Bandas entre secciones                                              */
/* ------------------------------------------------------------------ */

/**
 * Texto de las bandas donde la escena 3D queda a la vista.
 *
 * Eran tres aforismos —"si no se puede medir, no lo llamamos mejora"— y ese
 * es exactamente el género de frase que se puede pegar en la página de
 * cualquier consultora del mundo sin cambiar una palabra. Suenan a postura y
 * no dicen nada comprobable.
 *
 * Ahora cada banda hace un trabajo: anuncia lo que viene justo debajo, con
 * un dato que se puede verificar bajando dos dedos de pantalla. La banda
 * sigue siendo aire para que se vea el dragón, pero deja de ser relleno.
 */
export const BREAKS: { mark: string; quote: Localized }[] = [
  {
    mark: "A—01",
    quote: {
      es: "Cuatro proyectos abajo. Uno lo puedes abrir ahora mismo; los otros tres viven dentro de la operación de alguien.",
      en: "Four projects below. One you can open right now; the other three live inside somebody's operation.",
    },
  },
  {
    mark: "A—02",
    quote: {
      es: "Lo que sigue es una calculadora. Dice que no más veces de las que dice que sí.",
      en: "What follows is a calculator. It says no more often than it says yes.",
    },
  },
  {
    mark: "A—03",
    quote: {
      es: "Quito y Monterrey solapan nueve horas al día. Ese es todo el secreto de trabajar en dos husos.",
      en: "Quito and Monterrey overlap nine hours a day. That is the whole secret of working across two time zones.",
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
/* Diagnóstico: síntomas → disciplina                                  */
/* ------------------------------------------------------------------ */

/*
 * Aquí había cuatro tarjetas de servicio.
 *
 * Icono en un cuadrado redondeado, título, una línea de descripción, tres
 * viñetas con su puntito y la tarjeta levantándose un píxel al pasar el
 * ratón. Es el bloque más repetido que existe: se puede reconocer de lejos,
 * sin leerlo, en cualquier sitio de cualquier sector. Y no ayuda a decidir
 * nada, porque el visitante no llega sabiendo si lo suyo es "mejora de
 * procesos" o "sistemas de calidad" — llega sabiendo que el cierre de mes lo
 * arma alguien a mano los sábados.
 *
 * Así que se invierte. La lista que ve es la de los síntomas, en las palabras
 * en las que él los diría, y la disciplina es el RESULTADO de marcarlos. La
 * misma información técnica sigue estando —qué se entrega, cuánto tarda—
 * pero llega después de haber dicho lo que le pasa, que es cuando significa
 * algo.
 */

export type FieldId = "procesos" | "calidad" | "automatizacion" | "producto";

export type Field = {
  id: FieldId;
  name: Localized;
  /** Qué se entrega. En objetos, no en adjetivos. */
  delivers: Localized;
  /** Duración típica de un proyecto de esa disciplina. */
  span: Localized;
};

export const FIELDS: Field[] = [
  {
    id: "procesos",
    name: { es: "Mejora de procesos", en: "Process improvement" },
    delivers: {
      es: "El flujo rediseñado, medido antes y después, y el tablero con el que se vigila que no se vuelva a torcer.",
      en: "The redesigned flow, measured before and after, plus the dashboard that keeps it from drifting back.",
    },
    span: { es: "4–8 semanas", en: "4–8 weeks" },
  },
  {
    id: "calidad",
    name: { es: "Sistemas de calidad", en: "Quality systems" },
    delivers: {
      es: "Procedimientos, registros y trazabilidad que aguantan una auditoría, y el equipo entrenado en usarlos.",
      en: "Procedures, records and traceability that survive an audit, and the team trained to keep them.",
    },
    span: { es: "6–10 semanas", en: "6–10 weeks" },
  },
  {
    id: "automatizacion",
    name: { es: "Automatización", en: "Automation" },
    delivers: {
      es: "La herramienta corriendo dentro de tu operación, con la documentación para mantenerla sin nosotros.",
      en: "The tool running inside your operation, documented well enough to keep without us.",
    },
    span: { es: "4–10 semanas", en: "4–10 weeks" },
  },
  {
    id: "producto",
    name: { es: "Diseño a producto", en: "Design to product" },
    delivers: {
      es: "Del CAD al prototipo validado, con el expediente técnico armado en paralelo y no al final.",
      en: "From CAD to a validated prototype, with the technical file built alongside instead of at the end.",
    },
    span: { es: "8–16 semanas", en: "8–16 weeks" },
  },
];

export type Symptom = {
  id: string;
  /** Dicho como lo diría quien lo sufre, no como lo diría un folleto. */
  label: Localized;
  fields: FieldId[];
  /** Lo primero que haríamos. Una acción concreta, esta semana. */
  firstMove: Localized;
  /** Lo que hace falta de su lado para poder empezar. */
  needs: Localized;
};

export const SYMPTOMS: Symptom[] = [
  {
    id: "cierre",
    label: {
      es: "El cierre de mes lo arma alguien a mano, juntando archivos.",
      en: "Month-end close is assembled by hand, stitching files together.",
    },
    fields: ["automatizacion", "procesos"],
    firstMove: {
      es: "Seguimos un cierre entero contigo y cronometramos cada paso: de dónde sale cada número y cuántas veces se vuelve a teclear.",
      en: "We sit through one full close with you and time every step: where each number comes from and how many times it gets retyped.",
    },
    needs: {
      es: "El archivo que usas hoy y una hora de quien lo arma.",
      en: "The file you use today and an hour with whoever assembles it.",
    },
  },
  {
    id: "ciclo",
    label: {
      es: "No sé cuánto tarda de verdad una pieza en salir.",
      en: "I don't actually know how long a part takes to come out.",
    },
    fields: ["procesos"],
    firstMove: {
      es: "Medimos en planta, con reloj, durante los turnos que haga falta. No preguntamos cuánto tarda: lo tomamos.",
      en: "We measure on the floor, with a stopwatch, for as many shifts as it takes. We don't ask how long it takes — we time it.",
    },
    needs: {
      es: "Acceso al piso y permiso para estorbar un poco.",
      en: "Floor access and permission to be slightly in the way.",
    },
  },
  {
    id: "reproceso",
    label: {
      es: "Repetimos trabajo por errores que se detectan tarde.",
      en: "We redo work because errors surface too late.",
    },
    fields: ["calidad", "procesos"],
    firstMove: {
      es: "Contamos los reprocesos de los últimos tres meses y buscamos en qué paso se cuelan. En qué paso, no quién.",
      en: "We count the last three months of rework and find which step lets it through. Which step — not who.",
    },
    needs: {
      es: "Registros de rechazo, aunque estén incompletos.",
      en: "Reject records, even incomplete ones.",
    },
  },
  {
    id: "archivos",
    label: {
      es: "La misma información vive en tres archivos y ninguno cuadra.",
      en: "The same information lives in three files and none of them agree.",
    },
    fields: ["automatizacion"],
    firstMove: {
      es: "Dibujamos dónde nace cada dato y dónde se vuelve a escribir. Casi siempre sobra una de las tres copias.",
      en: "We map where each figure is born and where it gets re-entered. One of the three copies is almost always redundant.",
    },
    needs: {
      es: "Una copia de cada archivo, con datos reales.",
      en: "A copy of each file, with real data in it.",
    },
  },
  {
    id: "auditoria",
    label: {
      es: "Tenemos una auditoría o una certificación encima.",
      en: "We have an audit or a certification coming.",
    },
    fields: ["calidad"],
    firstMove: {
      es: "Levantamos qué exige la norma que aplica contra lo que ya tienes escrito. La lista de huecos sale en la primera semana.",
      en: "We line up what the standard demands against what you already have written. The gap list lands in week one.",
    },
    needs: {
      es: "La norma o el requisito del cliente, y lo que ya tengas documentado.",
      en: "The standard or the customer requirement, plus whatever is already documented.",
    },
  },
  {
    id: "fabricar",
    label: {
      es: "Hay un diseño que funciona en pantalla y no sabemos fabricarlo.",
      en: "We have a design that works on screen and no idea how to make it.",
    },
    fields: ["producto"],
    firstMove: {
      es: "Revisamos el diseño contra el proceso que lo va a hacer: tolerancias, material y cómo se sujeta la pieza para mecanizarla.",
      en: "We review the design against the process that has to make it: tolerances, material and how the part is held to machine it.",
    },
    needs: {
      es: "El CAD y, si ya existe, quién lo fabricaría.",
      en: "The CAD and, if you already have one, who would manufacture it.",
    },
  },
  {
    id: "cadaquien",
    label: {
      es: "Cada persona hace la misma tarea a su manera.",
      en: "Everyone does the same task their own way.",
    },
    fields: ["procesos", "calidad"],
    firstMove: {
      es: "Grabamos a tres personas haciendo la misma tarea y las comparamos. El procedimiento se escribe desde la que sale mejor, no desde el manual.",
      en: "We record three people doing the same task and compare. The procedure gets written from the one that works best, not from the manual.",
    },
    needs: {
      es: "Tres personas, y que ellas estén de acuerdo.",
      en: "Three people, and their agreement to be recorded.",
    },
  },
  {
    id: "copiar",
    label: {
      es: "Alguien pasa horas cada semana copiando datos de un sitio a otro.",
      en: "Somebody spends hours a week copying data from one place to another.",
    },
    fields: ["automatizacion"],
    firstMove: {
      es: "Antes de automatizar nada, hacemos la cuenta de horas que hay más abajo en esta misma página. Si no llega, te lo decimos.",
      en: "Before automating anything we run the hours count further down this page. If the number doesn't clear the bar, we say so.",
    },
    needs: {
      es: "Quién lo hace, cuántas veces y cuánto tarda.",
      en: "Who does it, how often, and how long it takes.",
    },
  },
  {
    id: "ensenar",
    label: {
      es: "Queremos enseñar el producto antes de tenerlo fabricado.",
      en: "We need to show the product before it exists.",
    },
    fields: ["producto"],
    firstMove: {
      es: "Modelamos la pieza y la montamos en un visor que se abre en el navegador, sin instalar nada. Como el bicho que llevas viendo desde arriba.",
      en: "We model the part and put it in a viewer that opens in a browser, no install. Like the creature you've been watching since the top of this page.",
    },
    needs: {
      es: "Planos o fotos, y para qué lo vas a usar: venta, validación o producción.",
      en: "Drawings or photos, and what it's for: selling, validating or producing.",
    },
  },
];

export const DIAGNOSIS = {
  eyebrow: { es: "Qué te pasa", en: "What's going on" } satisfies Localized,
  title: {
    es: "Marca lo que reconozcas",
    en: "Tick whatever sounds familiar",
  } satisfies Localized,
  subtitle: {
    es: "Esta no es la lista de lo que vendemos: es la lista de frases con las que nos llaman. Marca las que se parezcan a tu semana y debajo aparece qué haríamos primero.",
    en: "This isn't a list of what we sell: it's the list of sentences people call us with. Tick the ones that sound like your week and what we'd do first appears below.",
  } satisfies Localized,
  empty: {
    es: "Sin nada marcado no hay nada que decir. Si ninguna de estas frases se parece a tu semana, probablemente todavía no nos necesitas — y preferimos decírtelo aquí que en una reunión.",
    en: "With nothing ticked there's nothing to say. If none of these sound like your week you probably don't need us yet — and we'd rather tell you here than in a meeting.",
  } satisfies Localized,
  movesTitle: { es: "Lo que haríamos primero", en: "What we'd do first" } satisfies Localized,
  needsTitle: { es: "Lo que hace falta de tu lado", en: "What we'd need from you" } satisfies Localized,
  fieldsTitle: { es: "Dónde cae el trabajo", en: "Where the work lands" } satisfies Localized,
  cta: { es: "Llevar esto al formulario", en: "Take this to the form" } satisfies Localized,
  taken: { es: "Copiado abajo", en: "Copied below" } satisfies Localized,
  count: {
    es: "marcado · marcados",
    en: "ticked · ticked",
  } satisfies Localized,
};

/* ------------------------------------------------------------------ */
/* La cuenta de horas                                                  */
/* ------------------------------------------------------------------ */

/*
 * Aquí estaban los cuatro pasos.
 *
 * Diagnóstico, propuesta, construcción, entrega — numerados 01 a 04, con su
 * duración debajo y encendiéndose al bajar. Es el otro bloque que llevan
 * todas: cambia los verbos y sirve para una agencia, una constructora o un
 * dentista. Y lo que cuenta es cómo trabajamos NOSOTROS, que es lo que menos
 * le importa a alguien que todavía no sabe si tiene un problema.
 *
 * En su lugar va la única cuenta que decide si merece la pena llamarnos, y se
 * hace en la página en vez de prometerla en una reunión. La aritmética está a
 * la vista para que se pueda discutir, y el veredicto dice "no" cuando el
 * número no da — que es lo que ninguna landing hace y lo que cualquier
 * ingeniero honesto diría.
 *
 * Los plazos de los cuatro pasos no se han perdido: viven ahora en
 * `COMMITMENTS`, escritos como condiciones y no como un viaje.
 */

/** Semanas trabajadas al año. Se enseña, no se esconde. */
export const WEEKS_PER_YEAR = 48;

/** Fronteras del veredicto, en horas al año. */
export const HOURS_LOW = 40;
export const HOURS_HIGH = 150;

export const HOURS = {
  eyebrow: { es: "La cuenta", en: "The count" } satisfies Localized,
  title: {
    es: "Cuánto cuesta hacerlo a mano",
    en: "What doing it by hand costs",
  } satisfies Localized,
  subtitle: {
    es: "Rellena la fila con algo que hoy se haga a mano. La aritmética se ve entera y el veredicto sale solo. Si el número no da, lo dice.",
    en: "Fill the row with something done by hand today. The arithmetic stays visible and the verdict comes out on its own. If the number doesn't clear the bar, it says so.",
  } satisfies Localized,
  task: { es: "La tarea", en: "The task" } satisfies Localized,
  taskPlaceholder: {
    es: "Ej.: pasar los pedidos del correo a la hoja",
    en: "e.g. copying orders from email into the sheet",
  } satisfies Localized,
  perWeek: { es: "Veces por semana", en: "Times per week" } satisfies Localized,
  minutes: { es: "Minutos cada vez", en: "Minutes each time" } satisfies Localized,
  people: { es: "Personas que intervienen", en: "People involved" } satisfies Localized,
  rate: { es: "Coste por hora (opcional)", en: "Cost per hour (optional)" } satisfies Localized,
  assumption: {
    es: `Sobre ${WEEKS_PER_YEAR} semanas trabajadas al año. Si tu operación para en agosto, baja el número.`,
    en: `Based on ${WEEKS_PER_YEAR} working weeks a year. If your operation stops in August, lower it.`,
  } satisfies Localized,
  resultLabel: { es: "Al año", en: "Per year" } satisfies Localized,
  costLabel: { es: "En salario", en: "In wages" } satisfies Localized,
  verdictLabel: { es: "Veredicto", en: "Verdict" } satisfies Localized,
  cta: { es: "Llevar la cuenta al formulario", en: "Take the count to the form" } satisfies Localized,
  taken: { es: "Copiada abajo", en: "Copied below" } satisfies Localized,
  verdicts: {
    low: {
      title: { es: "No lo automatices", en: "Don't automate it" } satisfies Localized,
      body: {
        es: `Menos de ${HOURS_LOW} horas al año. Un proyecto para esto cuesta más de lo que ahorra, y quien te diga lo contrario te está vendiendo algo. Vuelve cuando crezca.`,
        en: `Under ${HOURS_LOW} hours a year. A project for this costs more than it saves, and anyone who tells you otherwise is selling something. Come back when it grows.`,
      } satisfies Localized,
    },
    edge: {
      title: { es: "Está en la frontera", en: "It's borderline" } satisfies Localized,
      body: {
        es: `Entre ${HOURS_LOW} y ${HOURS_HIGH} horas al año. Sale a cuenta si además te está costando errores, o si quien lo hace es justo la persona que menos debería estar haciéndolo. Si solo son las horas, espera.`,
        en: `Between ${HOURS_LOW} and ${HOURS_HIGH} hours a year. Worth it if it's also costing you errors, or if the person doing it is exactly the person who shouldn't be. If it's only the hours, wait.`,
      } satisfies Localized,
    },
    high: {
      title: { es: "Aquí sí", en: "This one, yes" } satisfies Localized,
      body: {
        es: `Más de ${HOURS_HIGH} horas al año: casi un mes de trabajo de una persona, todos los años. Algo de este tamaño cierra alcance y precio en 3–5 días y se construye en 4–10 semanas.`,
        en: `Over ${HOURS_HIGH} hours a year: nearly a full month of one person's time, every year. Something this size gets scope and price locked in 3–5 days and built in 4–10 weeks.`,
      } satisfies Localized,
    },
  },
};

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
};

/* ------------------------------------------------------------------ */
/* Condiciones                                                         */
/* ------------------------------------------------------------------ */

/*
 * Esto es lo que queda de los cuatro pasos, y de las tres virtudes que había
 * en `ABOUT.values`.
 *
 * Las virtudes se fueron enteras: "medimos antes de opinar", "entregamos
 * funcionando", "tu tiempo es el KPI". Ninguna empresa afirma lo contrario,
 * así que no distinguen; y las tres decían, con otras palabras, lo que la
 * página ya demuestra teniendo una calculadora que responde "no".
 *
 * Los plazos, en cambio, eran información real y se quedan. Cambia el género:
 * de recorrido ilustrado a condiciones. Un plazo escrito como condición se
 * puede reclamar; escrito como paso de un viaje, no.
 */
export const COMMITMENTS = {
  title: {
    es: "En qué condiciones",
    en: "On what terms",
  } satisfies Localized,
  items: [
    {
      term: { es: "Diagnóstico primero", en: "Diagnosis first" } satisfies Localized,
      spec: { es: "1–2 semanas", en: "1–2 weeks" } satisfies Localized,
      body: {
        es: "Medimos tu proceso real antes de proponer nada. Si al final no hay proyecto, la medición se queda contigo igual.",
        en: "We measure your real process before proposing anything. If no project comes out of it, the measurement is yours anyway.",
      } satisfies Localized,
    },
    {
      term: { es: "Precio cerrado", en: "Fixed price" } satisfies Localized,
      spec: { es: "3–5 días", en: "3–5 days" } satisfies Localized,
      body: {
        es: "Alcance, entregables, plazo y precio por escrito antes de construir. Lo que no se pueda prometer se dice ahí, no después.",
        en: "Scope, deliverables, timeline and price in writing before we build. Whatever can't be promised is said there, not later.",
      } satisfies Localized,
    },
    {
      term: { es: "Entrega cada semana", en: "Weekly delivery" } satisfies Localized,
      spec: { es: "4–10 semanas", en: "4–10 weeks" } satisfies Localized,
      body: {
        es: "Cada semana hay algo que se puede abrir. Corregir el rumbo en la semana 3 cuesta una semana; en la 9, cuesta el proyecto.",
        en: "Every week there's something you can open. Changing course in week 3 costs a week; in week 9 it costs the project.",
      } satisfies Localized,
    },
    {
      term: { es: "Acompañamiento", en: "Support" } satisfies Localized,
      spec: { es: "30 días", en: "30 days" } satisfies Localized,
      body: {
        es: "Después de entregar seguimos disponibles mientras el proceso se estabiliza. Sin contrato nuevo.",
        en: "After handover we stay available while the process settles. No new contract.",
      } satisfies Localized,
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
