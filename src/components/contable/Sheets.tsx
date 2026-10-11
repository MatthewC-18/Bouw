"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { LETTERS, type Selection } from "./Grid";
import {
  MESES,
  MESES_CORTOS,
  UDNS,
  fecha,
  resumenMes,
  tablero,
  topClientes,
  topProductos,
  usd,
  type Book,
  type UDN,
} from "./model";

/*
 * Las hojas que el archivo dibuja con sus macros (menú, tablero, detalle
 * financiero y reportes). Van sobre una cuadrícula de Excel de verdad —letras
 * arriba, números a la izquierda, líneas de celda— y cada cifra es una celda:
 * al tocarla, la barra de fórmulas dice de dónde sale.
 */

export const UDN_COLOR: Record<UDN, string> = {
  Hardware: "#6f3fb2",
  SaaS: "#2f6fb2",
  Servicios: "#1f9d6f",
};

const C = {
  ink: "#1f2328",
  navy: "#1f2b38",
  dim: "#6b7280",
  green: "#1f9d6f",
  red: "#e0484a",
  blue: "#2f80c4",
  amber: "#e8a531",
};

/* ------------------------------------------------------------------ */
/* Lienzo con cuadrícula                                               */
/* ------------------------------------------------------------------ */

type Pick = (s: Selection) => void;

function Canvas({
  children,
  sel,
  onSelect,
}: {
  children: ReactNode;
  sel: string;
  onSelect: Pick;
}) {
  const body = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(40);

  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setRows(Math.ceil(e.contentRect.height / 22) + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // La celda marcada lleva el borde verde de la selección
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    el.querySelectorAll("[data-addr]").forEach((n) =>
      n.toggleAttribute("data-sel", (n as HTMLElement).dataset.addr === sel),
    );
  });

  const click = (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-addr]");
    if (!t) return;
    onSelect({ addr: t.dataset.addr ?? "", content: t.dataset.f ?? t.textContent ?? "" });
  };

  return (
    <div className="relative min-h-full min-w-[1000px]">
      <div className="sticky top-0 z-20 flex h-[22px] border-b border-[#d4d4d4] bg-[#f5f5f5] text-[11px] text-[#666]">
        <div className="sticky left-0 z-10 w-10 shrink-0 border-r border-[#d4d4d4] bg-[#f5f5f5]" />
        {LETTERS.slice(0, 13)
          .split("")
          .map((l) => (
            <div key={l} className="flex flex-1 items-center justify-center border-r border-[#e0e0e0]">
              {l}
            </div>
          ))}
      </div>
      <div className="flex">
        <div className="sticky left-0 z-10 w-10 shrink-0 border-r border-[#d4d4d4] bg-[#f5f5f5] text-[11px] text-[#666]">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex h-[22px] items-center justify-center border-b border-[#e3e3e3]">
              {i + 1}
            </div>
          ))}
        </div>
        <div ref={body} onClick={click} className="xl-gridlines relative min-w-0 flex-1 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Una cifra que es una celda: dirección y fórmula para la barra. */
function V({
  addr,
  f,
  children,
  className = "",
}: {
  addr: string;
  f?: string;
  children: ReactNode;
  className?: string;
}) {
  const text = typeof children === "string" ? children : "";
  const prev = useRef(text);
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (text && prev.current !== text) {
      prev.current = text;
      setFlash((n) => n + 1);
    }
  }, [text]);
  return (
    <span data-addr={addr} data-f={f} className={`xl-cell relative cursor-cell ${className}`}>
      {flash > 0 && <span key={flash} aria-hidden className="xl-flash pointer-events-none absolute -inset-1 rounded-sm" />}
      <span className="relative">{children}</span>
    </span>
  );
}

function Band({
  title,
  sub,
  period,
  children,
}: {
  title: string;
  sub: string;
  period: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-[#1f2b38] px-5 py-4 text-[#fff]">
      <span className="text-[22px] font-bold tracking-[0.06em]">{title}</span>
      <span className="text-[12px] text-[#9fb0c2]">{sub}</span>
      <span className="text-[16px] font-semibold">{period}</span>
      <div className="ml-auto flex gap-2">{children}</div>
    </div>
  );
}

function BandButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 rounded-[5px] bg-[#2c3a49] px-3 text-[12px] font-semibold text-[#fff] transition-colors hover:bg-[#3a4b5e]"
    >
      {children}
    </button>
  );
}

function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-[#e3e6ea] bg-[#fff] p-4 ${className}`}>
      {title && (
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#374151]">{title}</h3>
      )}
      {children}
    </section>
  );
}

