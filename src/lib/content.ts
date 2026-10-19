/**
 * Contenido del sitio de BOUW — Automation & Digital Solutions.
 * Todo el copy vive aquí para poder editarlo sin tocar componentes.
 * Cada campo tiene versión `es` y `en`.
 */

export type Lang = "es" | "en";

export type Localized = Record<Lang, string>;

/**
 * Un archivo que puede cambiar con el idioma.
 *
 * Los videos con rótulos dentro de la imagen salen en dos versiones; los que
 * no, en una sola. El componente no tiene que saber cuál es cuál.
 */
export type Asset = string | Localized;

export const pickAsset = (a: Asset, lang: Lang) =>
  typeof a === "string" ? a : a[lang];

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
  /*
   * Identidad legal: va en el pie y en el aviso de privacidad (la Ley de
   * Protección de Datos pide identificar al responsable). Vacíos hasta tener
   * los datos del RUC; mientras estén vacíos, no se muestra la línea.
   */
  legalName: "",
  ruc: "",
};

/* ------------------------------------------------------------------ */
/* Navegación                                                          */
/* ------------------------------------------------------------------ */

/*
 * Los anclas no cambian —hay enlaces sueltos por ahí— pero los rótulos sí:
 * dos de estas secciones ya no son un catálogo ni un método, son cosas que
 * el visitante puede usar, y el menú tiene que prometerlo.
 */
/*
 * Nombres que entiende quien viene a contratar.
 *
 * "Diagnóstico" y "La cuenta" son los nombres de las herramientas, y tienen
 * sentido una vez dentro; en el menú, antes de entrar, no dicen qué hay. Un
 * cliente busca servicios y quiere saber si le sale a cuenta: eso es lo que
 * pone ahora. Las secciones conservan su nombre propio en el titular.
 */
export const NAV: { id: string; label: Localized }[] = [
  { id: "proyectos", label: { es: "Proyectos", en: "Work" } },
  { id: "servicios", label: { es: "Servicios", en: "Services" } },
  { id: "proceso", label: { es: "Calculadora", en: "Calculator" } },
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
    es: "Automatizamos procesos y convertimos ideas de ingeniería en productos que funcionan. Llevamos más de 7 años haciéndolo entre Ecuador y México.",
    en: "We automate processes and turn engineering ideas into products that work. We have been doing it for over 7 years across Ecuador and Mexico.",
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
    es: "Las dos sedes coinciden todos los días de 09:00 a 18:00, hora de Quito.",
    en: "Both offices overlap every day from 09:00 to 18:00, Quito time.",
  } satisfies Localized,
};

/* ------------------------------------------------------------------ */
/* Capítulos                                                           */
/* ------------------------------------------------------------------ */

/**
 * Las bandas entre secciones, que ahora son capítulos.
 *
 * Eran una cita pequeña en una esquina, y eso era lo que les quitaba fuerza:
 * la banda existe para que el dragón pase, y una frase de cuatro líneas a la
 * izquierda no se ve pasar nada. Ahora la primera frase va a toda la anchura
 * y el bicho la cruza por delante (ver `SceneBreak` y la capa de la escena en
 * `SceneRoot`). El resto queda debajo, pequeño.
 *
 * Cada una sigue haciendo un trabajo: anuncia lo que viene justo debajo con
 * un dato que se comprueba bajando dos dedos de pantalla.
 */
