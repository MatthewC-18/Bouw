"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import Grid, { MacroButton, type Col, type Selection } from "./Grid";
import { FormCliente, FormCompra, FormVenta, MsgBox, type Msg, type SaveResult } from "./Forms";
import { DashboardSheet, DetalleSheet, MenuSheet, ReportesSheet, UDN_COLOR } from "./Sheets";
import {
  calcKit,
  demoBook,
  fecha,
  num,
  reduce,
  tapar,
  usd,
  type Action,
  type Anticipo,
  type Book,
  type Cliente,
  type Compra,
  type Componente,
  type Kit,
  type KitLinea,
  type Producto,
  type Venta,
} from "./model";

/**
 * El libro: la réplica de `Programa_contable.xlsm` que se abre en vivo desde
 * la ficha del proyecto.
 *
 * Se ve y se comporta como el archivo en Excel: la cinta, la barra de
 * fórmulas, las doce hojas con sus pestañas y los botones de las macros.
 * Registrar una venta descuenta el stock de los componentes del kit,
 * recalcula el tablero y la cartera; cambiar la mano de obra de un kit cambia
 * su precio. Todo con datos de demostración y en memoria: al cerrar se
 * pierde, como un archivo sin guardar.
 *
 * El libro va en español, como el archivo real. La guía de la derecha va en
 * el idioma del visitante.
 */

const SHEETS = [
  "MENU",
  "CLIENTES",
  "PRODUCTOS",
  "COMPONENTES",
  "KITS",
  "DETALLE_KITS",
  "VENTAS",
  "COMPRAS_GASTOS",
  "ANTICIPOS",
  "DASHBOARD",
  "DETALLE_FINANCIERO",
  "REPORTES",
] as const;
type Sheet = (typeof SHEETS)[number];

type Dialog = "venta" | "compra" | "cliente" | null;

type Steps = { venta: boolean; stock: boolean; kit: boolean; tablero: boolean; cobro: boolean };

function bookReducer(book: Book | null, a: Action) {
  if (a.type === "reset") return a.book;
  return book ? reduce(book, a) : book;
}

