"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  IVA,
  UDNS,
  calcKit,
  cedulaValida,
  rucValido,
  round2,
  siguienteDoc,
  siguienteFactura,
  tapar,
  usd,
  type Action,
  type Book,
  type Cobro,
  type Compra,
  type LineaVenta,
  type TipoGasto,
  type UDN,
} from "./model";

/*
 * Los formularios de las macros (`FormVenta`, `FormCompra`, `FormCliente`) y
 * los avisos (`MsgBox`). Validan lo mismo que en el archivo y con sus mensajes,
 * ya con tildes (en VBA iban sin ellas).
 */

function Dialog({
  title,
  children,
  onClose,
  width = 560,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    box.current?.querySelector<HTMLElement>("input, select, button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center overflow-auto bg-[rgba(15,23,42,0.28)] p-3 pt-[6vh]">
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="xl-pop w-full overflow-hidden rounded-md border border-[#c8ced6] bg-[#f6f7f9] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)]"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center gap-2 bg-[#1f2b38] px-4 py-2.5 text-[13px] font-semibold text-[#fff]">
          <span>{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-[4px] text-[#c6d0db] hover:bg-[#c42b1c] hover:text-[#fff]"
          >
            ✕
          </button>
        </div>
        <div className="p-4 text-[12.5px] text-[#1f2328]">{children}</div>
      </div>
    </div>
  );
}

const field =
  "h-8 w-full rounded-[4px] border border-[#c3cad3] bg-[#fff] px-2 text-[12.5px] text-[#1f2328] outline-none focus:border-[#217346] focus:ring-1 focus:ring-[#217346]";

function Label({ text, children, className = "" }: { text: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold text-[#4b5563]">{text}</span>
      {children}
    </label>
  );
}

function Actions({
  error,
  onCancel,
  onSave,
  saveText = "Guardar",
}: {
  error: string;
  onCancel: () => void;
  onSave: () => void;
  saveText?: string;
}) {
  return (
    <div className="mt-4 flex items-center gap-2 border-t border-[#dde2e8] pt-3">
      <span role="alert" className="min-h-[1em] flex-1 text-[12px] font-semibold text-[#c42b1c]">
        {error}
      </span>
      <button
        type="button"
        onClick={onCancel}
        className="h-8 rounded-[4px] border border-[#c3cad3] bg-[#fff] px-4 text-[12.5px] hover:bg-[#eef1f4]"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSave}
        className="h-8 rounded-[4px] bg-[#217346] px-4 text-[12.5px] font-semibold text-[#fff] hover:bg-[#1a5c38]"
      >
        {saveText}
      </button>
    </div>
  );
}

function toInputDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function fromInputDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

/* ------------------------------------------------------------------ */
/* Nueva venta                                                         */
/* ------------------------------------------------------------------ */

export type SaveResult = { msg: string[]; warn?: string[] };

export function FormVenta({
  book,
  onClose,
  onSave,
}: {
  book: Book;
  onClose: () => void;
  onSave: (a: Action, result: SaveResult) => void;
}) {
  const clientes = book.clientes.filter((c) => c.estado === "Activo");
  const [fac, setFac] = useState(() => siguienteFactura(book));
  const [fecha, setFecha] = useState(() => toInputDate(book.hoy));
  const [cliente, setCliente] = useState(clientes[0]?.nombre ?? "");
  const [estado, setEstado] = useState<Cobro>("Pendiente");
  const [item, setItem] = useState("");
  const [udn, setUdn] = useState<UDN | "">("");
  const [sub, setSub] = useState("");
  const [desc, setDesc] = useState("");
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");

  const kits = useMemo(() => book.kits.map((k) => ({ k, calc: calcKit(book, k) })), [book]);
  const id = book.clientes.find((c) => c.nombre === cliente)?.id ?? "";

  // cmbProducto_Change: un kit trae su precio sugerido; un producto, su UDN
  const choose = (value: string) => {
    setItem(value);
    setError("");
    if (value.startsWith("KIT:")) {
      const k = kits.find((x) => x.k.cod === value.slice(4));
      if (!k) return;
      setUdn("Hardware");
      setSub(k.calc.sugerido.toFixed(2));
      setRef(`Precio kit: sin IVA ${usd(k.calc.sugerido)} · con IVA ${usd(k.calc.final)} (editable)`);
    } else {
      const p = book.productos.find((x) => x.cod === value);
      if (!p) return;
      setUdn(p.udn);
      setSub(p.precio.toFixed(2));
      setRef("Precio de referencia: ajústalo al de esta venta.");
    }
  };

  // btnAgregarLinea_Click
  const addLine = () => {
    if (!item) return setError("Selecciona o escribe el producto/servicio.");
    const s = Number(sub);
    if (!sub || !Number.isFinite(s)) return setError("El subtotal debe ser un número.");
    if (s <= 0) return setError("El subtotal debe ser mayor a 0.");
    if (!udn) return setError("Selecciona la unidad de negocio.");
    const d = desc.trim() ? Number(desc) : 0;
    if (!Number.isFinite(d)) return setError("El descuento debe ser un número.");
    if (d >= s) return setError("El descuento no puede ser mayor o igual al subtotal.");
    const kit = item.startsWith("KIT:") ? kits.find((x) => x.k.cod === item.slice(4)) : undefined;
    const prod = kit ? undefined : book.productos.find((x) => x.cod === item);
    setLineas((ls) => [
      ...ls,
      {
        desc: kit ? kit.k.nombre : prod?.nombre ?? item,
        udn,
        subtotal: round2(s - d),
        kit: kit?.k.cod,
      },
    ]);
    setItem("");
    setUdn("");
    setSub("");
    setDesc("");
    setRef("");
    setError("");
  };

  const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);

  // Lo que pasará con el stock: componentes que quedarán en su mínimo
  const preview = useMemo(() => {
    const stock = new Map(book.componentes.map((c) => [c.cod, c.stock]));
    for (const l of lineas) {
      if (!l.kit) continue;
      for (const kl of book.kitLineas) {
        if (kl.kit === l.kit) stock.set(kl.comp, (stock.get(kl.comp) ?? 0) - kl.cant);
      }
    }
    return book.componentes
      .filter((c) => c.min > 0 && (stock.get(c.cod) ?? 0) <= c.min && (stock.get(c.cod) ?? 0) !== c.stock)
      .map((c) => ({ c, queda: stock.get(c.cod) ?? 0 }));
  }, [book, lineas]);

  // btnGuardar_Click
  const save = () => {
    if (!fac.trim()) return setError("El número de factura es obligatorio.");
    const f = fromInputDate(fecha);
    if (!f) return setError("La fecha es obligatoria.");
    if (!cliente) return setError("El cliente es obligatorio.");
    if (!lineas.length) return setError("Agrega al menos un producto a la factura.");
    if (book.ventas.some((v) => v.fac.toLowerCase() === fac.trim().toLowerCase())) {
      return setError("Ya existe una venta con ese número de factura.");
    }
    const kitsUsados = [...new Set(lineas.filter((l) => l.kit).map((l) => l.kit!))];
    const msg = [`Venta guardada: ${lineas.length} línea(s) registrada(s).`];
    if (kitsUsados.length) msg.push(`Stock descontado: ${kitsUsados.join(" ")}`);
    const warn = preview.map(
      ({ c, queda }) => `${c.desc}: stock actual ${queda} | mínimo ${c.min}`,
    );
    onSave(
      { type: "venta", fac: fac.trim(), fecha: f, cliente, estado, lineas },
      { msg, warn: warn.length ? warn : undefined },
    );
  };

  return (
    <Dialog title="FormVenta · Registrar venta" onClose={onClose} width={640}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Label text="N° Factura" className="col-span-2">
          <input className={field} value={fac} onChange={(e) => setFac(e.target.value)} />
        </Label>
        <Label text="Fecha" className="col-span-2">
          <input type="date" className={field} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Label>
        <Label text="Cliente" className="col-span-2">
          <select className={field} value={cliente} onChange={(e) => setCliente(e.target.value)}>
            {clientes.map((c) => (
              <option key={c.cod}>{c.nombre}</option>
            ))}
          </select>
        </Label>
        <Label text="RUC / Cédula">
          <input className={`${field} bg-[#f1f3f5] text-[#6b7280]`} value={tapar(id)} readOnly />
        </Label>
        <Label text="Estado de cobro">
          <select className={field} value={estado} onChange={(e) => setEstado(e.target.value as Cobro)}>
            <option>Pendiente</option>
            <option>Pagado</option>
          </select>
        </Label>
      </div>

      <fieldset className="mt-4 rounded-[5px] border border-[#d6dce3] bg-[#fff] p-3">
        <legend className="px-1 text-[11px] font-semibold text-[#4b5563]">Línea de la factura</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
          <Label text="Producto o kit" className="col-span-2 sm:col-span-1">
            <select className={field} value={item} onChange={(e) => choose(e.target.value)}>
              <option value="">Elige…</option>
              <optgroup label="Kits (descuentan stock)">
                {kits.map(({ k }) => (
                  <option key={k.cod} value={`KIT:${k.cod}`}>
                    [KIT] {k.nombre}
                  </option>
                ))}
              </optgroup>
              {UDNS.map((u) => (
                <optgroup key={u} label={u}>
                  {book.productos
                    .filter((p) => p.udn === u)
                    .map((p) => (
                      <option key={p.cod} value={p.cod}>
                        {p.nombre}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Label>
          <Label text="UDN">
            <select className={field} value={udn} onChange={(e) => setUdn(e.target.value as UDN)}>
              <option value="" />
              {UDNS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Label>
          <Label text="Subtotal">
            <input className={`${field} text-right`} inputMode="decimal" value={sub} onChange={(e) => setSub(e.target.value)} />
          </Label>
          <Label text="Descuento">
            <input className={`${field} text-right`} inputMode="decimal" value={desc} placeholder="0.00" onChange={(e) => setDesc(e.target.value)} />
          </Label>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex-1 text-[11.5px] text-[#2f6fb2]">{ref}</span>
          <button
            type="button"
            onClick={addLine}
            className="h-8 rounded-[4px] border border-[#1f2b38] bg-[#1f2b38] px-3 text-[12px] font-semibold text-[#fff] hover:bg-[#2c3d50]"
          >
            + Agregar línea
          </button>
        </div>
      </fieldset>

      <div className="mt-3 overflow-hidden rounded-[5px] border border-[#d6dce3] bg-[#fff]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#eef1f4] text-left text-[11px] text-[#4b5563]">
              <th className="px-2 py-1.5 font-semibold">Descripción</th>
              <th className="px-2 font-semibold">UDN</th>
              <th className="px-2 text-right font-semibold">Subtotal</th>
              <th className="px-2 text-right font-semibold">IVA 15%</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={i} className="border-t border-[#eef0f3]">
                <td className="px-2 py-1.5">
                  {l.kit && <span className="mr-1 font-semibold text-[#e97132]">[KIT]</span>}
                  {l.desc}
                </td>
                <td className="px-2">{l.udn}</td>
                <td className="px-2 text-right tabular-nums">{usd(l.subtotal)}</td>
                <td className="px-2 text-right tabular-nums">{usd(l.subtotal * IVA)}</td>
                <td className="px-1 text-center">
                  <button
                    type="button"
                    aria-label="Quitar línea"
                    onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))}
                    className="h-6 w-6 rounded-[4px] text-[#9aa3ad] hover:bg-[#fdecea] hover:text-[#c42b1c]"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {!lineas.length && (
              <tr>
                <td colSpan={5} className="px-2 py-3 text-center text-[#9aa3ad]">
                  Sin líneas. Elige un producto o un kit y pulsa «Agregar línea».
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex justify-end gap-6 border-t border-[#d6dce3] bg-[#fafbfc] px-3 py-2 text-[12px] tabular-nums">
          <span>
            Subtotal <b>{usd(subtotal)}</b>
          </span>
          <span>
            IVA <b>{usd(subtotal * IVA)}</b>
          </span>
          <span className="text-[13px]">
            Total <b className="text-[#217346]">{usd(subtotal * (1 + IVA))}</b>
          </span>
        </div>
      </div>

      {preview.length > 0 && (
        <p className="mt-2 rounded-[4px] border border-[#f3d19e] bg-[#fff7e8] px-2 py-1.5 text-[11.5px] text-[#8a5a00]">
          ⚠ Al guardar quedarán en su mínimo:{" "}
          {preview.map(({ c, queda }) => `${c.desc} (${queda})`).join(", ")}
        </p>
      )}

      <Actions error={error} onCancel={onClose} onSave={save} />
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Nueva compra o gasto                                                */
/* ------------------------------------------------------------------ */

export function FormCompra({
  book,
  onClose,
  onSave,
}: {
  book: Book;
  onClose: () => void;
  onSave: (a: Action, result: SaveResult) => void;
}) {
  const [doc, setDoc] = useState(() => siguienteDoc(book));
  const [fecha, setFecha] = useState(() => toInputDate(book.hoy));
  const [proveedor, setProveedor] = useState("");
  const [tipo, setTipo] = useState<TipoGasto>("Compra");
  const [desc, setDesc] = useState("");
  const [udn, setUdn] = useState<Compra["udn"]>("Hardware");
  const [sub, setSub] = useState("");
  const [conIva, setConIva] = useState(true);
  const [comp, setComp] = useState("");
  const [cant, setCant] = useState("");
  const [error, setError] = useState("");

  const componente = book.componentes.find((c) => c.cod === comp);

  // Al elegir el componente se proponen proveedor, descripción y subtotal
  const chooseComp = (cod: string) => {
    setComp(cod);
    const c = book.componentes.find((x) => x.cod === cod);
    if (!c) return;
    setProveedor((p) => p || c.proveedor);
    setDesc(`Compra de ${c.desc.toLowerCase()}`);
    const q = Number(cant) || (c.unidad === "metro" ? 100 : 5);
    setCant(String(q));
    setSub((c.costo * q).toFixed(2));
    setUdn("Hardware");
  };

  const save = () => {
    const f = fromInputDate(fecha);
    if (!doc.trim()) return setError("El número de documento es obligatorio.");
    if (!f) return setError("La fecha es obligatoria.");
    if (!proveedor.trim()) return setError("El proveedor es obligatorio.");
    if (!desc.trim()) return setError("La descripción es obligatoria.");
    const s = Number(sub);
    if (!Number.isFinite(s) || s <= 0) return setError("El subtotal debe ser mayor a 0.");
    const q = comp ? Number(cant) : 0;
    if (comp && (!Number.isFinite(q) || q <= 0)) return setError("La cantidad debe ser mayor a 0.");
    const msg = ["Registro guardado."];
    if (componente && q) msg.push(`Stock repuesto: ${componente.cod} +${q} (${componente.desc})`);
    onSave(
      {
        type: "compra",
        compra: {
          doc: doc.trim(),
          fecha: f,
          proveedor: proveedor.trim(),
          tipo,
          desc: desc.trim(),
          udn,
          subtotal: s,
          conIva: conIva && tipo !== "Financiero",
          comp: comp || undefined,
          cant: comp ? q : undefined,
        },
      },
      { msg },
    );
  };

  const s = Number(sub) || 0;
  const iva = conIva && tipo !== "Financiero" ? s * IVA : 0;

  return (
    <Dialog title="FormCompra · Registrar compra o gasto" onClose={onClose} width={560}>
      <div className="grid grid-cols-2 gap-3">
        <Label text="N° Documento">
          <input className={field} value={doc} onChange={(e) => setDoc(e.target.value)} />
        </Label>
        <Label text="Fecha">
          <input type="date" className={field} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Label>
        <Label text="Tipo">
          <select className={field} value={tipo} onChange={(e) => setTipo(e.target.value as TipoGasto)}>
            <option>Compra</option>
            <option>Importación</option>
            <option>Gasto Operativo</option>
            <option>Financiero</option>
          </select>
        </Label>
        <Label text="UDN">
          <select className={field} value={udn} onChange={(e) => setUdn(e.target.value as Compra["udn"])}>
            {[...UDNS, "General"].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </Label>
        {(tipo === "Compra" || tipo === "Importación") && (
          <fieldset className="col-span-2 grid grid-cols-[2fr_1fr] gap-3 rounded-[5px] border border-[#d6dce3] bg-[#fff] p-3">
            <legend className="px-1 text-[11px] font-semibold text-[#4b5563]">
              Repone stock (opcional)
            </legend>
            <Label text="Componente">
              <select className={field} value={comp} onChange={(e) => chooseComp(e.target.value)}>
                <option value="">Ninguno</option>
                {book.componentes.map((c) => (
                  <option key={c.cod} value={c.cod}>
                    {c.cod} · {c.desc} (stock {c.stock})
                  </option>
                ))}
              </select>
            </Label>
            <Label text="Cantidad">
              <input
                className={`${field} text-right`}
                inputMode="decimal"
                value={cant}
                disabled={!comp}
                onChange={(e) => {
                  setCant(e.target.value);
                  const q = Number(e.target.value);
                  if (componente && Number.isFinite(q)) setSub((componente.costo * q).toFixed(2));
                }}
              />
            </Label>
          </fieldset>
        )}
        <Label text="Proveedor" className="col-span-2">
          <input className={field} value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
        </Label>
        <Label text="Descripción" className="col-span-2">
          <input className={field} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Label>
        <Label text="Subtotal">
          <input className={`${field} text-right`} inputMode="decimal" value={sub} onChange={(e) => setSub(e.target.value)} />
        </Label>
        <label className="flex items-end gap-2 pb-2 text-[12px]">
          <input
            type="checkbox"
            checked={conIva && tipo !== "Financiero"}
            disabled={tipo === "Financiero"}
            onChange={(e) => setConIva(e.target.checked)}
            className="h-4 w-4 accent-[#217346]"
          />
          Con IVA 15 %
        </label>
      </div>
      <p className="mt-3 text-right text-[12px] tabular-nums">
        IVA {usd(iva)} · Total <b className="text-[#217346]">{usd(s + iva)}</b>
      </p>
      <Actions error={error} onCancel={onClose} onSave={save} />
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Nuevo cliente                                                       */
/* ------------------------------------------------------------------ */

/** Una cédula que pasa el dígito verificador, para probar el formulario. */
function cedulaDePrueba() {
  const d = [1, 7, Math.floor(Math.random() * 6), ...Array.from({ length: 6 }, () => Math.floor(Math.random() * 10))];
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let s = 0;
  d.forEach((x, i) => {
    let v = x * coef[i];
    if (v > 9) v -= 9;
    s += v;
  });
  return `${d.join("")}${s % 10 === 0 ? 0 : 10 - (s % 10)}`;
}

export function FormCliente({
  book,
  onClose,
  onSave,
}: {
  book: Book;
  onClose: () => void;
  onSave: (a: Action, result: SaveResult) => void;
}) {
  const [tipo, setTipo] = useState<"RUC" | "Cédula">("Cédula");
  const [id, setId] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [ciudad, setCiudad] = useState("Quito");
  const [error, setError] = useState("");

  const save = () => {
    const n = id.trim();
    if (tipo === "Cédula" && !cedulaValida(n)) return setError("Cédula inválida: revisa los 10 dígitos.");
    if (tipo === "RUC" && !rucValido(n)) return setError("RUC inválido: 13 dígitos terminados en 001.");
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (book.clientes.some((c) => c.id === n)) return setError("Ya existe un cliente con esa identificación.");
    if (correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return setError("Correo inválido.");
    onSave(
      {
        type: "cliente",
        cliente: {
          tipo,
          id: n,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          correo: correo.trim(),
          ciudad: ciudad.trim(),
          estado: "Activo",
        },
      },
      { msg: [`Cliente registrado: ${nombre.trim()}`] },
    );
  };

  return (
    <Dialog title="FormCliente · Nuevo cliente" onClose={onClose} width={480}>
      <div className="grid grid-cols-2 gap-3">
        <Label text="Tipo">
          <select className={field} value={tipo} onChange={(e) => setTipo(e.target.value as "RUC" | "Cédula")}>
            <option>Cédula</option>
            <option>RUC</option>
          </select>
        </Label>
        <Label text={tipo === "RUC" ? "RUC (13 dígitos)" : "Cédula (10 dígitos)"}>
          <input className={field} inputMode="numeric" value={id} onChange={(e) => setId(e.target.value.replace(/\D/g, ""))} />
        </Label>
        <button
          type="button"
          onClick={() => {
            const c = cedulaDePrueba();
            setId(tipo === "RUC" ? `${c}001` : c);
          }}
          className="col-span-2 -mt-1 justify-self-end text-[11.5px] font-semibold text-[#2f6fb2] hover:underline"
        >
          Usar un número de prueba válido
        </button>
        <Label text="Nombre / Razón social" className="col-span-2">
          <input className={field} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Label>
        <Label text="Teléfono">
          <input className={field} inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </Label>
        <Label text="Ciudad">
          <input className={field} value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </Label>
        <Label text="Correo" className="col-span-2">
          <input className={field} inputMode="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </Label>
      </div>
      <p className="mt-2 text-[11px] text-[#6b7280]">
        Valida el dígito verificador, como la macro `ValidarCedula` del archivo.
      </p>
      <Actions error={error} onCancel={onClose} onSave={save} />
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* MsgBox                                                              */
/* ------------------------------------------------------------------ */

export type Msg = { title: string; lines: string[]; kind: "info" | "warn" };

export function MsgBox({ msg, onClose }: { msg: Msg; onClose: () => void }) {
  return (
    <Dialog title={msg.title} onClose={onClose} width={420}>
      <div className="flex gap-3">
        <span
          aria-hidden
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-[#fff] ${
            msg.kind === "warn" ? "bg-[#e8a531]" : "bg-[#2f80c4]"
          }`}
        >
          {msg.kind === "warn" ? "!" : "i"}
        </span>
        <div className="space-y-1 pt-1">
          {msg.lines.map((l, i) => (
            <p key={i} className={i === 0 ? "font-semibold" : ""}>
              {l}
            </p>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-8 min-w-[88px] rounded-[4px] bg-[#217346] px-4 text-[12.5px] font-semibold text-[#fff] hover:bg-[#1a5c38]"
        >
          Aceptar
        </button>
      </div>
    </Dialog>
  );
}