export const BREAKS: { mark: string; title: Localized; body: Localized }[] = [
  {
    mark: "01",
    title: { es: "Proyectos que ya funcionan.", en: "Projects already at work." },
    body: {
      es: "Dos los puedes abrir ahora mismo. Los demás funcionan dentro de la operación de nuestros clientes.",
      en: "You can open two of them right now. The rest run inside our clients' operations.",
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
  /**
   * Tono del proyecto, en grados OKLCH (0–360).
   *
   * Cada proyecto lleva su color, pero todos con la misma luz y la misma
   * intensidad: solo gira el tono (ver `.project` en `globals.css`). Matthew,
   * 10 oct 2026: no quiere que todos tengan los mismos colores, pero que
   * Charms saliera más vivo que los demás «se ve feo a la vista». Con L y C
   * fijos ninguno grita más que otro.
   */
  hue: number;
  /** Proporción de la captura o el video, para enmarcarlo sin recortarlo. */
  frame: string;
  /** La cifra que va al pie del panel (índice en `metrics`). */
  feature: number;
  /** Marca los proyectos donde el 3D es el diferenciador */
  has3D: boolean;
  /**
   * Cómo se presenta el panel de medios.
   * `screen` captura de interfaz, `photo` foto de producto (va sobre un
   * paspartú oscuro para que una imagen clara no rompa la paleta),
   * `drawing` gráfico técnico dibujado en SVG, `floor` material de planta:
   * el video vertical tal como se grabó y dos fotos al lado.
   */
  mediaKind: "screen" | "photo" | "drawing" | "floor";
  /** Texto del chip en la barra del panel */
  mediaChip: string;
  /** Imagen real en /public/proyectos, si existe */
  image?: string;
  imageAlt?: Localized;
  /** Cuando no hay imagen, se dibuja este gráfico técnico */
  visual?: "device" | "ledger" | "line";
  href?: string;
  /**
   * El sistema funcionando, para abrirlo desde el panel a pantalla completa
   * (ver `LiveSystem`). Solo los que se pueden usar de verdad.
   */
  live?: {
    url: string;
    label: string;
    hint?: Localized;
    /** Una simulación, no el sistema del cliente: cambian los rótulos. */
    kind?: "simulador";
  };
  /**
   * Video en bucle, mudo. Gana a `image` si están los dos: la imagen queda de
   * póster mientras carga y para quien pide menos movimiento.
   */
  video?: { src: Asset; poster: Asset };
  /** Las fotos que acompañan al video en el panel `floor`. */
  tiles?: { src: string; alt: Localized; label: Localized }[];
  /**
   * Se presenta dentro de un aparato dibujado (`Devices`) en vez de la
   * ventana: en el portátil, pantallas en bucle o el video con el rótulo de
   * cada paso; al lado, si hay, el teléfono con las suyas.
   */
  device?: {
    /** Proporción de la pantalla del portátil (ancho / alto). */
    ratio: number;
    slides?: { src: string; alt: Localized; label?: Localized }[];
    video?: {
      src: string;
      poster: string;
      /** Segundo en que entra cada paso del recorrido, su nombre y la frase. */
      cues: { at: number; step: Localized; text: Localized }[];
    };
    phone?: { src: string; alt: Localized }[];
  };
  /** Si el proyecto tiene caso completo, la ruta (y el ancla) donde vive. */
  caseHref?: string;
  /** Rótulo del botón cuando el caso no es suyo sino uno que lo contiene. */
  caseLabel?: Localized;
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
      es: "En línea y en producción en anatris.vercel.app, con recorrido guiado y aviso legal antes de usarse.",
      en: "Live in production at anatris.vercel.app, with a guided tour and a legal disclaimer before use.",
    },
    tags: ["React", "Three.js", "WebGL", "Supabase", "PWA"],
    metrics: [
      { value: "6", label: { es: "Regiones clínicas", en: "Clinical regions" } },
      { value: "113", label: { es: "Músculos con ficha", en: "Muscles documented" } },
      { value: "79", label: { es: "Tests con sens/spec", en: "Tests with sens/spec" } },
    ],
    hue: 225,
    frame: "9 / 5",
    feature: 1,
    has3D: true,
    mediaKind: "screen",
    mediaChip: "anatris.vercel.app",
    /*
     * El modelo 3D con el deltoides elegido y su ficha clínica al lado, en
     * vez de la portada: «quiero que ya se vea el cuerpo, así llama más la
     * atención» (Matthew, 18 oct 2026). Capturado de la app en producción.
     */
    image: "/proyectos/anatris-cuerpo.webp",
    imageAlt: {
      es: "Anatris: el hombro en 3D con el deltoides marcado y su origen e inserción en la ficha clínica",
      en: "Anatris: the shoulder in 3D with the deltoid highlighted and its origin and insertion in the clinical panel",
    },
    /*
     * Cuatro pantallas de la app en bucle, en el portátil: «mejora lo de
     * Anatris, que vayan algunas imágenes en bucle» (Matthew, 18 oct 2026).
     * Capturadas de la app en producción.
     */
    device: {
      ratio: 16 / 9,
      slides: [
        {
          src: "/proyectos/anatris-movimiento.webp",
          alt: {
            es: "Anatris en modo Movimiento: el cuerpo entero en 3D y el análisis de la abducción del hombro con el pectoral mayor como músculo protagonista",
            en: "Anatris in Movement mode: the full 3D body and the shoulder abduction analysis with the pectoralis major as the main muscle",
          },
          label: { es: "Movimiento · abducción", en: "Movement · abduction" },
        },
        {
          src: "/proyectos/anatris-deltoides.webp",
          alt: {
            es: "Anatris: el hombro en 3D con el deltoides marcado y su ficha clínica",
            en: "Anatris: the shoulder in 3D with the deltoid highlighted and its clinical panel",
          },
          label: { es: "Explorar · deltoides", en: "Explore · deltoid" },
        },
        {
          src: "/proyectos/anatris-pectoral.webp",
          alt: {
            es: "Anatris: el pectoral mayor marcado en el modelo, con su origen e inserción",
            en: "Anatris: the pectoralis major highlighted on the model, with its origin and insertion",
          },
          label: { es: "Explorar · pectoral mayor", en: "Explore · pectoralis major" },
        },
        {
          src: "/proyectos/anatris-aprender.webp",
          alt: {
            es: "Anatris en modo Aprender: origen, inserción e inervación de cada músculo del hombro, con sus fuentes",
            en: "Anatris in Learn mode: origin, insertion and innervation of each shoulder muscle, with sources",
          },
          label: { es: "Aprender · anatomía", en: "Learn · anatomy" },
        },
      ],
    },
    /*
     * `anatris.app` no resuelve en DNS (comprobado el 3 oct 2026 con 8.8.8.8):
     * el enlace estaba roto. La aplicación responde en Vercel; se enlaza ahí
     * hasta que el dominio exista.
     */
    href: "https://anatris.vercel.app",
    live: {
      url: "https://anatris.vercel.app",
      label: "anatris.vercel.app",
      hint: {
        es: "Es Anatris funcionando ahora mismo: gira el cuerpo, elige una región y abre un músculo.",
        en: "This is Anatris running right now: rotate the body, pick a region and open a muscle.",
      },
    },
  },
  {
    slug: "mejora-continua",
    index: "02",
    /*
     * Texto de Matthew (4 oct 2026), pasado a la voz de la página: «iniciativas
     * de mejora continua en piso, coordinando con producción y calidad en dos
     * turnos…». Cifras, las suyas: 15 % y 20 %, 4 operadores. Sin año hasta
     * que lo confirme.
     */
    year: "",
    title: {
      es: "Mejora continua en planta",
      en: "Continuous improvement on the floor",
    },
    client: {
      es: "Línea de producción · Dos turnos",
      en: "Production line · Two shifts",
    },
    category: {
      es: "Calidad · Lean Six Sigma",
      en: "Quality · Lean Six Sigma",
    },
    summary: {
      es: "Una línea de producción con menos tiempo perdido y menos desperdicio, para que el producto salga bien a la primera.",
      en: "A production line with less lost time and less waste, so the product comes out right the first time.",
    },
    description: {
      es: "Coordinamos con producción y calidad iniciativas de mejora continua en piso, en dos turnos. Mapeamos el estado actual con Value Stream Mapping (VSM), estandarizamos procedimientos y reorganizamos las estaciones de trabajo con 5S. Dimos seguimiento a los KPI, documentamos desviaciones, impulsamos acciones correctivas y capacitamos a cuatro operadores para que los cambios se adoptaran y se sostuvieran.",
      en: "Together with production and quality we ran continuous improvement on the floor, across two shifts. We mapped the current state with Value Stream Mapping (VSM), standardized procedures and reorganized workstations with 5S. We tracked KPIs, documented deviations, drove corrective actions and trained four operators so the changes were adopted and kept.",
    },
    outcome: {
      es: "15 % menos tiempo de preparación y 20 % menos reprocesos, con métodos Lean Six Sigma.",
      en: "15% less setup time and 20% less rework, using Lean Six Sigma methods.",
    },
    tags: ["Lean Six Sigma", "VSM", "5S", "KPI", "Acciones correctivas"],
    metrics: [
      { value: "−15 %", label: { es: "Tiempo de preparación", en: "Setup time" } },
      { value: "−20 %", label: { es: "Reprocesos", en: "Rework" } },
      { value: "4", label: { es: "Operadores capacitados", en: "Operators trained" } },
    ],
    hue: 62,
    // Más ancho que 4:3: la línea del caso necesita largo (ver `LinePeek`)
    frame: "16 / 11",
    feature: 1,
    has3D: false,
    /*
     * El dibujo del VSM pasa a la página del caso, en la fase de medir. Aquí
     * va la planta de verdad: el recorrido grabado y dos fotos del trabajo.
     */
    mediaKind: "floor",
    mediaChip: "planta · 2 turnos",
    visual: "line",
    video: {
      src: "/proyectos/mejora/planta.mp4",
      poster: "/proyectos/mejora/planta-poster.webp",
    },
    tiles: [
      {
        src: "/proyectos/mejora/termometro.webp",
        alt: {
          es: "Pirómetro midiendo la temperatura del agua en la tina de enfriamiento",
          en: "Infrared thermometer reading the cooling tank water temperature",
        },
        label: { es: "Medición", en: "Measure" },
      },
      {
        src: "/proyectos/mejora/perfil-estudio.webp",
        alt: {
          es: "Perfil negro sobre fondo azul marino con retícula técnica",
          en: "Black profile on a navy background with a technical grid",
        },
        label: { es: "Producto", en: "Product" },
      },
    ],
    /*
     * La ficha enseña el caso en pequeño (`LinePeek`) y lleva al caso, que
     * tiene la simulación completa. `/demo/linea` sigue existiendo.
     */
    caseHref: "/proyectos/mejora-continua",
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
      en: "Eleven sheets wired together with macros: customers, products, components, kits with their bill of materials, sales, purchases and expenses, advance payments and a dashboard that recalculates itself. The team kept working in the tool they already knew, with no migration and no new licenses.",
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
    hue: 150,
    frame: "4 / 3",
    feature: 0,
    has3D: false,
    /*
     * El archivo funcionando: un recorrido grabado cuadro a cuadro sobre una
     * réplica de sus hojas, con datos de demostración. Los números, nombres y
     * RUC del cliente se quedan con el cliente.
     */
    mediaKind: "screen",
    mediaChip: "Programa_contable.xlsm",
    visual: "ledger",
    video: {
      src: {
        es: "/proyectos/contable/excel-es.mp4",
        en: "/proyectos/contable/excel-en.mp4",
      },
      poster: {
        es: "/proyectos/contable/excel-es-poster.webp",
        en: "/proyectos/contable/excel-en-poster.webp",
      },
    },
    /*
     * La réplica del archivo, usable: registrar una venta descuenta el stock
     * del kit y mueve el tablero (`components/contable`). Matthew, 4 oct
     * 2026: «Video + réplica».
     */
    live: {
      url: "/demo/programa-contable",
      label: "Programa_contable.xlsm",
      hint: {
        es: "Es una réplica del archivo con datos de demostración: registra una venta y mira cómo se mueven el inventario y el tablero.",
        en: "A replica of the file with demo data: record a sale and watch the inventory and the dashboard move.",
      },
    },
    /*
     * En la ficha, el mismo recorrido recortado a la hoja de Excel, en el
     * portátil, con el rótulo de cada paso encima (los mismos del video
     * entero, que sigue en el caso): «con el fondo verde el contraste está
     * feo» (Matthew, 18 oct 2026).
     */
    device: {
      ratio: 1200 / 780,
      video: {
        src: "/proyectos/contable/excel-pantalla.mp4",
        poster: "/proyectos/contable/excel-pantalla-poster.webp",
        cues: [
          {
            at: 0,
            step: { es: "Menú", en: "Menu" },
            text: { es: "Un solo archivo de Excel: once hojas conectadas por macros.", en: "One Excel file: eleven sheets wired together with macros." },
          },
          {
            at: 3.2,
            step: { es: "Ventas · XML SRI", en: "Sales · SRI XML" },
            text: {
              es: "Las facturas electrónicas del SRI entran solas: cliente, unidad de negocio y totales, sin volver a teclear.",
              en: "SRI e-invoices come in on their own: customer, business unit and totals, nothing retyped.",
            },
          },
          {
            at: 11.2,
            step: { es: "Kits y stock", en: "Kits & stock" },
            text: {
              es: "Cada kit se costea desde su despiece. Al venderlo, el stock de cada pieza baja solo y avisa antes de quedarse corto.",
              en: "Each kit is costed from its bill of materials. When it sells, every component's stock drops and warns before running short.",
            },
          },
          {
            at: 19.2,
            step: { es: "Dashboard", en: "Dashboard" },
            text: {
              es: "El tablero se recalcula con cada movimiento: ingresos, gastos, cartera y margen por unidad de negocio.",
              en: "The dashboard recalculates with every entry: income, expenses, receivables and margin by business unit.",
            },
          },
          {
            at: 28.2,
            step: { es: "Cierre de mes", en: "Month-end close" },
            text: {
              es: "El cierre ya no se arma a mano: sale de lo que ya está capturado.",
              en: "Month-end close is no longer assembled by hand: it comes out of what's already captured.",
            },
          },
        ],
      },
    },
    caseHref: "/proyectos/mejora-continua#oficina",
    caseLabel: {
      es: "Verlo dentro del caso de mejora continua",
      en: "See it inside the continuous improvement case",
    },
  },
  {
    slug: "charms",
    index: "04",
    year: "2026",
    title: { es: "Charms Ecuador", en: "Charms Ecuador" },
    client: {
      es: "Taller de regalos en porcelana fría",
      en: "Cold porcelain gift workshop",
    },
    category: {
      es: "Web · Pedidos por WhatsApp",
      en: "Web · Orders over WhatsApp",
    },
    summary: {
      es: "Una web que recibe el pedido completo y lo lleva a WhatsApp ya escrito, que es como el taller cierra sus ventas.",
      en: "A website that takes the full order and hands it to WhatsApp already written, which is how the workshop closes sales.",
    },
    description: {
      es: "Catálogo con filtros y fotos reales de las piezas, un cotizador en cuatro pasos que calcula el precio mientras se elige, una página para regalos de empresa y un muñeco en 3D que se configura y se gira con el dedo. Sin servidor ni base de datos: no cuesta nada mantenerla en línea.",
      en: "A catalog with filters and real photos of the pieces, a four-step quote tool that prices the order as you choose, a corporate gifts page and a 3D figure you configure and spin with a finger. No server and no database: it costs nothing to keep online.",
    },
    outcome: {
      es: "El cliente llega a WhatsApp con la pieza, los detalles y el precio estimado ya escritos.",
      en: "Customers reach WhatsApp with the piece, the details and the estimated price already written.",
    },
    tags: ["React", "Three.js", "Tailwind", "WhatsApp", "Vercel"],
    metrics: [
      { value: "15", label: { es: "Modelos con foto real", en: "Models with real photos" } },
      { value: "4", label: { es: "Pasos del cotizador", en: "Quote steps" } },
      { value: "$0", label: { es: "Costo de hosting", en: "Hosting cost" } },
    ],
    hue: 350,
    frame: "1200 / 750",
    feature: 1,
    has3D: true,
    mediaKind: "screen",
    mediaChip: "charms-ecuador.vercel.app",
    image: "/proyectos/charms.webp",
    imageAlt: {
      es: "Portada de la web de Charms Ecuador con un cuadro de porcelana fría",
      en: "Charms Ecuador home page showing a cold porcelain frame",
    },
    href: "https://charms-ecuador.vercel.app",
    /*
     * La web en el portátil y, al lado, el teléfono pasando por el inicio,
     * el catálogo, una pieza y el cotizador: casi todos los pedidos llegan
     * desde el teléfono. «Igual Charms» (Matthew, 18 oct 2026). Capturado
     * de la web en producción.
     */
    device: {
      ratio: 1200 / 750,
      slides: [
        {
          src: "/proyectos/charms.webp",
          alt: {
            es: "Inicio de Charms Ecuador en el escritorio, con un cuadro en porcelana fría",
            en: "Charms Ecuador home page on desktop, showing a cold porcelain frame",
          },
        },
      ],
      phone: [
        { src: "/proyectos/charms-movil-inicio.webp", alt: { es: "Charms en el teléfono: inicio", en: "Charms on a phone: home" } },
        { src: "/proyectos/charms-movil-catalogo.webp", alt: { es: "Charms en el teléfono: catálogo con precio desde", en: "Charms on a phone: catalog with starting prices" } },
        { src: "/proyectos/charms-movil-producto.webp", alt: { es: "Charms en el teléfono: ficha del cuadro columpio", en: "Charms on a phone: swing frame product page" } },
        { src: "/proyectos/charms-movil-cotizar.webp", alt: { es: "Charms en el teléfono: el cotizador con la figura de muestra", en: "Charms on a phone: the quote builder with the sample figure" } },
      ],
    },
    live: {
      url: "https://charms-ecuador.vercel.app",
      label: "charms-ecuador.vercel.app",
      hint: {
        es: "Es la web de Charms funcionando: abre el catálogo o arma una cotización y mira el mensaje que se envía.",
        en: "This is the Charms site running: open the catalog or build a quote and see the message it sends.",
      },
    },
  },
];

