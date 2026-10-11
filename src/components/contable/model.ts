/**
 * Programa contable: el modelo de la réplica.
 *
 * Es el archivo `Programa_contable.xlsm` (Bouw Consulting, v4.0) pasado a la
 * web con datos de demostración. Las reglas son las de sus macros, leídas del
 * propio archivo:
 *
 * - Kit: precio sugerido = (costo de componentes + mano de obra) × (1 + % de
 *   ganancia); IVA 15 %; precio final = sugerido + IVA (`RecalcularKit`).
 * - Venta: una fila por línea de la factura; si la línea es un kit, descuenta
 *   del stock cada componente de su detalle y avisa si alguno queda en su
 *   mínimo o por debajo (`GuardarVenta`, `DescontarStockKit`).
 * - Compra de un componente: repone su stock (`ReponerStockComponente`).
 * - Tablero del mes: ingresos y gastos por total con IVA, cartera con todo lo
 *   pendiente o vencido, días de cartera > 30 crítico y > 15 alerta, burn
 *   rate como promedio de gasto de los últimos tres meses con datos y runway
 *   como saldo acumulado entre burn rate (`ActualizarDashboard`).
 *
 * Nada de esto lleva datos del cliente: ni sus clientes, ni su catálogo, ni
 * RUC reales. Las fechas se generan alrededor del día de hoy, para que el
 * tablero del mes en curso siempre tenga movimiento.
 */

export type UDN = "SaaS" | "Servicios" | "Hardware";
export type Cobro = "Pagado" | "Pendiente" | "Vencido";
export type TipoGasto = "Compra" | "Importación" | "Gasto Operativo" | "Financiero";

export const UDNS: UDN[] = ["Hardware", "SaaS", "Servicios"];
export const IVA = 0.15;

export type Cliente = {
  cod: string;
  tipo: "RUC" | "Cédula";
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  ciudad: string;
  estado: "Activo" | "Inactivo";
  registro: Date;
};

export type Producto = {
  cod: string;
  categoria: string;
  sub: string;
  nombre: string;
  udn: UDN;
  /** Precio de referencia sin IVA: el formulario de venta lo propone. */
  precio: number;
  estado: "Activo" | "Inactivo";
};

export type Componente = {
  cod: string;
  desc: string;
  unidad: "unidad" | "metro" | "global";
  costo: number;
  stock: number;
  min: number;
  proveedor: string;
};

export type Kit = {
  cod: string;
  nombre: string;
  cliente: string;
  mo: number;
  /** Porcentaje, como en la hoja: 18 es 18 %. */
  ganancia: number;
};

export type KitLinea = { kit: string; comp: string; cant: number };

export type Venta = {
  /** Identificador interno de la fila: una factura puede ocupar varias. */
  row: number;
  fac: string;
  fecha: Date;
  cliente: string;
  desc: string;
  udn: UDN;
  subtotal: number;
  iva: number;
  total: number;
  estado: Cobro;
  kit?: string;
};

export type Compra = {
  row: number;
  doc: string;
  fecha: Date;
  proveedor: string;
  tipo: TipoGasto;
  desc: string;
  udn: UDN | "General";
  subtotal: number;
  iva: number;
  total: number;
  comp?: string;
  cant?: number;
};

export type Anticipo = {
  cod: string;
  tipo: "Cliente" | "Proveedor";
  fecha: Date;
  nombre: string;
  monto: number;
  concepto: string;
  estado: "Pendiente de aplicar" | "Aplicado";
};

export type Book = {
  hoy: Date;
  clientes: Cliente[];
  productos: Producto[];
  componentes: Componente[];
  kits: Kit[];
  kitLineas: KitLinea[];
  ventas: Venta[];
  compras: Compra[];
  anticipos: Anticipo[];
  metas: { ventas: number; utilidad: number };
  /** Siguiente fila libre, para que cada registro tenga su identidad. */
  seq: number;
};

/* ------------------------------------------------------------------ */
/* Formato                                                             */
/* ------------------------------------------------------------------ */

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Como `Format(x, "$#,##0.00")` del archivo. */
export function usd(n: number) {
  const s = money.format(Math.abs(n));
  return n < 0 ? `-$${s}` : `$${s}`;
}