function Chip({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-block rounded-[3px] px-1.5 py-[1px] text-[10.5px] font-semibold text-[#fff]"
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

const ESTADO_COLOR = { "CRÍTICO": C.red, ALERTA: C.amber, "AL DÍA": C.green } as const;

/* ------------------------------------------------------------------ */
/* MENU                                                                */
/* ------------------------------------------------------------------ */

export const MODULOS: { sheet: string; nombre: string; desc: string }[] = [
  { sheet: "CLIENTES", nombre: "Clientes", desc: "Registro con validación de RUC y cédula" },
  { sheet: "PRODUCTOS", nombre: "Productos", desc: "Catálogo por unidad de negocio" },
  { sheet: "COMPONENTES", nombre: "Componentes", desc: "Piezas, costos y stock mínimo" },
  { sheet: "KITS", nombre: "Kits y tótems", desc: "Despiece, mano de obra y margen" },
  { sheet: "VENTAS", nombre: "Ventas", desc: "Facturas por línea, descuentan stock" },
  { sheet: "COMPRAS_GASTOS", nombre: "Compras y gastos", desc: "Compras, importaciones y gastos" },
  { sheet: "ANTICIPOS", nombre: "Anticipos", desc: "De clientes y a proveedores" },
  { sheet: "DASHBOARD", nombre: "Dashboard", desc: "El mes de un vistazo" },
  { sheet: "DETALLE_FINANCIERO", nombre: "Detalle financiero", desc: "Resultados, cartera y flujo" },
  { sheet: "REPORTES", nombre: "Reportes", desc: "Productos, clientes y meses" },
];

export function MenuSheet({
  go,
  sel,
  onSelect,
}: {
  go: (sheet: string) => void;
  sel: string;
  onSelect: Pick;
}) {
  return (
    <Canvas sel={sel} onSelect={onSelect}>
      <div className="mx-auto max-w-[860px] px-6 pt-10">
        <div className="rounded-md border border-[#e3e6ea] bg-[#fff] p-8 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
          <div className="flex items-baseline gap-4">
            <V addr="A2" className="text-[40px] font-bold tracking-[0.08em] text-[#1f2b38]">
              Bouw
            </V>
            <span className="h-6 w-px bg-[#d7dde4]" />
            <V addr="A4" className="text-[15px] text-[#4b5563]">
              Sistema de Gestión Financiera y Administrativa
            </V>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULOS.map((m) => (
              <button
                key={m.sheet}
                type="button"
                onClick={() => go(m.sheet)}
                className="group rounded-md border border-[#dfe4ea] bg-[#fafbfc] px-4 py-3 text-left transition-colors hover:border-[#1f2b38] hover:bg-[#fff]"
              >
                <span className="block text-[14px] font-semibold text-[#1f2b38]">{m.nombre}</span>
                <span className="mt-0.5 block text-[12px] text-[#6b7280]">{m.desc}</span>
              </button>
            ))}
          </div>
          <p className="mt-8 text-[11px] tracking-[0.08em] text-[#9aa3ad]">
            <V addr="A13">Bouw Consulting · v4.0 · 2026</V>
          </p>
        </div>
      </div>
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/* DASHBOARD                                                           */
/* ------------------------------------------------------------------ */

function Kpi({
  label,
  value,
  addr,
  f,
  color,
  note,
  noteColor,
}: {
  label: string;
  value: string;
  addr: string;
  f: string;
  color: string;
  note: string;
  noteColor: string;
}) {
  return (
    <div className="rounded-md border border-[#e3e6ea] bg-[#fff] px-4 py-3" style={{ borderLeft: `3px solid ${color}` }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4b5563]">{label}</p>
      <p className="mt-1 text-[26px] font-bold leading-tight text-[#1f2328]">
        <V addr={addr} f={f}>
          {value}
        </V>
      </p>
      <p className="mt-0.5 text-[11.5px]" style={{ color: noteColor }}>
        {note}
      </p>
    </div>
  );
}

function CashFlow({ months }: { months: ReturnType<typeof tablero>["flujo"] }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.ingresos, m.gastos]));
  return (
    <div>
      <div className="mb-2 flex gap-4 text-[11px] text-[#4b5563]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: C.green }} /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: C.red }} /> Gastos
        </span>
      </div>
      <div className="relative flex h-[170px] items-end gap-3 border-b border-[#e5e7eb] px-2">
        {[0.25, 0.5, 0.75].map((g) => (
          <span key={g} aria-hidden className="absolute inset-x-0 border-t border-[#f0f2f4]" style={{ bottom: `${g * 100}%` }} />
        ))}
        {months.map((m, i) => (
          <div key={`${m.anio}-${m.mes}`} className="relative flex h-full flex-1 items-end justify-center gap-1">
            <span
              data-addr={`B${12 + i}`}
              data-f={`=SUMIFS(VENTAS!I:I;VENTAS!B:B;"*/${String(m.mes + 1).padStart(2, "0")}/${m.anio}")`}
              title={`Ingresos ${MESES_CORTOS[m.mes]}: ${usd(m.ingresos)}`}
              className="xl-cell w-[38%] max-w-7 cursor-cell rounded-t-[2px] transition-[height] duration-700 ease-out"
              style={{ height: `${(m.ingresos / max) * 100}%`, background: C.green }}
            />
            <span
              data-addr={`C${12 + i}`}
              data-f={`=SUMIFS(COMPRAS_GASTOS!I:I;COMPRAS_GASTOS!B:B;"*/${String(m.mes + 1).padStart(2, "0")}/${m.anio}")`}
              title={`Gastos ${MESES_CORTOS[m.mes]}: ${usd(m.gastos)}`}
              className="xl-cell w-[38%] max-w-7 cursor-cell rounded-t-[2px] transition-[height] duration-700 ease-out"
              style={{ height: `${(m.gastos / max) * 100}%`, background: C.red }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 px-2 pt-1.5 text-[11px] text-[#4b5563]">
        {months.map((m) => (
          <span key={`${m.anio}-${m.mes}`} className="flex-1 text-center">
            {MESES_CORTOS[m.mes]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Donut({ porUdn, mes }: { porUdn: Record<UDN, number>; mes: string }) {
  const total = UDNS.reduce((s, u) => s + porUdn[u], 0);
  const R = 46;
  const L = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-[136px] w-[136px] shrink-0 -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#eef0f3" strokeWidth="18" />
        {total > 0 &&
          UDNS.map((u) => {
            const part = (porUdn[u] / total) * L;
            const el = (
              <circle
                key={u}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={UDN_COLOR[u]}
                strokeWidth="18"
                strokeDasharray={`${part} ${L - part}`}
                strokeDashoffset={-acc}
                className="transition-[stroke-dasharray,stroke-dashoffset] duration-700 ease-out"
              />
            );
            acc += part;
            return el;
          })}
        <g className="rotate-90" style={{ transformOrigin: "60px 60px" }}>
          <text x="60" y="55" textAnchor="middle" fontSize="9" fill={C.dim}>
            {mes}
          </text>
          <text x="60" y="70" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.ink}>
            {usd(total)}
          </text>
        </g>
      </svg>
      <ul className="space-y-2 text-[12px]">
        {UDNS.map((u, i) => (
          <li key={u}>
            <span className="flex items-center gap-1.5 font-semibold text-[#1f2328]">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: UDN_COLOR[u] }} />
              {u}
            </span>
            <span className="text-[11px] text-[#6b7280]">
              <V addr={`J${11 + i * 2}`} f={`=SUMIFS(VENTAS!I:I;VENTAS!F:F;"${u}";…)`}>
                {usd(porUdn[u])}
              </V>{" "}
              · {total ? Math.round((porUdn[u] / total) * 100) : 0} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardSheet({
  book,
  mes,
  anio,
  setMes,
  cobrar,
  sel,
  onSelect,
}: {
  book: Book;
  mes: number;
  anio: number;
  setMes: (delta: number) => void;
  cobrar: (fac: string) => void;
  sel: string;
  onSelect: Pick;
}) {
  const t = tablero(book, mes, anio);
  const { actual } = t;
  const [spin, setSpin] = useState(0);
  const metaV = Math.min(100, (actual.ingresos / Math.max(book.metas.ventas, 1)) * 100);
  const metaU = Math.min(100, Math.max(0, (t.resultado / Math.max(book.metas.utilidad, 1)) * 100));
  const sign = (n: number) => (n >= 0 ? "▲ +" : "▼ −");

  return (
    <Canvas sel={sel} onSelect={onSelect}>
      <Band title="PROGRAMA CONTABLE" sub="Dashboard" period={`${MESES[mes]} ${anio}`}>
        <BandButton onClick={() => setMes(-1)}>◀ Mes</BandButton>
        <BandButton onClick={() => setMes(1)}>Mes ▶</BandButton>
        <BandButton onClick={() => setSpin((s) => s + 1)}>
          <span key={spin} className={spin ? "xl-spin inline-block" : "inline-block"}>
            ↻
          </span>{" "}
          Actualizar
        </BandButton>
      </Band>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-4 gap-3">
          <Kpi
            label="Ingresos del mes"
            value={usd(actual.ingresos)}
            addr="B7"
            f={`=SUMIFS(VENTAS!I:I;VENTAS!B:B;"*/${String(mes + 1).padStart(2, "0")}/${anio}")`}
            color={C.green}
            note={`${sign(t.deltaIngresos)}${Math.abs(t.deltaIngresos).toFixed(1)} % vs mes anterior`}
            noteColor={t.deltaIngresos >= 0 ? C.green : C.red}
          />
          <Kpi
            label="Gastos del mes"
            value={usd(actual.gastos)}
            addr="E7"
            f={`=SUMIFS(COMPRAS_GASTOS!I:I;COMPRAS_GASTOS!B:B;"*/${String(mes + 1).padStart(2, "0")}/${anio}")`}
            color={C.red}
            note={`${sign(t.deltaGastos)}${Math.abs(t.deltaGastos).toFixed(1)} % vs mes anterior`}
            noteColor={t.deltaGastos <= 0 ? C.green : C.red}
          />
          <Kpi
            label="Resultado neto"
            value={usd(t.resultado)}
            addr="H7"
            f="=B7-E7"
            color={C.blue}
            note={`Margen: ${t.margen.toFixed(1)} %`}
            noteColor={t.margen >= 0 ? C.green : C.red}
          />
          <Kpi
            label="Cartera pendiente"
            value={usd(t.carteraTotal)}
            addr="K7"
            f='=SUMIFS(VENTAS!I:I;VENTAS!J:J;"<>Pagado")'
            color={C.amber}
            note={`${t.cartera.length} factura${t.cartera.length === 1 ? "" : "s"} por cobrar`}
            noteColor={t.cartera.length ? "#b7791f" : C.dim}
          />
        </div>

        <div className="grid grid-cols-[1.55fr_1fr_1fr] gap-3">
          <Card title="Flujo de caja · últimos 6 meses">
            <CashFlow months={t.flujo} />
          </Card>
          <Card title="Ingresos por unidad de negocio">
            <Donut porUdn={actual.porUdn} mes={MESES[mes]} />
          </Card>
          <Card title="Estado de resultados · resumen">
            <dl className="space-y-1.5 text-[12.5px]">
              <div className="flex justify-between">
                <dt>Ingresos totales</dt>
                <dd className="font-semibold">
                  <V addr="I29" f="=B7">{usd(actual.ingresos)}</V>
                </dd>
              </div>
              <div className="flex justify-between text-[#c2410c]">
                <dt>(−) Costo de ventas</dt>
                <dd className="font-semibold">
                  <V addr="I30" f='=SUMIFS(COMPRAS_GASTOS!I:I;COMPRAS_GASTOS!D:D;"Compra";…)'>{usd(actual.costo)}</V>
                </dd>
              </div>
              <div className="flex justify-between font-semibold" style={{ color: C.blue }}>
                <dt>Utilidad bruta</dt>
                <dd>
                  <V addr="I31" f="=I29-I30">{usd(actual.ingresos - actual.costo)}</V>
                </dd>
              </div>
              <div className="flex justify-between text-[#c2410c]">
                <dt>(−) Gastos operativos</dt>
                <dd className="font-semibold">
                  <V addr="I32" f='=SUMIFS(COMPRAS_GASTOS!I:I;COMPRAS_GASTOS!D:D;"Gasto Operativo";…)'>{usd(actual.operativos)}</V>
                </dd>
              </div>
              <div className="flex justify-between text-[#c2410c]">
                <dt>(−) Movilización / envíos</dt>
                <dd className="font-semibold">
                  <V addr="I33">{usd(actual.movilizacion)}</V>
                </dd>
              </div>
              <div className="mt-2 flex justify-between rounded-[4px] bg-[#1f2b38] px-2 py-1.5 font-semibold text-[#fff]">
                <dt>Resultado neto</dt>
                <dd>
                  <V addr="I34" f="=I31-I32-I33">{usd(t.resultado)}</V>
                </dd>
              </div>
              <p className="pt-1 text-[11px]" style={{ color: t.margen >= 0 ? C.green : C.red }}>
                Margen neto: {t.margen.toFixed(1)} %
              </p>
            </dl>
          </Card>
        </div>

        <Card title="Control de cartera · facturas pendientes">
          {t.cartera.length === 0 ? (
            <p className="py-3 text-[12.5px] text-[#6b7280]">Sin facturas pendientes. La cartera está al día.</p>
          ) : (
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-[#1f2b38] text-left text-[11.5px] text-[#fff]">
                  <th className="px-2 py-1.5 font-semibold">N° Factura</th>
                  <th className="px-2 font-semibold">Cliente</th>
                  <th className="px-2 text-right font-semibold">Monto</th>
                  <th className="px-2 font-semibold">Fecha</th>
                  <th className="px-2 text-right font-semibold">Días</th>
                  <th className="px-2 font-semibold">Estado</th>
                  <th className="px-2 font-semibold">UDN</th>
                  <th className="px-2" />
                </tr>
              </thead>
              <tbody>
                {t.cartera.slice(0, 6).map((p, i) => (
                  <tr key={p.fac} className="border-b border-[#eef0f3]">
                    <td className="px-2 py-1.5 tabular-nums">
                      <V addr={`B${21 + i}`}>{p.fac}</V>
                    </td>
                    <td className="px-2">{p.cliente}</td>
                    <td className="px-2 text-right tabular-nums">
                      <V addr={`E${21 + i}`}>{usd(p.total)}</V>
                    </td>
                    <td className="px-2 tabular-nums">{fecha(p.fecha)}</td>
                    <td className="px-2 text-right tabular-nums">
                      <V addr={`H${21 + i}`} f={`=HOY()-G${21 + i}`}>{`${p.dias}`}</V>
                    </td>
                    <td className="px-2 text-[11.5px] font-bold" style={{ color: ESTADO_COLOR[p.estado] }}>
                      ● {p.estado}
                    </td>
                    <td className="px-2">
                      <Chip color={UDN_COLOR[p.udn]}>{p.udn}</Chip>
                    </td>
                    <td className="px-2 text-right">
                      <button
                        type="button"
                        onClick={() => cobrar(p.fac)}
                        className="rounded-[4px] border border-[#cfe6db] px-2 py-0.5 text-[11px] font-semibold text-[#17784f] transition-colors hover:bg-[#e8f5ee]"
                      >
                        Cobrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {t.cartera.length > 6 && (
            <p className="pt-2 text-[11px] text-[#6b7280]">
              y {t.cartera.length - 6} más en DETALLE_FINANCIERO
            </p>
          )}
        </Card>

        <div className="grid grid-cols-[1fr_1fr_0.8fr] gap-3">
          <Card title="Meta de ventas del mes">
            <Meter pct={metaV} color={C.green} />
            <p className="mt-2 flex justify-between text-[12px] text-[#4b5563]">
              <span>
                Real <V addr="D44" f="=B7">{usd(actual.ingresos)}</V>
              </span>
              <span>
                Meta <V addr="D43">{usd(book.metas.ventas)}</V>
              </span>
            </p>
          </Card>
          <Card title="Meta de utilidad del mes">
            <Meter pct={metaU} color={C.blue} />
            <p className="mt-2 flex justify-between text-[12px] text-[#4b5563]">
              <span>
                Real <V addr="J44" f="=H7">{usd(t.resultado)}</V>
              </span>
              <span>
                Meta <V addr="J43">{usd(book.metas.utilidad)}</V>
              </span>
            </p>
          </Card>
          <Card title="Caja">
            <p className="flex justify-between text-[12.5px]">
              <span className="text-[#4b5563]">Burn rate</span>
              <V addr="J17" f="=PROMEDIO(gasto de los 3 últimos meses)" className="font-semibold">
                {`${usd(t.burnRate)} / mes`}
              </V>
            </p>
            <p className="mt-2 flex justify-between text-[12.5px]">
              <span className="text-[#4b5563]">Runway</span>
              <V
                addr="M17"
                f="=saldo acumulado / burn rate"
                className="font-semibold"
              >
                {t.runway === null ? "Sin datos" : `${t.runway.toFixed(1)} meses`}
              </V>
            </p>
          </Card>
        </div>
      </div>
    </Canvas>
  );
}

function Meter({ pct, color }: { pct: number; color: string }) {
  return (
    <div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#eef0f3]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="mt-1 text-[11px] text-[#6b7280]">{Math.round(pct)} % alcanzado</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DETALLE_FINANCIERO                                                  */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="border-b-2 border-[#1f2b38] pb-1 text-[12px] font-bold uppercase tracking-[0.1em] text-[#1f2b38]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div
      className={`flex justify-between border-b border-[#eef0f3] px-2 py-1 text-[12.5px] ${strong ? "bg-[#f3f6f9] font-bold" : ""}`}
      style={{ color: tone }}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function DetalleSheet({
  book,
  mes,
  anio,
  setMes,
  sel,
  onSelect,
}: {
  book: Book;
  mes: number;
  anio: number;
  setMes: (delta: number) => void;
  sel: string;
  onSelect: Pick;
}) {
  const ventas = book.ventas.filter((v) => v.fecha.getMonth() === mes && v.fecha.getFullYear() === anio);
  const compras = book.compras.filter((c) => c.fecha.getMonth() === mes && c.fecha.getFullYear() === anio);
  const r = resumenMes(book, mes, anio);
  const costos = compras.filter((c) => c.tipo === "Compra" || c.tipo === "Importación");
  const operativos = compras.filter((c) => c.tipo === "Gasto Operativo");
  const financieros = compras.filter((c) => c.tipo === "Financiero");
  const sum = (xs: { total: number }[]) => xs.reduce((s, x) => s + x.total, 0);
  const neto = r.ingresos - r.gastos;
  const t = tablero(book, mes, anio);

  // Flujo de caja: lo cobrado y lo pagado del mes, con saldo corrido
  const movs = [
    ...ventas.filter((v) => v.estado === "Pagado").map((v) => ({ f: v.fecha, c: v.desc, tipo: "Cobro a clientes", i: v.total, e: 0 })),
    ...compras.map((c) => ({ f: c.fecha, c: c.desc, tipo: c.tipo, i: 0, e: c.total })),
  ].sort((a, b) => a.f.getTime() - b.f.getTime());
  let saldo = 0;

  return (
    <Canvas sel={sel} onSelect={onSelect}>
      <Band title="BOUW · Detalle financiero" sub="Estado de resultados, cartera y flujo" period={`${MESES[mes]} ${anio}`}>
        <BandButton onClick={() => setMes(-1)}>◀ Mes</BandButton>
        <BandButton onClick={() => setMes(1)}>Mes ▶</BandButton>
      </Band>
      <div className="max-w-[980px] p-4">
        <Section title={`Estado de resultados · ${MESES[mes]} ${anio}`}>
          <p className="mt-3 text-[11.5px] font-bold text-[#374151]">1. INGRESOS</p>
          <table className="mt-1 w-full text-[12px]">
            <thead>
              <tr className="bg-[#1f2b38] text-left text-[#fff]">
                <th className="px-2 py-1 font-semibold">N° Factura</th>
                <th className="px-2 font-semibold">Cliente</th>
                <th className="px-2 font-semibold">Descripción</th>
                <th className="px-2 font-semibold">UDN</th>
                <th className="px-2 text-right font-semibold">Total</th>
                <th className="px-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.row} className="border-b border-[#eef0f3]">
                  <td className="px-2 py-1 tabular-nums">{v.fac}</td>
                  <td className="px-2">{v.cliente}</td>
                  <td className="px-2">{v.desc}</td>
                  <td className="px-2">
                    <Chip color={UDN_COLOR[v.udn]}>{v.udn}</Chip>
                  </td>
                  <td className="px-2 text-right tabular-nums">{usd(v.total)}</td>
                  <td className="px-2" style={{ color: v.estado === "Pagado" ? C.green : v.estado === "Vencido" ? C.red : "#c2410c" }}>
                    {v.estado}
                  </td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-2 text-[#6b7280]">
                    (Sin ventas este mes)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Row label="TOTAL INGRESOS" value={usd(r.ingresos)} strong />
          <p className="px-2 py-1 text-[11.5px] text-[#6b7280]">
            {UDNS.map((u) => `${u}: ${usd(r.porUdn[u])}`).join("   ·   ")}
          </p>

          <p className="mt-3 text-[11.5px] font-bold text-[#374151]">2. COSTOS DIRECTOS</p>
          {costos.map((c) => (
            <Row key={c.row} label={`${fecha(c.fecha)}  ${c.desc}`} value={usd(c.total)} />
          ))}
          {costos.length === 0 && <Row label="(Sin costos directos este mes)" value={usd(0)} />}
          <Row label="UTILIDAD BRUTA" value={usd(r.ingresos - sum(costos))} strong tone={C.blue} />

          <p className="mt-3 text-[11.5px] font-bold text-[#374151]">3. GASTOS OPERATIVOS</p>
          {operativos.map((c) => (
            <Row key={c.row} label={`${fecha(c.fecha)}  ${c.desc}`} value={`-${usd(c.total)}`} />
          ))}
          <Row label="UTILIDAD OPERATIVA" value={usd(r.ingresos - sum(costos) - sum(operativos))} strong />

          <p className="mt-3 text-[11.5px] font-bold text-[#374151]">4. OTROS INGRESOS Y GASTOS</p>
          {financieros.map((c) => (
            <Row key={c.row} label={`${fecha(c.fecha)}  ${c.desc}`} value={`-${usd(c.total)}`} />
          ))}
          <div className="mt-2 flex items-center justify-between rounded-[4px] bg-[#1f2b38] px-3 py-2 text-[13px] font-bold text-[#fff]">
            <span>RESULTADO NETO DEL MES</span>
            <span className="flex items-center gap-4">
              <span className="text-[11.5px] font-semibold text-[#9fb0c2]">
                Margen: {r.ingresos ? ((neto / r.ingresos) * 100).toFixed(1) : "0.0"} %
              </span>
              <V addr="F33" f="=G28+G31">{usd(neto)}</V>
            </span>
          </div>
        </Section>

        <Section title="Cartera · facturas pendientes y vencidas">
          <table className="mt-2 w-full text-[12px]">
            <thead>
              <tr className="bg-[#1f2b38] text-left text-[#fff]">
                <th className="px-2 py-1 font-semibold">N° Factura</th>
                <th className="px-2 font-semibold">Cliente</th>
                <th className="px-2 font-semibold">Fecha</th>
                <th className="px-2 text-right font-semibold">Total</th>
                <th className="px-2 text-right font-semibold">Días</th>
                <th className="px-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {t.cartera.map((p) => (
                <tr key={p.fac} className="border-b border-[#eef0f3]">
                  <td className="px-2 py-1 tabular-nums">{p.fac}</td>
                  <td className="px-2">{p.cliente}</td>
                  <td className="px-2 tabular-nums">{fecha(p.fecha)}</td>
                  <td className="px-2 text-right tabular-nums">{usd(p.total)}</td>
                  <td className="px-2 text-right tabular-nums">{p.dias} días</td>
                  <td className="px-2 font-bold" style={{ color: ESTADO_COLOR[p.estado] }}>
                    {p.estado}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Row label="TOTAL CARTERA PENDIENTE" value={usd(t.carteraTotal)} strong />
        </Section>

        <Section title={`Cash flow · ${MESES[mes]} ${anio}`}>
          <table className="mt-2 w-full text-[12px]">
            <thead>
              <tr className="bg-[#1f2b38] text-left text-[#fff]">
                <th className="px-2 py-1 font-semibold">Fecha</th>
                <th className="px-2 font-semibold">Concepto</th>
                <th className="px-2 font-semibold">Tipo</th>
                <th className="px-2 text-right font-semibold">Ingreso</th>
                <th className="px-2 text-right font-semibold">Egreso</th>
                <th className="px-2 text-right font-semibold">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {movs.map((m, i) => {
                saldo += m.i - m.e;
                return (
                  <tr key={i} className="border-b border-[#eef0f3]">
                    <td className="px-2 py-1 tabular-nums">{fecha(m.f)}</td>
                    <td className="px-2">{m.c}</td>
                    <td className="px-2 text-[#6b7280]">{m.tipo}</td>
                    <td className="px-2 text-right tabular-nums" style={{ color: C.green }}>
                      {m.i ? usd(m.i) : ""}
                    </td>
                    <td className="px-2 text-right tabular-nums" style={{ color: C.red }}>
                      {m.e ? usd(m.e) : ""}
                    </td>
                    <td className="px-2 text-right font-semibold tabular-nums">{usd(saldo)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      </div>
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/* REPORTES                                                            */
/* ------------------------------------------------------------------ */

export function ReportesSheet({
  book,
  anio,
  sel,
  onSelect,
}: {
  book: Book;
  anio: number;
  sel: string;
  onSelect: Pick;
}) {
  const prods = topProductos(book, anio);
  const clis = topClientes(book, anio);
  const totalProd = prods.reduce((s, p) => s + p.total, 0);
  const topProd = prods[0]?.total ?? 1;
  const meses = Array.from({ length: 12 }, (_, m) => resumenMes(book, m, anio));
  const maxMes = Math.max(1, ...meses.map((m) => m.ingresos));
  const mejor = meses.reduce((a, b) => (b.ingresos > a.ingresos ? b : a), meses[0]);
  let acum = 0;

  return (
    <Canvas sel={sel} onSelect={onSelect}>
      <Band title="BOUW · Reportes y análisis" sub="Lo que más se vende y a quién" period={`Año ${anio}`} />
      <div className="grid max-w-[1180px] grid-cols-2 gap-4 p-4">
        <Card title="Top 10 productos más vendidos">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] text-[#6b7280]">
                <th className="py-1">#</th>
                <th>Producto / descripción</th>
                <th className="text-right">Veces</th>
                <th className="text-right">Facturado</th>
                <th className="w-[90px] pl-2">% del total</th>
              </tr>
            </thead>
            <tbody>
              {prods.map((p, i) => (
                <tr key={p.desc} className="border-t border-[#eef0f3]">
                  <td className="py-1 text-[#6b7280]">{i + 1}</td>
                  <td>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-[2px]" style={{ background: UDN_COLOR[p.udn] }} />
                    {p.desc}
                  </td>
                  <td className="text-right tabular-nums">{p.veces}</td>
                  <td className="text-right tabular-nums">
                    <V addr={`F${8 + i}`}>{usd(p.total)}</V>
                  </td>
                  <td className="pl-2">
                    {/* Barra contra el primero; la cifra, contra el total */}
                    <span className="flex items-center gap-1.5">
                      <span className="block h-1.5 rounded-full bg-[#1f2b38]" style={{ width: `${(p.total / topProd) * 60}%` }} />
                      <span className="text-[10.5px] text-[#6b7280]">{Math.round((p.total / Math.max(totalProd, 1)) * 100)} %</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Top 10 clientes más importantes">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] text-[#6b7280]">
                <th className="py-1">#</th>
                <th>Cliente</th>
                <th className="text-right">Facturas</th>
                <th className="text-right">Comprado</th>
                <th className="pl-2">Cartera</th>
              </tr>
            </thead>
            <tbody>
              {clis.map((c, i) => (
                <tr key={c.cliente} className="border-t border-[#eef0f3]">
                  <td className="py-1 text-[#6b7280]">{i + 1}</td>
                  <td>{c.cliente}</td>
                  <td className="text-right tabular-nums">{c.facturas.size}</td>
                  <td className="text-right tabular-nums">
                    <V addr={`F${12 + i}`}>{usd(c.total)}</V>
                  </td>
                  <td className="pl-2 text-[11.5px] font-semibold" style={{ color: c.pendiente ? "#c2410c" : C.green }}>
                    {c.pendiente ? `Debe ${usd(c.pendiente)}` : "Al día"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={`Ventas por mes · ${anio}`}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] text-[#6b7280]">
                <th className="py-1">Mes</th>
                <th className="text-right">Facturas</th>
                <th className="text-right">Ingresos</th>
                <th className="text-right">Gastos</th>
                <th className="text-right">Resultado</th>
                <th className="w-[110px] pl-3">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => (
                <tr key={m.mes} className="border-t border-[#eef0f3]">
                  <td className="py-1">{MESES_CORTOS[m.mes]}</td>
                  <td className="text-right tabular-nums">{m.facturas}</td>
                  <td className="text-right tabular-nums">
                    <V addr={`D${16 + i}`}>{usd(m.ingresos)}</V>
                  </td>
                  <td className="text-right tabular-nums text-[#6b7280]">{usd(m.gastos)}</td>
                  <td className="text-right font-semibold tabular-nums" style={{ color: m.ingresos - m.gastos >= 0 ? C.ink : C.red }}>
                    {usd(m.ingresos - m.gastos)}
                  </td>
                  <td className="pl-3">
                    <span className="block h-1.5 rounded-full transition-[width] duration-700" style={{ width: `${(m.ingresos / maxMes) * 100}%`, background: C.green }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pt-2 text-[11.5px] font-semibold text-[#374151]">
            Mejor mes: {MESES_CORTOS[mejor.mes]} con {usd(mejor.ingresos)}
          </p>
        </Card>

        <Card title={`Utilidad acumulada · ${anio}`}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] text-[#6b7280]">
                <th className="py-1">Mes</th>
                <th className="text-right">Utilidad</th>
                <th className="text-right">Acumulada</th>
                <th className="text-right">Margen</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => {
                const u = m.ingresos - m.gastos;
                acum += u;
                return (
                  <tr key={m.mes} className="border-t border-[#eef0f3]">
                    <td className="py-1">{MESES_CORTOS[m.mes]}</td>
                    <td className="text-right tabular-nums" style={{ color: u >= 0 ? C.ink : C.red }}>
                      {usd(u)}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      <V addr={`F${32 + i}`} f={`=F${31 + i}+E${32 + i}`}>{usd(acum)}</V>
                    </td>
                    <td className="text-right tabular-nums text-[#6b7280]">
                      {m.ingresos ? `${((u / m.ingresos) * 100).toFixed(1)} %` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </Canvas>
  );
}