/* ------------------------------------------------------------------ */
/* Servicios dentro de la lista                                        */
/* ------------------------------------------------------------------ */

/*
 * Matthew, 13 oct 2026: donde estaba «Dispositivo médico» va el servicio de
 * cumplimiento normativo y BPM, y en el lugar de «Mejora continua» el de
 * Lean, layout y procesos. Los textos de titular, problemas, entregables y
 * llamada son los suyos, en minúscula de frase; lo demás está escrito para
 * que se entienda qué cambia en la planta.
 *
 * Van en la misma lista que los proyectos y con el mismo chasis (escenario,
 * ventana, pie), cada uno con su tono. Las cifras de Lean son las del caso;
 * el simulacro de auditoría es una autoevaluación y lo dice.
 */

export type ServiceIcon =
  | "audit"
  | "trace"
  | "repeat"
  | "hold"
  | "search"
  | "files"
  | "capa"
  | "training"
  | "route"
  | "timer"
  | "stock"
  | "variance"
  | "calendar"
  | "arrow";

export type Pain = {
  icon: ServiceIcon;
  problem: Localized;
  solution: Localized;
  /** Cómo se ve la solución en la planta, en una frase. */
  how: Localized;
};

export type Service = {
  id: "lean" | "cumplimiento";
  /** También es el sufijo de las perchas del dragón. */
  slug: string;
  index: string;
  hue: number;
  badge: Localized;
  title: Localized;
  subtitle: Localized;
  pains: Pain[];
  /**
   * Las palabras con que el cliente busca el servicio, en grande junto al
   * titular (Matthew, 18 oct 2026: «el chiste es vender directo con las
   * palabras que ellos busquen, porque no van a leer todo»). Solo términos
   * que ya nombra la ficha: nada que el servicio no haga. Las tres primeras
   * van más grandes.
   */
  keywords: { es: string[]; en: string[] };
  /**
   * La planta antes y después, en video: una ilustración isométrica que un
   * barrido verde pasa del estado de hoy al ordenado (Matthew, 13 oct 2026:
   * «algo así, que se vea pro, que ya hemos trabajado con empresas»).
   */
  film: {
    /** Uno por idioma si el video lleva rótulos (ver `bouw-medios/remotion`). */
    src: Asset;
    poster: Asset;
    label: Localized;
    before: Localized;
    after: Localized;
  };
  cta: {
    label: Localized;
    note: Localized;
    icon: ServiceIcon;
    /** La línea que llega al formulario de contacto al pulsarla. */
    brief: Localized;
  };
};