export default function Workbook() {
  const { lang } = useLang();
  const [book, dispatch] = useReducer(bookReducer, null);
  const [sheet, setSheet] = useState<Sheet>("DASHBOARD");
  const [sel, setSel] = useState<Selection>({ addr: "B7", content: "" });
  const [rowSel, setRowSel] = useState<Record<string, string | null>>({});
  const [focusKey, setFocusKey] = useState<{ sheet: Sheet; key: string } | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [status, setStatus] = useState("Listo");
  const [saving, setSaving] = useState(false);
  const [mes, setMesState] = useState({ mes: 0, anio: 2026 });
  const [steps, setSteps] = useState<Steps>({ venta: false, stock: false, kit: false, tablero: false, cobro: false });
  const [guideOpen, setGuideOpen] = useState(true);
  const statusTimer = useRef(0);

  // Los datos se crean en el navegador: las fechas cuelgan de hoy
  useEffect(() => {
    const b = demoBook(new Date());
    dispatch({ type: "reset", book: b });
    setMesState({ mes: b.hoy.getMonth(), anio: b.hoy.getFullYear() });
    if (window.innerWidth < 1024) setGuideOpen(false);
  }, []);

  /** Lo que hace una macro: aplica, guarda y lo dice en la barra de estado. */
  const run = useCallback((a: Action, macro: string) => {
    dispatch(a);
    setSaving(true);
    setStatus(`Macro ${macro} ✓`);
    window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => {
      setSaving(false);
      setStatus("Listo");
    }, 2200);
  }, []);

  const go = useCallback((s: string) => {
    if (!(SHEETS as readonly string[]).includes(s)) return;
    setSheet(s as Sheet);
    setSel({ addr: "A1", content: "" });
  }, []);

  // Pasos de la guía que se cumplen solos al visitar una hoja
  useEffect(() => {
    if (sheet === "COMPONENTES" && steps.venta) setSteps((s) => (s.stock ? s : { ...s, stock: true }));
    if (sheet === "DASHBOARD" && steps.venta) setSteps((s) => (s.tablero ? s : { ...s, tablero: true }));
  }, [sheet, steps.venta]);

  const setMes = (delta: number) =>
    setMesState(({ mes, anio }) => {
      const d = new Date(anio, mes + delta, 1);
      return { mes: d.getMonth(), anio: d.getFullYear() };
    });

  const saved = (a: Action, result: SaveResult, macro: string, sheetAfter: Sheet) => {
    const before = book?.seq ?? 0;
    run(a, macro);
    setDialog(null);
    const queue: Msg[] = [{ title: "BOUW", lines: result.msg, kind: "info" }];
    if (result.warn) queue.push({ title: "Alerta stock", lines: ["STOCK BAJO", ...result.warn], kind: "warn" });
    setMsgs(queue);
    setSheet(sheetAfter);
    if (a.type === "venta") {
      setSteps((s) => ({ ...s, venta: true }));
      setFocusKey({ sheet: "VENTAS", key: String(before) });
    } else if (a.type === "compra") {
      setFocusKey({ sheet: "COMPRAS_GASTOS", key: String(before) });
    } else if (a.type === "cliente") {
      setFocusKey({ sheet: "CLIENTES", key: `CLI-${String((book?.clientes.length ?? 0) + 1).padStart(3, "0")}` });
    }
  };

  const cobrar = (fac: string) => {
    run({ type: "cobrar", fac }, "MarcarPagada");
    setSteps((s) => ({ ...s, cobro: true }));
  };

  const pick = (s: Selection) => setSel(s);
  const pickRow = (s: Selection, key: string | null) => {
    setSel(s);
    setRowSel((r) => ({ ...r, [sheet]: key }));
  };

  /* ---------------------------------------------------------------- */
  /* Hojas de datos                                                    */
  /* ---------------------------------------------------------------- */

  const grids = useMemo(() => {
    if (!book) return null;

    const cli: Col<Cliente>[] = [
      { key: "cod", head: "Cód.", w: 76, get: (r) => r.cod, cls: () => "font-semibold text-[#1f2b38]" },
      { key: "tipo", head: "Tipo", w: 70, get: (r) => r.tipo },
      { key: "id", head: "RUC / Cédula", w: 128, get: (r) => tapar(r.id) },
      { key: "nom", head: "Nombre / Razón Social", w: 220, get: (r) => r.nombre },
      { key: "tel", head: "Teléfono", w: 104, get: (r) => r.telefono },
      { key: "mail", head: "Correo", w: 190, get: (r) => r.correo },
      { key: "ciudad", head: "Ciudad", w: 100, get: (r) => r.ciudad },
      {
        key: "est",
        head: "Estado",
        w: 80,
        get: (r) => r.estado,
        cls: (r) => (r.estado === "Activo" ? "font-semibold text-[#1e7145]" : "text-[#9aa3ad]"),
      },
      { key: "reg", head: "F. Registro", w: 100, get: (r) => fecha(r.registro) },
    ];

    const kitsComoProducto: Producto[] = book.kits.map((k) => ({
      cod: k.cod,
      categoria: "KITS",
      sub: "TÓTEMS",
      nombre: k.nombre,
      udn: "Hardware",
      precio: calcKit(book, k).sugerido,
      estado: "Activo",
    }));
    const prod: Col<Producto>[] = [
      { key: "cod", head: "Código", w: 82, get: (r) => r.cod, cls: (r) => (r.cod.startsWith("KIT") ? "font-semibold text-[#e97132]" : "font-semibold text-[#1f2b38]") },
      { key: "cat", head: "Categoría", w: 104, get: (r) => r.categoria },
      { key: "sub", head: "Subcategoría", w: 120, get: (r) => r.sub },
      { key: "nom", head: "Nombre", w: 260, get: (r) => r.nombre },
      {
        key: "udn",
        head: "Unidad de Negocio",
        w: 130,
        get: (r) => r.udn,
        show: (r) => (
          <span className="font-semibold" style={{ color: UDN_COLOR[r.udn] }}>
            {r.udn}
          </span>
        ),
      },
      {
        key: "precio",
        head: "Precio ref.",
        w: 100,
        align: "right",
        get: (r) => num(r.precio),
        formula: (r) => {
          const i = book.kits.findIndex((k) => k.cod === r.cod);
          return i >= 0 ? `=KITS!H${5 + i}` : num(r.precio);
        },
      },
      { key: "est", head: "Estado", w: 80, get: (r) => r.estado, cls: () => "text-[#1e7145]" },
    ];

    const comp: Col<Componente>[] = [
      { key: "cod", head: "Código", w: 76, get: (r) => r.cod, cls: () => "font-semibold text-[#1f2b38]" },
      { key: "desc", head: "Descripción", w: 250, get: (r) => r.desc },
      { key: "uni", head: "Unidad", w: 76, get: (r) => r.unidad },
      {
        key: "costo",
        head: "Costo Unit.",
        w: 96,
        align: "right",
        get: (r) => r.costo,
        show: (r) => num(r.costo),
        edit: (r, v) => {
          run({ type: "componente", cod: r.cod, field: "costo", value: v }, "GuardarComponente");
          return true;
        },
      },
      {
        key: "stock",
        head: "Stock",
        w: 76,
        align: "right",
        get: (r) => r.stock,
        edit: (r, v) => {
          run({ type: "componente", cod: r.cod, field: "stock", value: Math.round(v) }, "GuardarComponente");
          return true;
        },
        cls: (r) => (r.stock <= r.min ? "font-bold text-[#c42b1c]" : ""),
      },
      {
        key: "min",
        head: "Stock Mín.",
        w: 86,
        align: "right",
        get: (r) => r.min,
        edit: (r, v) => {
          run({ type: "componente", cod: r.cod, field: "min", value: Math.round(v) }, "GuardarComponente");
          return true;
        },
      },
      { key: "prov", head: "Proveedor", w: 150, get: (r) => r.proveedor },
      {
        key: "alerta",
        head: "Alerta",
        w: 100,
        get: (r) => (r.stock <= r.min ? "Stock bajo" : "OK"),
        formula: (r, n) => `=SI(E${n}<=F${n};"Stock bajo";"OK")`,
        cls: (r) => (r.stock <= r.min ? "font-bold text-[#c42b1c]" : "text-[#1e7145]"),
      },
    ];

    const kit: Col<Kit>[] = [
      { key: "cod", head: "Código Kit", w: 84, get: (r) => r.cod, cls: () => "font-bold text-[#e97132]" },
      { key: "nom", head: "Nombre Kit", w: 190, get: (r) => r.nombre },
      { key: "cli", head: "Cliente", w: 80, get: (r) => r.cliente },
      {
        key: "n",
        head: "# Comp.",
        w: 70,
        align: "right",
        get: (r) => calcKit(book, r).nComp,
        formula: (_, n) => `=CONTAR.SI(DETALLE_KITS!A:A;A${n})`,
      },
      {
        key: "hw",
        head: "Costo HW",
        w: 96,
        align: "right",
        get: (r) => num(calcKit(book, r).hw),
        formula: (_, n) => `=SUMAR.SI(DETALLE_KITS!A:A;A${n};DETALLE_KITS!G:G)`,
      },
      {
        key: "mo",
        head: "Mano de Obra",
        w: 104,
        align: "right",
        get: (r) => r.mo,
        show: (r) => num(r.mo),
        edit: (r, v) => {
          run({ type: "kit", cod: r.cod, field: "mo", value: v }, "RecalcularKit");
          setSteps((s) => ({ ...s, kit: true }));
          return true;
        },
      },
      {
        key: "gan",
        head: "% Ganancia",
        w: 90,
        align: "right",
        get: (r) => r.ganancia,
        edit: (r, v) => {
          if (v > 300) return false;
          run({ type: "kit", cod: r.cod, field: "ganancia", value: v }, "RecalcularKit");
          setSteps((s) => ({ ...s, kit: true }));
          return true;
        },
      },
      {
        key: "sug",
        head: "Precio Sugerido",
        w: 116,
        align: "right",
        get: (r) => num(calcKit(book, r).sugerido),
        formula: (_, n) => `=(E${n}+F${n})*(1+G${n}/100)`,
        cls: () => "font-semibold",
      },
      {
        key: "iva",
        head: "IVA 15%",
        w: 90,
        align: "right",
        get: (r) => num(calcKit(book, r).iva),
        formula: (_, n) => `=H${n}*15%`,
      },
      {
        key: "final",
        head: "Precio Final",
        w: 106,
        align: "right",
        get: (r) => num(calcKit(book, r).final),
        formula: (_, n) => `=H${n}+I${n}`,
        cls: () => "font-bold text-[#1f2b38]",
      },
    ];

    const selKit = rowSel.KITS ?? null;
    const det: Col<KitLinea>[] = [
      { key: "kit", head: "Código Kit", w: 84, get: (r) => r.kit, cls: () => "font-bold text-[#e97132]" },
      { key: "nk", head: "Nombre Kit", w: 180, get: (r) => book.kits.find((k) => k.cod === r.kit)?.nombre ?? "" },
      { key: "cc", head: "Cód. Comp.", w: 86, get: (r) => r.comp },
      { key: "desc", head: "Descripción", w: 240, get: (r) => book.componentes.find((c) => c.cod === r.comp)?.desc ?? "" },
      {
        key: "cant",
        head: "Cantidad",
        w: 82,
        align: "right",
        get: (r) => r.cant,
        edit: (r, v) => {
          if (v <= 0) return false;
          run({ type: "kitLinea", kit: r.kit, comp: r.comp, cant: v }, "AgregarCompAKit");
          setSteps((s) => ({ ...s, kit: true }));
          return true;
        },
      },
      {
        key: "cu",
        head: "Costo Unit.",
        w: 96,
        align: "right",
        get: (r) => num(book.componentes.find((c) => c.cod === r.comp)?.costo ?? 0),
        formula: (_, n) => `=BUSCARV(C${n};COMPONENTES!A:D;4;FALSO)`,
      },
      {
        key: "st",
        head: "Subtotal",
        w: 96,
        align: "right",
        get: (r) => num((book.componentes.find((c) => c.cod === r.comp)?.costo ?? 0) * r.cant),
        formula: (_, n) => `=E${n}*F${n}`,
        cls: () => "font-semibold",
      },
    ];

    const ven: Col<Venta>[] = [
      { key: "fac", head: "N° Factura", w: 136, get: (r) => r.fac, cls: () => "font-bold text-[#7030a0]" },
      { key: "fecha", head: "Fecha", w: 90, get: (r) => fecha(r.fecha) },
      { key: "cli", head: "Cliente", w: 190, get: (r) => r.cliente },
      {
        key: "desc",
        head: "Descripción",
        w: 230,
        get: (r) => r.desc,
        show: (r) => (
          <>
            {r.kit && <span className="mr-1 font-semibold text-[#e97132]">[KIT]</span>}
            {r.desc}
          </>
        ),
      },
      {
        key: "udn",
        head: "UDN",
        w: 84,
        get: (r) => r.udn,
        show: (r) => (
          <span className="font-semibold" style={{ color: UDN_COLOR[r.udn] }}>
            {r.udn}
          </span>
        ),
      },
      { key: "sub", head: "Subtotal", w: 96, align: "right", get: (r) => num(r.subtotal) },
      { key: "iva", head: "IVA", w: 80, align: "right", get: (r) => num(r.iva), formula: (_, n) => `=F${n}*15%` },
      { key: "tot", head: "Total", w: 96, align: "right", get: (r) => num(r.total), formula: (_, n) => `=F${n}+G${n}`, cls: () => "font-semibold" },
      {
        key: "est",
        head: "Estado Cobro",
        w: 100,
        get: (r) => r.estado,
        cls: (r) =>
          `font-bold ${r.estado === "Pagado" ? "text-[#1e7145]" : r.estado === "Pendiente" ? "text-[#e97132]" : "text-[#c00000]"}`,
      },
    ];

    const com: Col<Compra>[] = [
      { key: "doc", head: "N° Doc.", w: 90, get: (r) => r.doc, cls: () => "font-bold text-[#555]" },
      { key: "fecha", head: "Fecha", w: 90, get: (r) => fecha(r.fecha) },
      { key: "prov", head: "Proveedor", w: 170, get: (r) => r.proveedor },
      { key: "tipo", head: "Tipo", w: 120, get: (r) => r.tipo },
      { key: "desc", head: "Descripción", w: 240, get: (r) => r.desc },
      { key: "udn", head: "UDN", w: 84, get: (r) => r.udn },
      { key: "sub", head: "Subtotal", w: 90, align: "right", get: (r) => num(r.subtotal) },
      { key: "iva", head: "IVA", w: 76, align: "right", get: (r) => num(r.iva) },
      { key: "tot", head: "Total", w: 90, align: "right", get: (r) => num(r.total), formula: (_, n) => `=G${n}+H${n}`, cls: () => "font-semibold" },
    ];

    const ant: Col<Anticipo>[] = [
      { key: "cod", head: "Código", w: 80, get: (r) => r.cod, cls: () => "font-semibold" },
      { key: "tipo", head: "Tipo", w: 90, get: (r) => r.tipo },
      { key: "fecha", head: "Fecha", w: 90, get: (r) => fecha(r.fecha) },
      { key: "nom", head: "Nombre", w: 200, get: (r) => r.nombre },
      { key: "monto", head: "Monto", w: 90, align: "right", get: (r) => num(r.monto) },
      { key: "conc", head: "Concepto", w: 230, get: (r) => r.concepto },
      {
        key: "est",
        head: "Estado",
        w: 150,
        get: (r) => r.estado,
        cls: (r) => (r.estado === "Aplicado" ? "text-[#1e7145]" : "font-semibold text-[#e97132]"),
      },
    ];

    return { cli, prod, kitsComoProducto, comp, kit, det, selKit, ven, com, ant };
  }, [book, rowSel.KITS, run]);

  if (!book || !grids) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#f3f3f3] font-['Segoe_UI',system-ui,sans-serif] text-[13px] text-[#6b7280]">
        Abriendo Programa_contable.xlsm…
      </div>
    );
  }

  const selectedVenta = book.ventas.find((v) => String(v.row) === rowSel.VENTAS);
  const selectedCompra = book.compras.find((c) => String(c.row) === rowSel.COMPRAS_GASTOS);
  const fk = (s: Sheet) => (focusKey?.sheet === s ? focusKey.key : null);
  const toMenu = <MacroButton kind="ghost" onClick={() => go("MENU")}>⌂ Ir al menú</MacroButton>;

  let content: React.ReactNode = null;
  switch (sheet) {
    case "MENU":
      content = <MenuSheet go={go} sel={sel.addr} onSelect={pick} />;
      break;
    case "CLIENTES":
      content = (
        <Grid
          title="CLIENTES"
          subtitle="Registro de clientes activos e inactivos"
          buttons={
            <>
              <MacroButton kind="primary" onClick={() => setDialog("cliente")}>+ Nuevo cliente</MacroButton>
              {toMenu}
            </>
          }
          cols={grids.cli}
          rows={book.clientes}
          rowKey={(r) => r.cod}
          selectedKey={rowSel.CLIENTES}
          focusKey={fk("CLIENTES")}
          onSelect={(s, r) => pickRow(s, r?.cod ?? null)}
        />
      );
      break;
    case "PRODUCTOS":
      content = (
        <Grid
          title="PRODUCTOS"
          subtitle="Catálogo de productos y servicios. Los kits se sincronizan desde KITS con su precio."
          buttons={toMenu}
          cols={grids.prod}
          rows={[...book.productos, ...grids.kitsComoProducto]}
          rowKey={(r) => r.cod}
          selectedKey={rowSel.PRODUCTOS}
          onSelect={(s, r) => pickRow(s, r?.cod ?? null)}
        />
      );
      break;
    case "COMPONENTES":
      content = (
        <Grid
          title="COMPONENTES"
          subtitle="Piezas físicas para fabricar kits. Doble clic en costo, stock o mínimo para editarlos."
          buttons={
            <>
              <MacroButton
                onClick={() => {
                  const bajos = book.componentes.filter((c) => c.min > 0 && c.stock <= c.min);
                  setStatus("Macro ReporteStockBajo ✓");
                  setMsgs([
                    bajos.length
                      ? {
                          title: `${bajos.length} componente(s) con stock bajo`,
                          lines: [
                            "COMPONENTES CON STOCK BAJO:",
                            ...bajos.map((c) => `${c.cod}  ${c.desc}  →  Stock: ${c.stock} (mín: ${c.min})`),
                          ],
                          kind: "warn",
                        }
                      : { title: "Stock OK", lines: ["Todos los componentes tienen stock suficiente."], kind: "info" },
                  ]);
                }}
              >
                Reporte stock bajo
              </MacroButton>
              <MacroButton onClick={() => setDialog("compra")}>+ Comprar (repone stock)</MacroButton>
              {toMenu}
            </>
          }
          cols={grids.comp}
          rows={book.componentes}
          rowKey={(r) => r.cod}
          rowClass={(r) => (r.stock <= r.min ? "!bg-[#fdecea]" : "")}
          selectedKey={rowSel.COMPONENTES}
          onSelect={(s, r) => pickRow(s, r?.cod ?? null)}
        />
      );
      break;
    case "KITS":
      content = (
        <Grid
          title="KITS Y TÓTEMS"
          subtitle="Productos compuestos: agrupan componentes con mano de obra y margen. Doble clic en mano de obra o % de ganancia."
          buttons={
            <>
              <MacroButton
                kind="primary"
                disabled={!grids.selKit}
                title={grids.selKit ? undefined : "Selecciona un kit"}
                onClick={() => go("DETALLE_KITS")}
              >
                Ver detalle del kit
              </MacroButton>
              {toMenu}
            </>
          }
          cols={grids.kit}
          rows={book.kits}
          rowKey={(r) => r.cod}
          selectedKey={rowSel.KITS}
          onSelect={(s, r) => pickRow(s, r?.cod ?? null)}
        />
      );
      break;
    case "DETALLE_KITS":
      content = (
        <Grid
          title="DETALLE DE KITS"
          subtitle={
            grids.selKit
              ? `Componentes de ${grids.selKit}, resaltados. Doble clic en la cantidad para cambiarla.`
              : "Componentes y cantidades por cada kit. Doble clic en la cantidad para cambiarla."
          }
          buttons={
            <>
              <MacroButton onClick={() => go("KITS")}>← Volver a KITS</MacroButton>
              {toMenu}
            </>
          }
          cols={grids.det}
          rows={book.kitLineas}
          rowKey={(r) => `${r.kit}-${r.comp}`}
          rowClass={(r) => (grids.selKit && r.kit === grids.selKit ? "!bg-[#fff4e5]" : "")}
          selectedKey={rowSel.DETALLE_KITS}
          onSelect={(s, r) => pickRow(s, r ? `${r.kit}-${r.comp}` : null)}
        />
      );
      break;
    case "VENTAS":
      content = (
        <Grid
          title="VENTAS"
          subtitle="Registro de ventas: una fila por línea de factura."
          buttons={
            <>
              <MacroButton kind="primary" onClick={() => setDialog("venta")}>+ Nueva venta</MacroButton>
              <MacroButton
                disabled={!selectedVenta || selectedVenta.estado === "Pagado"}
                title="Selecciona una venta pendiente"
                onClick={() => selectedVenta && cobrar(selectedVenta.fac)}
              >
                ✓ Marcar pagada
              </MacroButton>
              <MacroButton
                kind="danger"
                disabled={!selectedVenta}
                onClick={() => {
                  if (!selectedVenta) return;
                  run({ type: "borrarVenta", row: selectedVenta.row }, "EliminarVenta");
                  setRowSel((r) => ({ ...r, VENTAS: null }));
                }}
              >
                Eliminar
              </MacroButton>
              <MacroButton
                kind="ghost"
                onClick={() =>
                  setMsgs([
                    {
                      title: "BOUW",
                      lines: [
                        "Importar XML del SRI",
                        "En el archivo real, esta macro (ImportarXMLVentas) lee los comprobantes autorizados por el SRI, registra las ventas y crea los clientes que falten.",
                        "En la demostración no hay conexión con el SRI.",
                      ],
                      kind: "info",
                    },
                  ])
                }
              >
                Importar XML SRI
              </MacroButton>
              {toMenu}
            </>
          }
          cols={grids.ven}
          rows={book.ventas}
          rowKey={(r) => String(r.row)}
          selectedKey={rowSel.VENTAS}
          focusKey={fk("VENTAS")}
          onSelect={(s, r) => pickRow(s, r ? String(r.row) : null)}
        />
      );
      break;
    case "COMPRAS_GASTOS":
      content = (
        <Grid
          title="COMPRAS Y GASTOS"
          subtitle="Registro de compras, importaciones y gastos operativos."
          buttons={
            <>
              <MacroButton kind="primary" onClick={() => setDialog("compra")}>+ Nueva compra / gasto</MacroButton>
              <MacroButton
                kind="danger"
                disabled={!selectedCompra}
                onClick={() => {
                  if (!selectedCompra) return;
                  run({ type: "borrarCompra", row: selectedCompra.row }, "EliminarCompra");
                  setRowSel((r) => ({ ...r, COMPRAS_GASTOS: null }));
                }}
              >
                Eliminar
              </MacroButton>
              {toMenu}
            </>
          }
          cols={grids.com}
          rows={book.compras}
          rowKey={(r) => String(r.row)}
          selectedKey={rowSel.COMPRAS_GASTOS}
          focusKey={fk("COMPRAS_GASTOS")}
          onSelect={(s, r) => pickRow(s, r ? String(r.row) : null)}
        />
      );
      break;
    case "ANTICIPOS":
      content = (
        <Grid
          title="ANTICIPOS"
          subtitle="Anticipos de clientes y a proveedores: control de saldos pendientes."
          buttons={toMenu}
          cols={grids.ant}
          rows={book.anticipos}
          rowKey={(r) => r.cod}
          selectedKey={rowSel.ANTICIPOS}
          onSelect={(s, r) => pickRow(s, r?.cod ?? null)}
        />
      );
      break;
    case "DASHBOARD":
      content = (
        <DashboardSheet
          book={book}
          mes={mes.mes}
          anio={mes.anio}
          setMes={setMes}
          cobrar={cobrar}
          sel={sel.addr}
          onSelect={pick}
        />
      );
      break;
    case "DETALLE_FINANCIERO":
      content = (
        <DetalleSheet book={book} mes={mes.mes} anio={mes.anio} setMes={setMes} sel={sel.addr} onSelect={pick} />
      );
      break;
    case "REPORTES":
      content = <ReportesSheet book={book} anio={mes.anio} sel={sel.addr} onSelect={pick} />;
      break;
  }

  const done = Object.values(steps).filter(Boolean).length;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#f3f3f3] font-['Segoe_UI','Aptos',system-ui,sans-serif] text-[#1f2328] antialiased">
      {/* Barra de título */}
      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-[#e1e1e1] bg-[#f7f7f7] px-3 text-[12.5px]">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#d4d4d4]" />
          <span className="h-3 w-3 rounded-full bg-[#d4d4d4]" />
          <span className="h-3 w-3 rounded-full bg-[#d4d4d4]" />
        </span>
        <span className="flex h-5 w-5 items-center justify-center rounded-[3px] bg-[#217346] text-[10px] font-bold text-[#fff]" aria-hidden>
          X
        </span>
        <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-[#333]">Programa_contable.xlsm</span>
        <span className="ml-auto text-[11.5px] text-[#6b7280]">{saving ? "Guardando…" : "Guardado"}</span>
      </div>

      {/* Cinta: solo las pestañas, como en la grabación */}
      <div className="flex h-9 shrink-0 items-end gap-5 border-b border-[#e1e1e1] bg-[#f7f7f7] px-4 text-[12.5px] text-[#444]">
        {["Archivo", "Inicio", "Insertar", "Fórmulas", "Datos", "Revisar", "Vista", "Programador"].map((tab) => (
          <span
            key={tab}
            className={`pb-2 ${tab === "Inicio" ? "border-b-2 border-[#217346] font-semibold text-[#217346]" : ""} ${
              tab === "Programador" ? "hidden sm:inline" : ""
            } ${["Revisar", "Vista"].includes(tab) ? "hidden md:inline" : ""}`}
          >
            {tab}
          </span>
        ))}
        <span className="mb-1.5 ml-auto hidden items-center gap-1.5 rounded-full border border-[#b7dcc6] bg-[#e8f5ee] px-2.5 py-0.5 font-mono text-[11px] text-[#17784f] sm:flex">
          ● Macros habilitadas
        </span>
      </div>

      {/* Barra de fórmulas */}
      <div className="flex h-8 shrink-0 items-center border-b border-[#e1e1e1] bg-[#fff] text-[12.5px]">
        <span className="flex h-full w-20 shrink-0 items-center justify-center border-r border-[#e1e1e1] font-semibold tabular-nums">
          {sel.addr}
        </span>
        <span className="px-3 italic text-[#9aa3ad]" aria-hidden>
          fx
        </span>
        <span className="truncate font-mono text-[12px] text-[#1f2328]" title={sel.content}>
          {sel.content}
        </span>
      </div>

      {/* Hoja y guía */}
      <div className="flex min-h-0 flex-1">
        <main key={sheet} className="min-w-0 flex-1 overflow-auto bg-[#fff]">
          {content}
        </main>

        <Guide
          lang={lang}
          open={guideOpen}
          setOpen={setGuideOpen}
          steps={steps}
          done={done}
          go={go}
          openVenta={() => {
            setSheet("VENTAS");
            setDialog("venta");
          }}
          reset={() => {
            const b = demoBook(new Date());
            dispatch({ type: "reset", book: b });
            setSteps({ venta: false, stock: false, kit: false, tablero: false, cobro: false });
            setRowSel({});
            setSheet("DASHBOARD");
            setMesState({ mes: b.hoy.getMonth(), anio: b.hoy.getFullYear() });
          }}
        />
      </div>

      {/* Pestañas de hojas */}
      <div className="flex h-8 shrink-0 items-stretch overflow-x-auto border-t border-[#d4d4d4] bg-[#f3f3f3] text-[12px] [scrollbar-width:thin]">
        {SHEETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            className={`shrink-0 border-r border-[#dcdcdc] px-3.5 transition-colors ${
              s === sheet
                ? "border-b-2 border-b-[#217346] bg-[#fff] font-semibold text-[#217346]"
                : "text-[#444] hover:bg-[#e9e9e9]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Barra de estado */}
      <div className="flex h-6 shrink-0 items-center gap-3 bg-[#217346] px-3 font-mono text-[11px] text-[#fff]/90">
        <span className={status === "Listo" ? "" : "xl-status"}>{status}</span>
        <span className="ml-auto text-[#fde68a]">Datos de demostración</span>
        <span className="hidden sm:inline">100 %</span>
      </div>

      {dialog === "venta" && (
        <FormVenta book={book} onClose={() => setDialog(null)} onSave={(a, r) => saved(a, r, "GuardarVenta", "VENTAS")} />
      )}
      {dialog === "compra" && (
        <FormCompra
          book={book}
          onClose={() => setDialog(null)}
          onSave={(a, r) => saved(a, r, "GuardarCompra", sheet === "COMPONENTES" ? "COMPONENTES" : "COMPRAS_GASTOS")}
        />
      )}
      {dialog === "cliente" && (
        <FormCliente book={book} onClose={() => setDialog(null)} onSave={(a, r) => saved(a, r, "GuardarCliente", "CLIENTES")} />
      )}
      {msgs.length > 0 && !dialog && <MsgBox msg={msgs[0]} onClose={() => setMsgs((m) => m.slice(1))} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Guía                                                                */
/* ------------------------------------------------------------------ */

const GUIDE = {
  es: {
    title: "Prueba el archivo",
    intro:
      "Es una réplica del archivo de Excel con datos de demostración. Las hojas están conectadas, como en el original con sus macros.",
    steps: [
      { key: "venta", t: "Registra una venta", d: "En VENTAS, «+ Nueva venta», elige un kit y guarda.", act: "Registrar venta" },
      { key: "stock", t: "Mira el inventario", d: "El kit descontó sus piezas en COMPONENTES. Lo que queda en su mínimo sale en rojo.", act: "Ir a COMPONENTES" },
      { key: "kit", t: "Cambia un precio", d: "En KITS, doble clic en mano de obra o % de ganancia: el precio final se recalcula.", act: "Ir a KITS" },
      { key: "tablero", t: "Revisa el tablero", d: "En DASHBOARD los ingresos, la cartera y el margen ya incluyen tu venta.", act: "Ir a DASHBOARD" },
      { key: "cobro", t: "Cobra una factura", d: "En la cartera del tablero, «Cobrar»: baja lo pendiente.", act: "Ir a DASHBOARD" },
    ],
    tip: "Toca cualquier cifra: la barra de fórmulas dice de dónde sale.",
    reset: "Restablecer datos",
    hide: "Ocultar",
    show: "Guía",
  },
  en: {
    title: "Try the file",
    intro:
      "A replica of the Excel file with demo data. The sheets are connected, just like the original with its macros. The workbook stays in Spanish, as the client uses it.",
    steps: [
      { key: "venta", t: "Record a sale", d: "In VENTAS, «+ Nueva venta», pick a kit and save.", act: "Record a sale" },
      { key: "stock", t: "Check the inventory", d: "The kit took its parts out of COMPONENTES. Anything at its minimum turns red.", act: "Go to COMPONENTES" },
      { key: "kit", t: "Change a price", d: "In KITS, double click labor or margin %: the final price recalculates.", act: "Go to KITS" },
      { key: "tablero", t: "Check the dashboard", d: "DASHBOARD income, receivables and margin already include your sale.", act: "Go to DASHBOARD" },
      { key: "cobro", t: "Collect an invoice", d: "In the dashboard's receivables, «Cobrar»: what's owed goes down.", act: "Go to DASHBOARD" },
    ],
    tip: "Tap any figure: the formula bar shows where it comes from.",
    reset: "Reset data",
    hide: "Hide",
    show: "Guide",
  },
} as const;

function Guide({
  lang,
  open,
  setOpen,
  steps,
  done,
  go,
  openVenta,
  reset,
}: {
  lang: "es" | "en";
  open: boolean;
  setOpen: (v: boolean) => void;
  steps: Steps;
  done: number;
  go: (s: string) => void;
  openVenta: () => void;
  reset: () => void;
}) {
  const g = GUIDE[lang];
  const target: Record<keyof Steps, () => void> = {
    venta: openVenta,
    stock: () => go("COMPONENTES"),
    kit: () => go("KITS"),
    tablero: () => go("DASHBOARD"),
    cobro: () => go("DASHBOARD"),
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-16 right-3 z-40 flex items-center gap-2 rounded-full bg-[#217346] px-4 py-2 text-[12.5px] font-semibold text-[#fff] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)] hover:bg-[#1a5c38]"
      >
        {g.show} · {done}/5
      </button>
    );
  }

  return (
    <aside className="absolute inset-x-0 bottom-14 z-40 max-h-[70%] overflow-auto border-t border-[#d4d4d4] bg-[#fbfbfb] p-4 shadow-[0_-12px_30px_-18px_rgba(0,0,0,0.4)] lg:static lg:max-h-none lg:w-[300px] lg:shrink-0 lg:border-l lg:border-t-0 lg:shadow-none">
      <div className="flex items-center gap-2">
        <h2 className="text-[14px] font-semibold text-[#1f2b38]">{g.title}</h2>
        <span className="rounded-full bg-[#e8f5ee] px-2 py-0.5 text-[11px] font-semibold text-[#17784f]">{done}/5</span>
        <button type="button" onClick={() => setOpen(false)} className="ml-auto text-[11.5px] text-[#6b7280] hover:text-[#1f2328]">
          {g.hide}
        </button>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[#4b5563]">{g.intro}</p>
      <ol className="mt-3 space-y-2">
        {g.steps.map((s, i) => {
          const ok = steps[s.key as keyof Steps];
          return (
            <li
              key={s.key}
              className={`rounded-md border p-2.5 transition-colors ${ok ? "border-[#b7dcc6] bg-[#f0f9f4]" : "border-[#e3e6ea] bg-[#fff]"}`}
            >
              <p className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1f2b38]">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                    ok ? "bg-[#217346] text-[#fff]" : "border border-[#c3cad3] text-[#6b7280]"
                  }`}
                >
                  {ok ? "✓" : i + 1}
                </span>
                {s.t}
              </p>
              <p className="mt-1 pl-7 text-[11.5px] leading-snug text-[#4b5563]">{s.d}</p>
              {!ok && (
                <button
                  type="button"
                  onClick={target[s.key as keyof Steps]}
                  className="mt-1.5 ml-7 text-[11.5px] font-semibold text-[#217346] hover:underline"
                >
                  {s.act} →
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[11.5px] text-[#6b7280]">{g.tip}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 h-8 w-full rounded-[4px] border border-[#c3cad3] bg-[#fff] text-[12px] text-[#374151] hover:bg-[#eef1f4]"
      >
        ↺ {g.reset}
      </button>
    </aside>
  );
}