export function num(n: number) {
  return money.format(n);
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** dd/mm/aaaa, que es como el archivo guarda las fechas. */
export function fecha(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
export const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function daysBetween(a: Date, b: Date) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/* ------------------------------------------------------------------ */
/* Validación de identificación (como `ValidarCedula` y `ValidarRUC`)  */
/* ------------------------------------------------------------------ */

export function cedulaValida(c: string) {
  if (!/^\d{10}$/.test(c)) return false;
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let d = Number(c[i]) * coef[i];
    if (d > 9) d -= 9;
    suma += d;
  }
  const ver = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  return ver === Number(c[9]);
}

export function rucValido(r: string) {
  return /^\d{13}$/.test(r) && r.endsWith("001") && cedulaValida(r.slice(0, 10));
}

/** La identificación se muestra tapada: es una demostración. */
export function tapar(id: string) {
  if (id.length <= 6) return id;
  return `${id.slice(0, 4)}${"•".repeat(id.length - 7)}${id.slice(-3)}`;
}

/* ------------------------------------------------------------------ */
/* Kits                                                                */
/* ------------------------------------------------------------------ */

export type KitCalc = {
  nComp: number;
  hw: number;
  sugerido: number;
  iva: number;
  final: number;
};

export function calcKit(book: Book, kit: Kit): KitCalc {
  let hw = 0;
  let nComp = 0;
  for (const l of book.kitLineas) {
    if (l.kit !== kit.cod) continue;
    const c = book.componentes.find((x) => x.cod === l.comp);
    hw += (c?.costo ?? 0) * l.cant;
    nComp++;
  }
  const sugerido = (hw + kit.mo) * (1 + kit.ganancia / 100);
  const iva = sugerido * IVA;
  return { nComp, hw, sugerido, iva, final: sugerido + iva };
}

/** Lo que un kit descontaría del stock, y qué componentes quedarían bajos. */
export function stockTrasKit(book: Book, kitCod: string) {
  const bajos: { comp: Componente; queda: number }[] = [];
  for (const l of book.kitLineas) {
    if (l.kit !== kitCod) continue;
    const c = book.componentes.find((x) => x.cod === l.comp);
    if (!c) continue;
    const queda = c.stock - l.cant;
    if (c.min > 0 && queda <= c.min) bajos.push({ comp: c, queda });
  }
  return bajos;
}

/* ------------------------------------------------------------------ */
/* Acciones (lo que hacen las macros)                                  */
/* ------------------------------------------------------------------ */

export type LineaVenta = {
  desc: string;
  udn: UDN;
  subtotal: number;
  kit?: string;
};

export type Action =
  | {
      type: "venta";
      fac: string;
      fecha: Date;
      cliente: string;
      estado: Cobro;
      lineas: LineaVenta[];
    }
  | { type: "cobrar"; fac: string }
  | { type: "borrarVenta"; row: number }
  | {
      type: "compra";
      compra: Omit<Compra, "row" | "iva" | "total"> & { conIva: boolean };
    }
  | { type: "borrarCompra"; row: number }
  | { type: "cliente"; cliente: Omit<Cliente, "cod" | "registro"> }
  | { type: "kit"; cod: string; field: "mo" | "ganancia"; value: number }
  | { type: "componente"; cod: string; field: "costo" | "stock" | "min"; value: number }
  | { type: "kitLinea"; kit: string; comp: string; cant: number }
  | { type: "metas"; ventas: number; utilidad: number }
  | { type: "reset"; book: Book };

export function reduce(book: Book, a: Action): Book {
  switch (a.type) {
    case "venta": {
      let seq = book.seq;
      const componentes = book.componentes.map((c) => ({ ...c }));
      const filas: Venta[] = a.lineas.map((l) => {
        const sub = round2(l.subtotal);
        const iva = round2(sub * IVA);
        if (l.kit) {
          // DescontarStockKit: cada línea de kit descuenta su detalle una vez
          for (const kl of book.kitLineas) {
            if (kl.kit !== l.kit) continue;
            const c = componentes.find((x) => x.cod === kl.comp);
            if (c) c.stock = round2(c.stock - kl.cant);
          }
        }
        return {
          row: seq++,
          fac: a.fac,
          fecha: a.fecha,
          cliente: a.cliente,
          desc: l.desc,
          udn: l.udn,
          subtotal: sub,
          iva,
          total: round2(sub + iva),
          estado: a.estado,
          kit: l.kit,
        };
      });
      return { ...book, seq, componentes, ventas: [...book.ventas, ...filas] };
    }
    case "cobrar":
      return {
        ...book,
        ventas: book.ventas.map((v) => (v.fac === a.fac ? { ...v, estado: "Pagado" } : v)),
      };
    case "borrarVenta":
      return { ...book, ventas: book.ventas.filter((v) => v.row !== a.row) };
    case "compra": {
      const { conIva, ...c } = a.compra;
      const sub = round2(c.subtotal);
      const iva = conIva ? round2(sub * IVA) : 0;
      const componentes =
        c.comp && c.cant
          ? book.componentes.map((x) =>
              x.cod === c.comp ? { ...x, stock: round2(x.stock + (c.cant ?? 0)) } : x,
            )
          : book.componentes;
      return {
        ...book,
        seq: book.seq + 1,
        componentes,
        compras: [...book.compras, { ...c, row: book.seq, subtotal: sub, iva, total: round2(sub + iva) }],
      };
    }
    case "borrarCompra":
      return { ...book, compras: book.compras.filter((c) => c.row !== a.row) };
    case "cliente": {
      const n = book.clientes.length + 1;
      return {
        ...book,
        clientes: [
          ...book.clientes,
          { ...a.cliente, cod: `CLI-${String(n).padStart(3, "0")}`, registro: book.hoy },
        ],
      };
    }
    case "kit":
      return {
        ...book,
        kits: book.kits.map((k) => (k.cod === a.cod ? { ...k, [a.field]: a.value } : k)),
      };
    case "componente":
      return {
        ...book,
        componentes: book.componentes.map((c) =>
          c.cod === a.cod ? { ...c, [a.field]: a.value } : c,
        ),
      };
    case "kitLinea":
      return {
        ...book,
        kitLineas: book.kitLineas.map((l) =>
          l.kit === a.kit && l.comp === a.comp ? { ...l, cant: a.cant } : l,
        ),
      };
    case "metas":
      return { ...book, metas: { ventas: a.ventas, utilidad: a.utilidad } };
    case "reset":
      return a.book;
  }
}

/** Siguiente número de factura de la serie 001-001. */
export function siguienteFactura(book: Book) {
  let max = 0;
  for (const v of book.ventas) {
    const m = /^001-001-(\d{9})$/.exec(v.fac);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `001-001-${String(max + 1).padStart(9, "0")}`;
}

export function siguienteDoc(book: Book) {
  let max = 0;
  for (const c of book.compras) {
    const n = Number(c.doc.replace(/\D/g, ""));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `DOC-${String(max + 1).padStart(4, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Tablero y reportes                                                  */
/* ------------------------------------------------------------------ */

function enMes(d: Date, mes: number, anio: number) {
  return d.getMonth() === mes && d.getFullYear() === anio;
}

function mesAnterior(mes: number, anio: number) {
  return mes === 0 ? { mes: 11, anio: anio - 1 } : { mes: mes - 1, anio };
}

export type Pendiente = {
  fac: string;
  cliente: string;
  total: number;
  fecha: Date;
  dias: number;
  estado: "CRÍTICO" | "ALERTA" | "AL DÍA";
  udn: UDN;
};

/** Cartera: lo pendiente o vencido, una entrada por factura. */
export function cartera(book: Book): Pendiente[] {
  const porFac = new Map<string, Pendiente>();
  for (const v of book.ventas) {
    if (v.estado === "Pagado") continue;
    const p = porFac.get(v.fac);
    if (p) {
      p.total += v.total;
      continue;
    }
    const dias = daysBetween(v.fecha, book.hoy);
    porFac.set(v.fac, {
      fac: v.fac,
      cliente: v.cliente,
      total: v.total,
      fecha: v.fecha,
      dias,
      estado: dias > 30 ? "CRÍTICO" : dias > 15 ? "ALERTA" : "AL DÍA",
      udn: v.udn,
    });
  }
  return [...porFac.values()].sort((a, b) => b.dias - a.dias);
}

export type Mes = {
  mes: number;
  anio: number;
  ingresos: number;
  porUdn: Record<UDN, number>;
  gastos: number;
  costo: number;
  operativos: number;
  movilizacion: number;
  facturas: number;
};

export function resumenMes(book: Book, mes: number, anio: number): Mes {
  const porUdn: Record<UDN, number> = { Hardware: 0, SaaS: 0, Servicios: 0 };
  let ingresos = 0;
  const facs = new Set<string>();
  for (const v of book.ventas) {
    if (!enMes(v.fecha, mes, anio)) continue;
    ingresos += v.total;
    porUdn[v.udn] += v.total;
    facs.add(v.fac);
  }
  let gastos = 0;
  let costo = 0;
  let movilizacion = 0;
  let operativos = 0;
  for (const c of book.compras) {
    if (!enMes(c.fecha, mes, anio)) continue;
    gastos += c.total;
    const d = c.desc.toLowerCase();
    if (c.tipo === "Compra" || c.tipo === "Importación") costo += c.total;
    else if (d.includes("moviliz") || d.includes("envío") || d.includes("envio")) movilizacion += c.total;
    else operativos += c.total;
  }
  return { mes, anio, ingresos, porUdn, gastos, costo, operativos, movilizacion, facturas: facs.size };
}

export type Tablero = {
  actual: Mes;
  anterior: Mes;
  resultado: number;
  margen: number;
  deltaIngresos: number;
  deltaGastos: number;
  cartera: Pendiente[];
  carteraTotal: number;
  burnRate: number;
  runway: number | null;
  flujo: Mes[];
};

export function tablero(book: Book, mes: number, anio: number): Tablero {
  const actual = resumenMes(book, mes, anio);
  const ant = mesAnterior(mes, anio);
  const anterior = resumenMes(book, ant.mes, ant.anio);
  const resultado = actual.ingresos - actual.gastos;
  const margen = actual.ingresos > 0 ? (resultado / actual.ingresos) * 100 : 0;
  const deltaIngresos =
    anterior.ingresos > 0 ? ((actual.ingresos - anterior.ingresos) / anterior.ingresos) * 100 : 0;
  const deltaGastos =
    anterior.gastos > 0 ? ((actual.gastos - anterior.gastos) / anterior.gastos) * 100 : 0;
  const cart = cartera(book);

  // Burn rate: promedio de gasto de los últimos tres meses que tienen gasto
  let gastoTres = 0;
  let conDatos = 0;
  let m = { mes, anio };
  for (let i = 0; i < 3; i++) {
    const r = resumenMes(book, m.mes, m.anio);
    if (r.gastos > 0) {
      gastoTres += r.gastos;
      conDatos++;
    }
    m = mesAnterior(m.mes, m.anio);
  }
  const burnRate = conDatos ? gastoTres / conDatos : 0;
  const saldo =
    book.ventas.reduce((s, v) => s + v.total, 0) - book.compras.reduce((s, c) => s + c.total, 0);
  const runway = burnRate > 0 ? saldo / burnRate : null;

  // Flujo de caja: los seis meses que acaban en el elegido
  const flujo: Mes[] = [];
  m = { mes, anio };
  for (let i = 0; i < 6; i++) {
    flujo.unshift(resumenMes(book, m.mes, m.anio));
    m = mesAnterior(m.mes, m.anio);
  }

  return {
    actual,
    anterior,
    resultado,
    margen,
    deltaIngresos,
    deltaGastos,
    cartera: cart,
    carteraTotal: cart.reduce((s, p) => s + p.total, 0),
    burnRate,
    runway,
    flujo,
  };
}

export function topProductos(book: Book, anio: number) {
  const map = new Map<string, { desc: string; udn: UDN; veces: number; total: number }>();
  for (const v of book.ventas) {
    if (v.fecha.getFullYear() !== anio) continue;
    const p = map.get(v.desc) ?? { desc: v.desc, udn: v.udn, veces: 0, total: 0 };
    p.veces++;
    p.total += v.subtotal;
    map.set(v.desc, p);
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10);
}

export function topClientes(book: Book, anio: number) {
  const map = new Map<
    string,
    { cliente: string; facturas: Set<string>; total: number; ultima: Date; pendiente: number }
  >();
  for (const v of book.ventas) {
    if (v.fecha.getFullYear() !== anio) continue;
    const p =
      map.get(v.cliente) ??
      { cliente: v.cliente, facturas: new Set<string>(), total: 0, ultima: v.fecha, pendiente: 0 };
    p.facturas.add(v.fac);
    p.total += v.subtotal;
    if (v.fecha > p.ultima) p.ultima = v.fecha;
    if (v.estado !== "Pagado") p.pendiente += v.total;
    map.set(v.cliente, p);
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Datos de demostración                                               */
/* ------------------------------------------------------------------ */

/** Azar con semilla: la demostración es la misma cada vez que se abre. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLIENTES: [Cliente["tipo"], string, string, string][] = [
  ["RUC", "1790459871001", "Condominio Las Acacias", "Quito"],
  ["RUC", "1791823546001", "Edificio Torre Norte", "Quito"],
  ["RUC", "1792310984001", "Urbanización El Bosque", "Cumbayá"],
  ["RUC", "0992746135001", "Clínica del Valle", "Guayaquil"],
  ["RUC", "1791067423001", "Colegio Los Pinos", "Quito"],
  ["Cédula", "1718293046", "Andrea Morales", "Quito"],
  ["RUC", "1793502718001", "Conjunto Altos del Sur", "Quito"],
  ["RUC", "0190387524001", "Bodegas Industriales Norte", "Cuenca"],
];

const PRODUCTOS: Omit<Producto, "estado">[] = [
  { cod: "N0001", categoria: "NUBE", sub: "ACCESOS", nombre: "Plataforma de accesos (mensual)", udn: "SaaS", precio: 180 },
  { cod: "N0002", categoria: "NUBE", sub: "APP", nombre: "App residentes y botón de pánico", udn: "SaaS", precio: 140 },
  { cod: "N0003", categoria: "NUBE", sub: "BITÁCORA", nombre: "Bitácora digital de guardias", udn: "SaaS", precio: 95 },
  { cod: "N0004", categoria: "NUBE", sub: "VEHÍCULOS", nombre: "Notificación de salida de vehículos", udn: "SaaS", precio: 120 },
  { cod: "S0001", categoria: "SERVICIOS", sub: "INSTALACIÓN", nombre: "Instalación y configuración", udn: "Servicios", precio: 260 },
  { cod: "S0002", categoria: "SERVICIOS", sub: "ASISTENCIA", nombre: "Visita técnica", udn: "Servicios", precio: 45 },
  { cod: "S0003", categoria: "SERVICIOS", sub: "MANTENIMIENTO", nombre: "Mantenimiento preventivo", udn: "Servicios", precio: 150 },
  { cod: "S0004", categoria: "SERVICIOS", sub: "ASISTENCIA", nombre: "Capacitación a guardias", udn: "Servicios", precio: 120 },
  { cod: "P0001", categoria: "PRODUCTOS", sub: "CCTV", nombre: "Cámara domo 2MP instalada", udn: "Hardware", precio: 95 },
  { cod: "P0002", categoria: "PRODUCTOS", sub: "ACCESOS", nombre: "Lector QR de acceso", udn: "Hardware", precio: 240 },
];

const COMPONENTES: Componente[] = [
  { cod: "C0001", desc: "Cámara domo 2MP IR 40 m", unidad: "unidad", costo: 46.26, stock: 0, min: 3, proveedor: "Mayorista CCTV" },
  { cod: "C0002", desc: "Grabador XVR 4 canales + 1 TB", unidad: "unidad", costo: 63.31, stock: 0, min: 1, proveedor: "Mayorista CCTV" },
  { cod: "C0003", desc: "Fuente 12 VDC", unidad: "unidad", costo: 2.52, stock: 0, min: 4, proveedor: "Electrónica local" },
  { cod: "C0004", desc: "Lector QR y tarjeta electrónica", unidad: "unidad", costo: 160.05, stock: 0, min: 1, proveedor: "Importación" },
  { cod: "C0005", desc: "Caja acrílica para tótem", unidad: "unidad", costo: 28.7, stock: 0, min: 1, proveedor: "Taller de acrílicos" },
  { cod: "C0006", desc: "Tira LED azul", unidad: "unidad", costo: 0.87, stock: 0, min: 5, proveedor: "Electrónica local" },
  { cod: "C0007", desc: "Tornillería y anclajes", unidad: "global", costo: 0.3, stock: 0, min: 20, proveedor: "Ferretería" },
  { cod: "C0008", desc: "Cable UTP categoría 6", unidad: "metro", costo: 0.45, stock: 0, min: 60, proveedor: "Mayorista CCTV" },
  { cod: "C0009", desc: "Monitor Full HD 19 pulgadas", unidad: "unidad", costo: 63.69, stock: 0, min: 1, proveedor: "Mayorista CCTV" },
  { cod: "C0010", desc: "Intercomunicador analógico", unidad: "unidad", costo: 168, stock: 0, min: 1, proveedor: "Importación" },
  { cod: "C0011", desc: "Micrófono y parlante", unidad: "unidad", costo: 13.85, stock: 0, min: 2, proveedor: "Electrónica local" },
  { cod: "C0012", desc: "Silicona fría negra", unidad: "unidad", costo: 0.8, stock: 0, min: 3, proveedor: "Ferretería" },
];

/** Stock al final de la historia de demostración (después de las ventas). */
const STOCK_FINAL: Record<string, number> = {
  C0001: 6,
  C0002: 2,
  C0003: 11,
  C0004: 2,
  C0005: 2,
  C0006: 14,
  C0007: 52,
  C0008: 140,
  C0009: 2,
  C0010: 2,
  C0011: 3,
  C0012: 5,
};

const KITS: Kit[] = [
  { cod: "KIT-001", nombre: "Tótem de acceso QR", cliente: "Varios", mo: 45, ganancia: 18 },
  { cod: "KIT-002", nombre: "Videovigilancia 4 cámaras", cliente: "Varios", mo: 120, ganancia: 22 },
  { cod: "KIT-003", nombre: "Garita inteligente", cliente: "Varios", mo: 80, ganancia: 20 },
];

const KIT_LINEAS: KitLinea[] = [
  { kit: "KIT-001", comp: "C0004", cant: 1 },
  { kit: "KIT-001", comp: "C0005", cant: 1 },
  { kit: "KIT-001", comp: "C0003", cant: 1 },
  { kit: "KIT-001", comp: "C0006", cant: 2 },
  { kit: "KIT-001", comp: "C0007", cant: 8 },
  { kit: "KIT-001", comp: "C0011", cant: 1 },
  { kit: "KIT-002", comp: "C0001", cant: 4 },
  { kit: "KIT-002", comp: "C0002", cant: 1 },
  { kit: "KIT-002", comp: "C0003", cant: 2 },
  { kit: "KIT-002", comp: "C0008", cant: 60 },
  { kit: "KIT-002", comp: "C0007", cant: 16 },
  { kit: "KIT-003", comp: "C0009", cant: 1 },
  { kit: "KIT-003", comp: "C0010", cant: 1 },
  { kit: "KIT-003", comp: "C0001", cant: 1 },
  { kit: "KIT-003", comp: "C0003", cant: 1 },
  { kit: "KIT-003", comp: "C0008", cant: 25 },
  { kit: "KIT-003", comp: "C0012", cant: 2 },
];

/** Gastos que se repiten cada mes: proveedor, tipo, descripción, UDN, monto base. */
const GASTOS_FIJOS: [string, TipoGasto, string, Compra["udn"], number][] = [
  ["Inmobiliaria del Norte", "Gasto Operativo", "Arriendo de bodega y oficina", "General", 380],
  ["Proveedor de internet", "Gasto Operativo", "Internet y telefonía", "General", 48],
  ["Nube y servidores", "Gasto Operativo", "Hosting de la plataforma", "SaaS", 86],
  ["Gasolinera", "Gasto Operativo", "Movilización a obras", "Servicios", 64],
];

export function demoBook(hoy = new Date()): Book {
  const r = rng(20260410);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const clientes: Cliente[] = CLIENTES.map(([tipo, id, nombre, ciudad], i) => ({
    cod: `CLI-${String(i + 1).padStart(3, "0")}`,
    tipo,
    id,
    nombre,
    telefono: `09${Math.floor(10000000 + r() * 89999999)}`,
    correo: `${nombre.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@ejemplo.ec`,
    ciudad,
    estado: i === 7 ? "Inactivo" : "Activo",
    registro: new Date(hoy.getFullYear(), hoy.getMonth() - 8 + (i % 4), 3 + i * 2),
  }));

  const book: Book = {
    hoy,
    clientes,
    productos: [],
    componentes: COMPONENTES.map((c) => ({ ...c })),
    kits: KITS.map((k) => ({ ...k })),
    kitLineas: KIT_LINEAS.map((l) => ({ ...l })),
    ventas: [],
    compras: [],
    anticipos: [],
    metas: { ventas: 4500, utilidad: 1500 },
    seq: 1,
  };
  book.productos = PRODUCTOS.map((p) => ({ ...p, estado: "Activo" }));

  // Ventas: siete meses, el actual hasta hoy
  let fac = 101;
  let seq = 1;
  const activos = clientes.filter((c) => c.estado === "Activo");
  for (let back = 6; back >= 0; back--) {
    const mes = new Date(hoy.getFullYear(), hoy.getMonth() - back, 1);
    const ultimo = back === 0 ? hoy.getDate() : new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    // Crece hacia el presente, con un mes flojo en medio
    // El mes en curso arranca con algo de venta aunque hoy sea día 2: el
    // arriendo ya está pagado y, sin ventas, el tablero abría en pérdida
    const n = back === 0 ? Math.max(4, Math.round((hoy.getDate() / 30) * 8)) : back === 3 ? 4 : 5 + Math.round(r() * 2);
    for (let i = 0; i < n; i++) {
      const dia = Math.min(ultimo, 1 + Math.floor(((i + r() * 0.9) / n) * ultimo));
      const f = new Date(mes.getFullYear(), mes.getMonth(), dia);
      const cliente = pick(activos).nombre;
      const lineas: LineaVenta[] = [];
      const roll = r();
      if (roll < 0.22) {
        const k = pick(book.kits);
        lineas.push({ desc: k.nombre, udn: "Hardware", subtotal: calcKit(book, k).sugerido, kit: k.cod });
        if (r() < 0.6) lineas.push({ desc: "Instalación y configuración", udn: "Servicios", subtotal: 180 + Math.round(r() * 12) * 10 });
      } else if (roll < 0.62) {
        const p = pick(PRODUCTOS.filter((x) => x.udn === "SaaS"));
        lineas.push({ desc: p.nombre, udn: "SaaS", subtotal: p.precio * (1 + Math.floor(r() * 3)) });
      } else if (roll < 0.9) {
        const p = pick(PRODUCTOS.filter((x) => x.udn === "Servicios"));
        lineas.push({ desc: p.nombre, udn: "Servicios", subtotal: p.precio + Math.round(r() * 8) * 10 });
      } else {
        const p = pick(PRODUCTOS.filter((x) => x.udn === "Hardware"));
        lineas.push({ desc: p.nombre, udn: "Hardware", subtotal: p.precio * (1 + Math.floor(r() * 3)) });
      }
      const edad = daysBetween(f, hoy);
      const estado: Cobro =
        edad > 40 ? (r() < 0.06 ? "Vencido" : "Pagado") : edad > 12 ? (r() < 0.3 ? "Pendiente" : "Pagado") : r() < 0.55 ? "Pendiente" : "Pagado";
      const numero = `001-001-${String(fac++).padStart(9, "0")}`;
      for (const l of lineas) {
        const sub = round2(l.subtotal);
        const iva = round2(sub * IVA);
        book.ventas.push({
          row: seq++,
          fac: numero,
          fecha: f,
          cliente,
          desc: l.desc,
          udn: l.udn,
          subtotal: sub,
          iva,
          total: round2(sub + iva),
          estado,
          kit: l.kit,
        });
      }
    }

    // Gastos del mes
    let doc = book.compras.length + 1;
    for (const [prov, tipo, desc, udn, base] of GASTOS_FIJOS) {
      // Repartidos por el mes; en el mes en curso, entre el 1 y hoy
      const dia = Math.max(1, Math.min(ultimo, Math.round(1 + r() * (Math.min(ultimo, 24) - 1))));
      const sub = round2(base * (0.92 + r() * 0.16));
      const iva = round2(sub * IVA);
      book.compras.push({
        row: seq++,
        doc: `DOC-${String(doc++).padStart(4, "0")}`,
        fecha: new Date(mes.getFullYear(), mes.getMonth(), dia),
        proveedor: prov,
        tipo,
        desc,
        udn,
        subtotal: sub,
        iva,
        total: round2(sub + iva),
      });
    }
    // Una compra de material cada dos meses, que repone componentes
    if (back % 2 === 0) {
      const comp = pick(["C0001", "C0004", "C0008", "C0003"]);
      const c = COMPONENTES.find((x) => x.cod === comp)!;
      const cant = c.unidad === "metro" ? 120 : comp === "C0004" ? 2 : 6;
      const sub = round2(c.costo * cant);
      book.compras.push({
        row: seq++,
        doc: `DOC-${String(doc++).padStart(4, "0")}`,
        fecha: new Date(mes.getFullYear(), mes.getMonth(), Math.max(1, Math.min(ultimo - 1, 6))),
        proveedor: c.proveedor,
        tipo: comp === "C0004" ? "Importación" : "Compra",
        desc: `Compra de ${c.desc.toLowerCase()}`,
        udn: "Hardware",
        subtotal: sub,
        iva: round2(sub * IVA),
        total: round2(sub * (1 + IVA)),
        comp,
        cant,
      });
    }
    // Comisiones bancarias: sin IVA
    const comision = round2(4 + r() * 6);
    book.compras.push({
      row: seq++,
      doc: `DOC-${String(doc++).padStart(4, "0")}`,
      fecha: new Date(mes.getFullYear(), mes.getMonth(), Math.min(ultimo, 28)),
      proveedor: "Banco",
      tipo: "Financiero",
      desc: "Intereses y comisiones bancarias",
      udn: "General",
      subtotal: comision,
      iva: 0,
      total: comision,
    });
  }
  // Sin gastos futuros: los del mes en curso solo hasta hoy
  book.compras = book.compras.filter((c) => c.fecha <= hoy);
  book.compras.forEach((c, i) => (c.doc = `DOC-${String(i + 1).padStart(4, "0")}`));

  for (const c of book.componentes) c.stock = STOCK_FINAL[c.cod] ?? 5;

  book.anticipos = [
    { cod: "AC-001", tipo: "Cliente", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), Math.max(1, hoy.getDate() - 9)), nombre: "Conjunto Altos del Sur", monto: 250, concepto: "Anticipo de garita inteligente", estado: "Pendiente de aplicar" },
    { cod: "AC-002", tipo: "Proveedor", fecha: new Date(hoy.getFullYear(), hoy.getMonth() - 1, 14), nombre: "Importación", monto: 320, concepto: "Anticipo de lectores QR", estado: "Pendiente de aplicar" },
    { cod: "AC-003", tipo: "Cliente", fecha: new Date(hoy.getFullYear(), hoy.getMonth() - 2, 5), nombre: "Clínica del Valle", monto: 180, concepto: "Anticipo de instalación", estado: "Aplicado" },
  ];

  book.seq = seq;
  return book;
}