export const LEAN: Service & {
  /** El proyecto del que salen la planta, el producto y el caso. */
  from: string;
  highlight: { title: Localized; body: Localized; action: Localized };
  stats: { value: string; label: Localized }[];
} = {
  id: "lean",
  slug: "lean",
  index: "02",
  hue: 62,
  from: "mejora-continua",
  badge: {
    es: "Lean manufacturing & ingeniería de planta",
    en: "Lean manufacturing & plant engineering",
  },
  title: {
    es: "Elimina cuellos de botella y maximiza cada metro cuadrado de tu planta",
    en: "Remove bottlenecks and get the most out of every square meter of your plant",
  },
  subtitle: {
    es: "Convertimos operaciones lentas y congestionadas en flujos de producción esbeltos, ágiles y altamente rentables.",
    en: "We turn slow, congested operations into lean, agile and highly profitable production flows.",
  },
  keywords: {
    es: ["Lean", "SMED", "VSM", "5S", "Layout de planta", "Cuellos de botella", "WIP", "Trabajo estándar", "Nivelación de flujo"],
    en: ["Lean", "SMED", "VSM", "5S", "Plant layout", "Bottlenecks", "WIP", "Standard work", "Flow leveling"],
  },
  pains: [
    {
      icon: "route",
      problem: { es: "Recorridos kilométricos y desorden", en: "Endless walking and clutter" },
      solution: {
        es: "Rediseño de layout y estaciones de trabajo optimizadas",
        en: "Layout redesign and optimized workstations",
      },
      how: {
        es: "Medimos cuánto camina cada pieza y cada operador, y acercamos lo que se usa junto.",
        en: "We measure how far every part and every operator travels, and bring together what is used together.",
      },
    },
    {
      icon: "timer",
      problem: { es: "Setups y cambios de formato lentos", en: "Slow setups and changeovers" },
      solution: {
        es: "Metodología SMED para liberar la maquinaria rápido",
        en: "SMED to free up machines quickly",
      },
      how: {
        es: "Separamos lo que se puede preparar con la máquina en marcha de lo que obliga a pararla, y acortamos lo segundo.",
        en: "We split what can be prepared while the machine runs from what forces it to stop, and shorten the latter.",
      },
    },
    {
      icon: "stock",
      problem: {
        es: "Acumulación de inventario en proceso (WIP)",
        en: "Work in process (WIP) piling up",
      },
      solution: {
        es: "Mapeo de cadena de valor (VSM) y nivelación de flujo",
        en: "Value stream mapping (VSM) and flow leveling",
      },
      how: {
        es: "El mapa enseña dónde se apilan las piezas y por qué. Después se ajusta el ritmo de cada estación al de la línea.",
        en: "The map shows where parts pile up and why. Then each station's pace is matched to the line's.",
      },
    },
    {
      icon: "variance",
      problem: { es: "Alta variabilidad operativa", en: "High operational variability" },
      solution: {
        es: "Estandarización de procesos, 5S y capacitación en piso",
        en: "Standard work, 5S and training on the floor",
      },
      how: {
        es: "Un mismo método en todos los turnos, cada estación en orden y la gente entrenada en su puesto.",
        en: "One method across every shift, every station in order and people trained at their own post.",
      },
    },
  ],
  /*
   * Hecho con Remotion (14 oct 2026): las dos ilustraciones isométricas con
   * lo que frena señalado, el barrido a la planta ordenada y los resultados
   * del caso. Rótulos en cada idioma.
   */
  film: {
    src: { es: "/servicios/lean-es.mp4", en: "/servicios/lean-en.mp4" },
    poster: { es: "/servicios/lean-es-poster.webp", en: "/servicios/lean-en-poster.webp" },
    label: {
      es: "Planta en corte isométrico: del piso congestionado a una línea Lean ordenada, con lo que frena y los resultados señalados",
      en: "Isometric plant cutaway: from a congested floor to an organized Lean line, with the bottlenecks and the results pointed out",
    },
    before: {
      es: "Recorridos que se cruzan, piezas apiladas en los pasillos y una máquina que frena a todas.",
      en: "Paths that cross, parts piled in the aisles and one machine holding everyone back.",
    },
    after: {
      es: "Un solo flujo, cada cosa en su sitio y el mapa de valor con su tablero vigilando la línea.",
      en: "One flow, everything in its place and the value stream map with its dashboard watching the line.",
    },
  },
  highlight: {
    title: {
      es: "Simulación de flujos & visión analítica",
      en: "Flow simulation & analytics",
    },
    body: {
      es: "Con los datos de tu operación armamos un modelo de la línea y probamos ahí cada cambio de layout o de proceso. Sabes cuánto mejora el flujo antes de mover un solo equipo, sin parar la producción para hacer pruebas.",
      en: "We build a model of your line from your operating data and try every layout or process change there first. You know how much the flow improves before a single machine moves, without stopping production to test.",
    },
    action: { es: "Probar la simulación", en: "Try the simulation" },
  },
  stats: [
    { value: "−15 %", label: { es: "Tiempo de preparación", en: "Setup time" } },
    { value: "−20 %", label: { es: "Reprocesos", en: "Rework" } },
    {
      value: "4",
      label: {
        es: "Operadores capacitados, con estándar y control en piso",
        en: "Operators trained, with standard work and control on the floor",
      },
    },
  ],
  cta: {
    label: { es: "Optimiza tu línea de producción", en: "Optimize your production line" },
    note: {
      es: "Agenda una evaluación técnica de tus procesos",
      en: "Book a technical assessment of your processes",
    },
    icon: "arrow",
    brief: {
      es: "Quiero una evaluación técnica de mi línea de producción (layout, setups, inventario en proceso).",
      en: "I'd like a technical assessment of my production line (layout, setups, work in process).",
    },
  },
};

export const COMPLIANCE: Service & {
  deliverables: { icon: ServiceIcon; title: Localized; body: Localized }[];
  /**
   * El informe de auditoría de una planta de ejemplo (`AuditBoard`), hoy y
   * con Bouw: hallazgos por gravedad, preparación, CAPA, lotes retenidos y la
   * trazabilidad de un lote. Antes era un simulacro en el que el visitante
   * marcaba casillas; «lo de marcar no me gusta» (Matthew, 18 oct 2026). Los
   * pesos y la gravedad son nuestros, no de una norma, y la planta es de
   * ejemplo: el tablero lo dice.
   */
  audit: {
    intro: Localized;
    score: Localized;
    levels: { low: Localized; mid: Localized; high: Localized };
    /** Lo que la planta de ejemplo ya cumple hoy. */
    start: string[];
    /** Las cifras del tablero de calidad de la planta de ejemplo, hoy y con Bouw. */
    sample: {
      capaOpen: [number, number];
      capaClosed: [number, number];
      held: [number, number];
    };
    items: {
      id: string;
      short: Localized;
      long: Localized;
      /** Lo que encontraría un inspector si falta. */
      finding: Localized;
      weight: number;
      /**
       * Cómo lo clasificaría un inspector si falta: crítico, mayor o menor,
       * como se clasifican los hallazgos de una inspección de BPM. La
       * clasificación de cada punto es nuestra, igual que los pesos.
       */
      severity: "critical" | "major" | "minor";
    }[];
  };
} = {
  id: "cumplimiento",
  slug: "cumplimiento",
  index: "05",
  hue: 290,
  badge: { es: "Cumplimiento normativo & BPM", en: "Regulatory compliance & GMP" },
  title: {
    es: "Pasa cualquier auditoría a la primera y elimina el riesgo operativo en tu planta",
    en: "Pass any audit the first time and remove operational risk from your plant",
  },
  subtitle: {
    es: "Transformamos la documentación dispersa en un sistema de calidad sólido, trazable y 100 % preparado para inspecciones de autoridades o clientes.",
    en: "We turn scattered paperwork into a solid, traceable quality system, 100% ready for inspections by authorities or customers.",
  },
  keywords: {
    es: ["BPM", "ISO", "CAPA", "Trazabilidad", "Batch records", "8D", "Causa raíz", "Auditorías internas", "Gap analysis", "Integridad de datos", "Liberación de lotes"],
    en: ["GMP", "ISO", "CAPA", "Traceability", "Batch records", "8D", "Root cause", "Internal audits", "Gap analysis", "Data integrity", "Lot release"],
  },
  pains: [
    {
      icon: "audit",
      problem: { es: "Incertidumbre en auditorías", en: "Uncertainty before audits" },
      solution: {
        es: "Expedientes estandarizados y carpetas de inspección listas 24/7",
        en: "Standardized records and inspection folders ready 24/7",
      },
      how: {
        es: "Cada registro tiene su sitio y su responsable. Si llega un inspector sin aviso, la carpeta ya está armada.",
        en: "Every record has its place and its owner. If an inspector shows up unannounced, the folder is already put together.",
      },
    },
    {
      icon: "trace",
      problem: { es: "Pérdida de trazabilidad", en: "Lost traceability" },
      solution: {
        es: "Control de lotes y genealogía de producción rastreable en minutos",
        en: "Lot control and production genealogy you can trace in minutes",
      },
      how: {
        es: "Desde un producto terminado llegas a sus materias primas, sus equipos y quién lo hizo, sin revolver archivos.",
        en: "From a finished product you reach its raw materials, its equipment and who made it, without digging through files.",
      },
    },
    {
      icon: "repeat",
      problem: { es: "Reincidencia de desviaciones", en: "Recurring deviations" },
      solution: {
        es: "Sistema CAPA estructurado con análisis de causa raíz (8D)",
        en: "A structured CAPA system with root cause analysis (8D)",
      },
      how: {
        es: "Cada desviación se cierra con su causa, su acción y la prueba de que funcionó, para que no vuelva el mes siguiente.",
        en: "Each deviation is closed with its cause, its action and proof that it worked, so it doesn't come back next month.",
      },
    },
    {
      icon: "hold",
      problem: { es: "Burocracia y lotes retenidos", en: "Red tape and lots on hold" },
      solution: {
        es: "Flujos documentales ágiles y liberación eficiente",
        en: "Lean document flows and efficient release",
      },
      how: {
        es: "Revisiones en paralelo y una sola firma por paso, para que ningún lote espere a que aparezca un papel.",
        en: "Reviews in parallel and one signature per step, so no lot waits for a missing piece of paper.",
      },
    },
  ],
  /*
   * Hecho con Remotion como el de Lean (18 oct 2026): las dos ilustraciones
   * animadas por Veo, lo que frena señalado, el barrido y lo que cambia.
   * Rótulos en cada idioma.
   */
  film: {
    src: { es: "/servicios/cumplimiento-es.mp4", en: "/servicios/cumplimiento-en.mp4" },
    poster: { es: "/servicios/cumplimiento-es-poster.webp", en: "/servicios/cumplimiento-en-poster.webp" },
    label: {
      es: "Área de calidad en corte isométrico: de papeles sueltos y un lote retenido a un sistema ordenado, con lo que frena y lo que cambia señalado",
      en: "Isometric quality area cutaway: from loose paperwork and a held lot to an organized system, with the bottlenecks and the changes pointed out",
    },
    before: {
      es: "Papeles sueltos, archivadores desbordados, la alarma encendida y un lote retenido.",
      en: "Loose paperwork, overflowing cabinets, the alarm on and a lot on hold.",
    },
    after: {
      es: "Expedientes en orden, la trazabilidad en pantalla, la lista en verde y el lote liberado.",
      en: "Records in order, traceability on screen, the checklist green and the lot released.",
    },
  },
  deliverables: [
    {
      icon: "search",
      title: { es: "Auditorías internas & gap analysis", en: "Internal audits & gap analysis" },
      body: {
        es: "Evaluación preventiva frente a BPM, ISO y normas sanitarias.",
        en: "A preventive assessment against GMP, ISO and health regulations.",
      },
    },
    {
      icon: "files",
      title: { es: "Estructuración de expedientes de lote", en: "Batch record structure" },
      body: {
        es: "Batch records estandarizados y trazabilidad integral.",
        en: "Standardized batch records and end-to-end traceability.",
      },
    },
    {
      icon: "capa",
      title: { es: "Gestión CAPA & control de desviaciones", en: "CAPA & deviation control" },
      body: {
        es: "Cierre definitivo de no conformidades mediante causa raíz.",
        en: "Nonconformities closed for good through root cause analysis.",
      },
    },
    {
      icon: "training",
      title: { es: "Capacitación en integridad de datos", en: "Data integrity training" },
      body: {
        es: "Entrenamiento práctico al personal operativo en buenas prácticas.",
        en: "Hands-on training in good practices for operating staff.",
      },
    },
  ],
  audit: {
    intro: {
      es: "Informe de auditoría BPM · planta de ejemplo",
      en: "GMP audit report · sample plant",
    },
    score: { es: "Preparación", en: "Readiness" },
    levels: {
      low: { es: "No lista", en: "Not ready" },
      mid: { es: "En riesgo", en: "At risk" },
      high: { es: "Lista para inspección", en: "Ready for inspection" },
    },
    start: ["registros", "personal"],
    sample: { capaOpen: [9, 0], capaClosed: [4, 13], held: [3, 0] },
    items: [
      {
        id: "trazabilidad",
        short: { es: "Trazabilidad", en: "Traceability" },
        long: {
          es: "Cada lote se rastrea hasta su materia prima en minutos",
          en: "Every lot traces back to its raw materials in minutes",
        },
        finding: {
          es: "Un lote que no se puede rastrear hasta su materia prima.",
          en: "A lot that can't be traced back to its raw materials.",
        },
        weight: 22,
        severity: "critical",
      },
      {
        id: "capa",
        short: { es: "CAPA", en: "CAPA" },
        long: {
          es: "Cada desviación se cierra con causa raíz y se verifica",
          en: "Every deviation is closed with a root cause and verified",
        },
        finding: {
          es: "La misma desviación abierta otra vez, sin causa raíz.",
          en: "The same deviation open again, with no root cause.",
        },
        weight: 20,
        severity: "major",
      },
      {
        id: "registros",
        short: { es: "Registros de lote", en: "Batch records" },
        long: {
          es: "Los registros de lote están completos y firmados",
          en: "Batch records are complete and signed",
        },
        finding: {
          es: "Registros de lote incompletos o sin firma.",
          en: "Batch records that are incomplete or unsigned.",
        },
        weight: 20,
        severity: "major",
      },
      {
        id: "digital",
        short: { es: "Expedientes digitales", en: "Digital records" },
        long: {
          es: "Los expedientes están en digital, con respaldo",
          en: "Records are digital, with a backup",
        },
        finding: {
          es: "Expedientes en papel que nadie encuentra a tiempo.",
          en: "Paper records nobody can find in time.",
        },
        weight: 13,
        severity: "minor",
      },
      {
        id: "personal",
        short: { es: "Integridad de datos", en: "Data integrity" },
        long: {
          es: "El personal está capacitado en integridad de datos",
          en: "Staff are trained in data integrity",
        },
        finding: {
          es: "Datos corregidos a mano, sin quién ni cuándo.",
          en: "Data corrected by hand, with no who or when.",
        },
        weight: 13,
        severity: "major",
      },
      {
        id: "liberacion",
        short: { es: "Liberación", en: "Release" },
        long: {
          es: "Los lotes se liberan sin esperar papeles",
          en: "Lots are released without waiting on paperwork",
        },
        finding: {
          es: "Lotes retenidos esperando una firma.",
          en: "Lots on hold waiting for a signature.",
        },
        weight: 12,
        severity: "minor",
      },
    ],
  },
  cta: {
    label: {
      es: "Agenda un diagnóstico de calidad gratis",
      en: "Book a free quality diagnosis",
    },
    note: {
      es: "Prepara tu planta antes de tu próxima inspección",
      en: "Get your plant ready before your next inspection",
    },
    icon: "calendar",
    brief: {
      es: "Quiero agendar el diagnóstico de calidad gratis (cumplimiento normativo y BPM).",
      en: "I'd like to book the free quality diagnosis (regulatory compliance and GMP).",
    },
  },
};

/**
 * El orden de la lista. Los proyectos por su `slug` en `PROJECTS`; los
 * servicios por su `id`.
 */
export const SHOWCASE: ({ project: string } | { service: Service["id"] })[] = [
  { project: "anatris" },
  { service: "lean" },
  { project: "programa-contable" },
  { project: "charms" },
  { service: "cumplimiento" },
];
/* ------------------------------------------------------------------ */
/* Casos completos                                                     */
/* ------------------------------------------------------------------ */

/*
 * La ficha de la lista cuenta un proyecto en diez segundos. El caso es para
 * quien quiere comprobarlo: la planta grabada, qué se midió, qué se cambió,
 * cuánto cambió y quién lo sostiene. Va ordenado por DMAIC porque así se
 * trabajó, y cada fase lleva lo que se hizo y la imagen que lo muestra.
 *
 * Las cifras son las del proyecto y ninguna más. Donde el gráfico necesita
 * una escala se usa un índice con el antes en 100, y se dice que es un índice.
 */

export type CasePhoto = {
  src: string;
  width: number;
  height: number;
  /** Encuadre dentro de la rejilla (`object-position`), si el centro no sirve. */
  position?: string;
  alt: Localized;
  caption: Localized;
};

export type CaseStudy = {
  slug: string;
  meta: { title: Localized; description: Localized };
  eyebrow: Localized;
  title: { lead: Localized; accent: Localized };
  lede: Localized;
  facts: { label: Localized; value: Localized }[];
  film: { src: string; poster: string; chip: string; caption: Localized };
  /** El caso en un párrafo. Lo que va entre `**` sale resaltado. */
  summary: { title: Localized; body: Localized };
  results: {
    value: number;
    sign: "−" | "";
    unit: string;
    label: Localized;
    detail: Localized;
    /** Barra de índice, antes = 100. Solo para las que son una reducción. */
    index?: boolean;
  }[];
  wastes: { name: Localized; body: Localized; tag: Localized }[];
  dmaic: {
    key: string;
    name: Localized;
    body: Localized;
    tools: Localized[];
    photo?: string;
    /** Un dibujo técnico de `ProjectVisual` en vez de foto. */
    drawing?: "line";
    /** Para la fase sin imagen: la ficha de lo que se acordó. */
    card?: { title: Localized; rows: [Localized, Localized][]; foot: Localized };
  }[];
  gallery: CasePhoto[];
  office: {
    eyebrow: Localized;
    title: Localized;
    body: Localized;
    points: Localized[];
    note: Localized;
    video: { src: Asset; poster: Asset };
    cta: Localized;
  };
  close: {
    title: Localized;
    body: Localized;
    primary: Localized;
    secondary: Localized;
  };
};

const PHOTOS = {
  linea: {
    src: "/proyectos/mejora/linea-extrusion.webp",
    width: 1080,
    height: 1800,
    alt: {
      es: "Línea de producción con tolvas azules y tableros de control en planta",
      en: "Production line with blue hoppers and control panels on the floor",
    },
    caption: { es: "La línea, en operación", en: "The line, running" },
  },
  termometro: {
    src: "/proyectos/mejora/termometro.webp",
    width: 1400,
    height: 1692,
    position: "50% 80%",
    alt: {
      es: "Pirómetro Fluke apuntando al agua de la tina de enfriamiento",
      en: "Fluke infrared thermometer aimed at the cooling tank water",
    },
    caption: {
      es: "Temperatura del agua de enfriamiento, tomada en la línea",
      en: "Cooling water temperature, taken at the line",
    },
  },
  /*
   * La foto del perfil en la mano, recortado y puesto sobre fondo de estudio.
   * Es la misma pieza, sin el escritorio ni la mano: lo que se mira es el
   * producto.
   */
  estudio: {
    src: "/proyectos/mejora/perfil-estudio.webp",
    width: 2000,
    height: 1500,
    position: "50% 100%",
    alt: {
      es: "Perfil negro sobre fondo azul marino con retícula técnica",
      en: "Black profile on a navy background with a technical grid",
    },
    caption: { es: "El producto que sale de la línea", en: "What the line makes" },
  },
  seccion: {
    src: "/proyectos/mejora/perfil-seccion.webp",
    width: 1400,
    height: 1239,
    alt: {
      es: "Perfil sostenido en la mano, con la sección visible en el extremo",
      en: "Profile held in hand, with its section visible at the end",
    },
    caption: {
      es: "Revisión de la geometría del perfil",
      en: "Checking the profile geometry",
    },
  },
  palet: {
    src: "/proyectos/mejora/producto-paletizado.webp",
    width: 1080,
    height: 1764,
    alt: {
      es: "Producto terminado apilado y emplayado sobre un palé en planta",
      en: "Finished goods stacked and stretch-wrapped on a pallet",
    },
    caption: {
      es: "Producto terminado al final de la línea",
      en: "Finished goods at the end of the line",
    },
  },
} satisfies Record<string, CasePhoto>;

export const CASES: CaseStudy[] = [
  {
    slug: "mejora-continua",
    meta: {
      title: {
        es: "Mejora continua en planta con Lean Six Sigma",
        en: "Continuous improvement on the floor with Lean Six Sigma",
      },
      description: {
        es: "Caso de mejora continua en una línea de producción de dos turnos: VSM, 5S y procedimientos estándar. 15 % menos tiempo de preparación y 20 % menos reprocesos.",
        en: "Continuous improvement case on a two-shift production line: VSM, 5S and standard procedures. 15% less setup time and 20% less rework.",
      },
    },
    eyebrow: {
      es: "Caso · Mejora continua · Lean Six Sigma",
      en: "Case · Continuous improvement · Lean Six Sigma",
    },
    title: {
      lead: { es: "Menos espera, menos reproceso,", en: "Less waiting, less rework," },
      accent: { es: "mejor producto.", en: "a better product." },
    },
    lede: {
      es: "Trabajamos con producción y calidad en el piso de una línea de dos turnos. El objetivo era que la línea perdiera menos tiempo en preparar y fabricara menos piezas dos veces, para que el producto saliera bien a la primera.",
      en: "We worked with production and quality on the floor of a two-shift line. The goal was for the line to lose less time on setup and make fewer parts twice, so the product comes out right the first time.",
    },
    facts: [
      { label: { es: "Turnos", en: "Shifts" }, value: { es: "2", en: "2" } },
      {
        label: { es: "Con quién", en: "With" },
        value: { es: "Producción y Calidad", en: "Production and Quality" },
      },
      { label: { es: "Método", en: "Method" }, value: { es: "DMAIC", en: "DMAIC" } },
      {
        label: { es: "Capacitados", en: "Trained" },
        value: { es: "4 operadores", en: "4 operators" },
      },
    ],
    film: {
      src: "/proyectos/mejora/planta.mp4",
      poster: "/proyectos/mejora/planta-poster.webp",
      chip: "planta.mp4",
      caption: {
        es: "Recorrido por la planta: la línea y el producto terminado.",
        en: "Walking the plant: the line and the finished goods.",
      },
    },
    summary: {
      title: { es: "El caso en un párrafo", en: "The case in one paragraph" },
      body: {
        es: "Coordinamos con producción y calidad iniciativas de **mejora continua en piso**, en **dos turnos**. Mapeamos el estado actual con **Value Stream Mapping (VSM)**, estandarizamos procedimientos y reorganizamos las estaciones de trabajo con **5S**. Así logramos **15 % menos tiempo de preparación** y **20 % menos reprocesos**. Dimos seguimiento a los **KPI**, documentamos desviaciones, impulsamos **acciones correctivas** y capacitamos a **cuatro operadores** para que los cambios se adoptaran y se sostuvieran.",
        en: "Together with production and quality we ran **continuous improvement on the floor**, across **two shifts**. We mapped the current state with **Value Stream Mapping (VSM)**, standardized procedures and reorganized workstations with **5S**. That brought **15% less setup time** and **20% less rework**. We tracked **KPIs**, documented deviations, drove **corrective actions** and trained **four operators** so the changes were adopted and kept.",
      },
    },
    results: [
      {
        value: 15,
        sign: "−",
        unit: "%",
        label: { es: "Tiempo de preparación", en: "Setup time" },
        detail: {
          es: "Menos minutos desde que la línea para hasta que vuelve a sacar pieza buena, con un procedimiento estándar y la estación ordenada.",
          en: "Fewer minutes from the moment the line stops until it makes good parts again, with a standard procedure and an orderly station.",
        },
        index: true,
      },
      {
        value: 20,
        sign: "−",
        unit: "%",
        label: { es: "Reprocesos", en: "Rework" },
        detail: {
          es: "Menos piezas fabricadas dos veces. Cada desviación quedó documentada con su acción correctiva.",
          en: "Fewer parts made twice. Every deviation was documented along with its corrective action.",
        },
        index: true,
      },
      {
        value: 4,
        sign: "",
        unit: "",
        label: { es: "Operadores capacitados", en: "Operators trained" },
        detail: {
          es: "Los cambios los sostienen las personas que operan la línea, en los dos turnos.",
          en: "The changes are kept up by the people who run the line, on both shifts.",
        },
      },
    ],
    wastes: [
      {
        name: { es: "Espera", en: "Waiting" },
        body: {
          es: "Cada minuto de preparación es un minuto sin producir. Lo reducen un procedimiento que todos siguen igual y una estación donde nada se busca.",
          en: "Every minute of setup is a minute without production. A procedure everyone follows the same way and a station where nothing has to be searched for bring it down.",
        },
        tag: { es: "−15 % preparación", en: "−15% setup" },
      },
      {
        name: { es: "Defectos", en: "Defects" },
        body: {
          es: "Una pieza fuera de especificación se paga dos veces: al hacerla y al rehacerla. Cada desviación se documenta hasta encontrar el paso que la deja pasar.",
          en: "An out of spec part is paid for twice: once to make it and once to remake it. Each deviation is documented until the step that lets it through is found.",
        },
        tag: { es: "−20 % reproceso", en: "−20% rework" },
      },
      {
        name: { es: "Movimiento", en: "Motion" },
        body: {
          es: "Lo que no tiene un lugar fijo hay que buscarlo, y buscar no agrega valor. Con 5S cada herramienta tiene su lugar en la estación, el mismo en los dos turnos.",
          en: "Anything without a fixed place has to be searched for, and searching adds no value. With 5S every tool has its place at the station, the same on both shifts.",
        },
        tag: { es: "5S", en: "5S" },
      },
    ],
    dmaic: [
      {
        key: "D",
        name: { es: "Definir", en: "Define" },
        body: {
          es: "Con producción y calidad acordamos qué se iba a mejorar y cómo se iba a medir: tiempo de preparación y reproceso, con el mismo criterio en los dos turnos.",
          en: "With production and quality we agreed on what to improve and how to measure it: setup time and rework, with the same criteria on both shifts.",
        },
        tools: [
          { es: "Alcance con producción y calidad", en: "Scope with production and quality" },
          { es: "KPI de línea", en: "Line KPIs" },
        ],
        card: {
          title: { es: "Indicadores acordados", en: "Agreed indicators" },
          rows: [
            [
              { es: "Tiempo de preparación", en: "Setup time" },
              { es: "min · por turno", en: "min · per shift" },
            ],
            [
              { es: "Reproceso", en: "Rework" },
              { es: "% · por turno", en: "% · per shift" },
            ],
          ],
          foot: {
            es: "Mismo criterio en el turno 1 y en el turno 2",
            en: "Same criteria on shift 1 and shift 2",
          },
        },
      },
      {
        key: "M",
        name: { es: "Medir", en: "Measure" },
        body: {
          es: "Mapeamos el estado actual con Value Stream Mapping: cada paso, cada espera y cada inventario entre estaciones. Las variables del proceso se toman en la línea, como la temperatura del agua de enfriamiento.",
          en: "We mapped the current state with Value Stream Mapping: every step, every wait and every pile between stations. Process variables are taken at the line, such as the cooling water temperature.",
        },
        tools: [
          { es: "VSM estado actual", en: "Current state VSM" },
          { es: "Toma de tiempos", en: "Time studies" },
          { es: "Variables de proceso", en: "Process variables" },
        ],
        drawing: "line",
      },
      {
        key: "A",
        name: { es: "Analizar", en: "Analyze" },
        body: {
          es: "Cada desviación quedó documentada y la seguimos hasta el paso del proceso que la deja pasar. La causa se busca en el proceso, no en la persona.",
          en: "Every deviation was documented and traced back to the process step that lets it through. The cause is looked for in the process, not in the person.",
        },
        tools: [
          { es: "Registro de desviaciones", en: "Deviation log" },
          { es: "Causa raíz", en: "Root cause" },
          { es: "Inspección de producto", en: "Product inspection" },
        ],
        photo: PHOTOS.seccion.src,
      },
      {
        key: "I",
        name: { es: "Mejorar", en: "Improve" },
        body: {
          es: "Estandarizamos procedimientos y reorganizamos las estaciones de trabajo con 5S. El tiempo de preparación bajó 15 % y los reprocesos 20 %.",
          en: "We standardized procedures and reorganized workstations with 5S. Setup time dropped 15% and rework 20%.",
        },
        tools: [
          { es: "Trabajo estandarizado", en: "Standard work" },
          { es: "5S", en: "5S" },
          { es: "Estaciones reorganizadas", en: "Reorganized stations" },
        ],
        photo: PHOTOS.linea.src,
      },
      {
        key: "C",
        name: { es: "Controlar", en: "Control" },
        body: {
          es: "Seguimiento de KPI por turno, acciones correctivas cuando algo se desvía y cuatro operadores capacitados para que el estándar se mantenga.",
          en: "KPI tracking per shift, corrective actions when something drifts and four operators trained so the standard holds.",
        },
        tools: [
          { es: "Seguimiento de KPI", en: "KPI tracking" },
          { es: "Acciones correctivas", en: "Corrective actions" },
          { es: "Capacitación", en: "Training" },
        ],
        photo: PHOTOS.palet.src,
      },
    ],
    gallery: [PHOTOS.linea, PHOTOS.termometro, PHOTOS.seccion, PHOTOS.estudio],
    office: {
      eyebrow: { es: "Del piso a la oficina", en: "From the floor to the office" },
      title: {
        es: "El mismo método, aplicado al cierre de mes",
        en: "The same method, applied to month-end close",
      },
      body: {
        es: "Un proceso administrativo también tiene pasos, esperas y reprocesos. En un taller que fabrica kits y tótems, el cierre de mes se armaba a mano juntando archivos. Lo mapeamos igual que una línea, viendo dónde nace cada dato y cuántas veces se vuelve a escribir, y lo convertimos en un solo archivo de Excel con macros.",
        en: "An admin process also has steps, waits and rework. In a workshop that builds kits and kiosks, month-end close was put together by hand from separate files. We mapped it the same way we map a line, looking at where each figure starts and how many times it gets typed again, and turned it into a single Excel file with macros.",
      },
      points: [
        { es: "Las facturas electrónicas del SRI entran solas", en: "SRI e-invoices come in on their own" },
        { es: "Cada kit se costea desde su despiece", en: "Each kit is costed from its bill of materials" },
        { es: "El stock avisa antes de que falte", en: "Stock warns before it runs out" },
        { es: "Tablero y estado de resultados automáticos", en: "Automatic dashboard and income statement" },
      ],
      note: {
        es: "El video usa datos de demostración. Los números del cliente se quedan con el cliente.",
        en: "The video uses demo data. The client's numbers stay with the client.",
      },
      video: {
        src: {
          es: "/proyectos/contable/excel-es.mp4",
          en: "/proyectos/contable/excel-en.mp4",
        },
        poster: {
          es: "/proyectos/contable/excel-es-poster.webp",
          en: "/proyectos/contable/excel-en-poster.webp",
        },
      },
      cta: { es: "Verlo en la lista de proyectos", en: "See it in the project list" },
    },
    close: {
      title: {
        es: "¿Tu línea pierde tiempo preparando o fabricando dos veces?",
        en: "Is your line losing time on setup or making parts twice?",
      },
      body: {
        es: "Lo primero es medir. Si después de medir no hay proyecto, la medición se queda contigo.",
        en: "Measuring comes first. If no project comes out of it, you keep the measurement.",
      },
      primary: { es: "Hablemos", en: "Let's talk" },
      secondary: { es: "Ver los servicios", en: "See the services" },
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
  /** Un caso real de la disciplina, si lo hay. */
  caseHref?: string;
};

export const FIELDS: Field[] = [
  {
    id: "procesos",
    name: { es: "Mejora de procesos", en: "Process improvement" },
    delivers: {
      es: "El flujo rediseñado, medido antes y después, y el tablero con el que se vigila que no se vuelva a torcer.",
      en: "The redesigned flow, measured before and after, plus the dashboard that keeps it from drifting back.",
    },
    span: { es: "4 a 8 semanas", en: "4 to 8 weeks" },
    caseHref: "/proyectos/mejora-continua",
  },
  {
    id: "calidad",
    name: { es: "Sistemas de calidad", en: "Quality systems" },
    delivers: {
      es: "Procedimientos, registros y trazabilidad que aguantan una auditoría, y el equipo entrenado en usarlos.",
      en: "Procedures, records and traceability that survive an audit, and the team trained to keep them.",
    },
    span: { es: "6 a 10 semanas", en: "6 to 10 weeks" },
  },
  {
    id: "automatizacion",
    name: { es: "Automatización", en: "Automation" },
    delivers: {
      es: "La herramienta corriendo dentro de tu operación, con la documentación para mantenerla sin nosotros.",
      en: "The tool running inside your operation, documented well enough to keep without us.",
    },
    span: { es: "4 a 10 semanas", en: "4 to 10 weeks" },
  },
  {
    id: "producto",
    name: { es: "Diseño a producto", en: "Design to product" },
    delivers: {
      es: "Del CAD al prototipo validado, con el expediente técnico armado en paralelo y no al final.",
      en: "From CAD to a validated prototype, with the technical file built alongside instead of at the end.",
    },
    span: { es: "8 a 16 semanas", en: "8 to 16 weeks" },
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
      es: "Medimos en planta, con cronómetro, durante los turnos que haga falta. En vez de preguntar cuánto tarda, lo cronometramos.",
      en: "We measure on the floor with a stopwatch, for as many shifts as it takes. Instead of asking how long it takes, we time it.",
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
      es: "Contamos los reprocesos de los últimos tres meses y buscamos en qué paso del proceso se cuelan, sin buscar culpables.",
      en: "We count the last three months of rework and find the step where it slips through, without looking for someone to blame.",
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
    es: "Son frases que nos dicen los clientes cuando nos llaman. Marca las que se parezcan a tu semana y abajo verás qué haríamos primero.",
    en: "These are things clients tell us when they call. Tick the ones that sound like your week and you'll see what we'd do first.",
  } satisfies Localized,
  empty: {
    es: "Marca al menos una frase para ver qué haríamos. Si ninguna se parece a tu semana, puede que todavía no nos necesites, y preferimos decírtelo aquí.",
    en: "Tick at least one to see what we'd do. If none of them sound like your week, you may not need us yet, and we'd rather tell you here.",
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
    es: "Rellena la fila con una tarea que hoy se haga a mano. Verás la cuenta completa y el veredicto. Si no compensa automatizarla, también te lo dice.",
    en: "Fill the row with a task you do by hand today. You'll see the full calculation and a verdict. If automating it doesn't pay off, it tells you that too.",
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
        es: `Menos de ${HOURS_LOW} horas al año. Un proyecto para esto cuesta más de lo que ahorra. Si la tarea crece, vuelve a hacer la cuenta.`,
        en: `Under ${HOURS_LOW} hours a year. A project for this costs more than it saves. If the task grows, run the numbers again.`,
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
        es: `Más de ${HOURS_HIGH} horas al año: casi un mes de trabajo de una persona, todos los años. Algo de este tamaño cierra alcance y precio en 3 a 5 días y se construye en 4 a 10 semanas.`,
        en: `Over ${HOURS_HIGH} hours a year: nearly a full month of one person's time, every year. Something this size gets scope and price locked in 3 to 5 days and built in 4 to 10 weeks.`,
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
  /** Venía de un capítulo a pantalla completa; ahora encabeza las sedes. */
  overlap: {
    es: "Nueve horas al día en común: siempre hay alguien para responderte.",
    en: "Nine shared hours a day: someone is always there to answer.",
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
      spec: { es: "1 a 2 semanas", en: "1 to 2 weeks" } satisfies Localized,
      body: {
        es: "Medimos tu proceso real antes de proponer nada. Si al final no hay proyecto, la medición se queda contigo igual.",
        en: "We measure your real process before proposing anything. If no project comes out of it, the measurement is yours anyway.",
      } satisfies Localized,
    },
    {
      term: { es: "Precio cerrado", en: "Fixed price" } satisfies Localized,
      spec: { es: "3 a 5 días", en: "3 to 5 days" } satisfies Localized,
      body: {
        es: "Alcance, entregables, plazo y precio por escrito antes de construir. Si algo no se puede prometer, lo decimos desde el principio.",
        en: "Scope, deliverables, timeline and price in writing before we build. If something can't be promised, we say so from the start.",
      } satisfies Localized,
    },
    {
      term: { es: "Entrega cada semana", en: "Weekly delivery" } satisfies Localized,
      spec: { es: "4 a 10 semanas", en: "4 to 10 weeks" } satisfies Localized,
      body: {
        es: "Cada semana te enseñamos algo que ya funciona, para corregir el rumbo cuando todavía cuesta poco.",
        en: "Every week we show you something that already works, so changes happen while they are still cheap.",
      } satisfies Localized,
    },
    {
      term: { es: "Acompañamiento", en: "Support" } satisfies Localized,
      spec: { es: "30 días", en: "30 days" } satisfies Localized,
      body: {
        es: "Después de entregar seguimos disponibles mientras el proceso se estabiliza, sin contrato nuevo.",
        en: "After handover we stay available while the process settles, with no new contract.",
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
    send: { es: "Enviar mensaje", en: "Send message" } satisfies Localized,
    sending: { es: "Enviando…", en: "Sending…" } satisfies Localized,
    sendEmail: { es: "Abrir en mi correo", en: "Open in my mail app" } satisfies Localized,
    sendWhatsapp: { es: "Enviar por WhatsApp", en: "Send on WhatsApp" } satisfies Localized,
    subject: {
      es: "Nuevo contacto desde el sitio de BOUW",
      en: "New enquiry from the BOUW site",
    } satisfies Localized,
    /*
     * Consentimiento expreso: la Ley Orgánica de Protección de Datos
     * Personales pide que sea libre, específico, informado e inequívoco. Una
     * casilla sin marcar de antemano es la forma inequívoca; un texto debajo
     * del botón no lo es.
     */
    consent: {
      es: "Acepto que BOUW use estos datos solo para responder a mi mensaje, según el",
      en: "I agree that BOUW may use this data only to reply to my message, as set out in the",
    } satisfies Localized,
    privacyLink: { es: "aviso de privacidad", en: "privacy notice" } satisfies Localized,
    sentTitle: { es: "Mensaje recibido", en: "Message received" } satisfies Localized,
    sentBody: {
      es: "Te contestamos al correo que dejaste, en menos de 24 horas hábiles.",
      en: "We'll reply to the address you left within one business day.",
    } satisfies Localized,
    fallback: {
      es: "No pudimos enviarlo desde aquí. Tu mensaje sigue escrito: mándalo por WhatsApp o por tu correo.",
      en: "We couldn't send it from here. Your message is still written: send it on WhatsApp or by email.",
    } satisfies Localized,
    invalidEmail: {
      es: "Revisa el correo: lo necesitamos para contestarte.",
      en: "Check the email address: we need it to reply.",
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
