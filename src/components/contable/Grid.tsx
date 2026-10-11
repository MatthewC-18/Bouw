"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

/**
 * Hoja de datos con aspecto de Excel: letras de columna, números de fila,
 * celda activa con su dirección y su fórmula en la barra, edición en la
 * celda y flechas del teclado.
 *
 * Como en el archivo: filas 1 y 2 con el título del módulo, fila 3 con los
 * botones de las macros, fila 4 con los encabezados y los datos desde la 5.
 */

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const ROW_H = 24;
export const FIRST_ROW = 5;

export type Selection = { addr: string; content: string };

export type Col<T> = {
  key: string;
  head: string;
  w: number;
  align?: "left" | "right" | "center";
  /** Valor crudo: lo que muestra la barra de fórmulas si no hay fórmula. */
  get: (row: T) => string | number;
  /** Lo que se ve en la celda, si no es el valor tal cual. */
  show?: (row: T) => ReactNode;
  /** Fórmula equivalente, con `r` el número de fila de Excel. */
  formula?: (row: T, r: number) => string;
  /** Celda editable: devuelve false si el valor no vale. */
  edit?: (row: T, value: number) => boolean;
  cls?: (row: T) => string;
};

type Props<T> = {
  title: string;
  subtitle: string;
  buttons?: ReactNode;
  cols: Col<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowClass?: (row: T) => string;
  selectedKey?: string | null;
  onSelect: (sel: Selection, row: T | null) => void;
  /** Fila a la que saltar y que se ilumina (la recién guardada). */
  focusKey?: string | null;
  /** Filas vacías de relleno al final, para que parezca una hoja. */
  pad?: number;
};

/** Ilumina una celda cuando su valor cambia: las hojas están conectadas. */
function useChanged(value: string) {
  const prev = useRef(value);
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlash((f) => f + 1);
    }
  }, [value]);
  return flash;
}

function Cell<T>({
  col,
  row,
  r,
  active,
  editing,
  onPick,
  onEdit,
  onCommit,
  onCancel,
}: {
  col: Col<T>;
  row: T;
  r: number;
  active: boolean;
  editing: boolean;
  onPick: () => void;
  onEdit: () => void;
  onCommit: (v: string) => void;
  onCancel: () => void;
}) {
  const raw = col.get(row);
  const text = String(raw);
  const flash = useChanged(text);
  const input = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    }
  }, [editing]);

  const align =
    col.align === "right" ? "justify-end text-right" : col.align === "center" ? "justify-center" : "";

  return (
    <div
      role="gridcell"
      aria-selected={active}
      onMouseDown={onPick}
      onDoubleClick={col.edit ? onEdit : undefined}
      className={`relative flex items-center overflow-hidden whitespace-nowrap border-b border-r border-[#e3e3e3] px-1.5 tabular-nums ${align} ${
        col.edit ? "bg-[#fffbe8]" : ""
      } ${col.cls?.(row) ?? ""}`}
      style={{ width: col.w, minWidth: col.w, height: ROW_H }}
    >
      {flash > 0 && <span key={flash} aria-hidden className="xl-flash pointer-events-none absolute inset-0" />}
      {editing ? (
        <input
          ref={input}
          defaultValue={typeof raw === "number" ? String(raw) : text}
          inputMode="decimal"
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommit((e.target as HTMLInputElement).value);
            if (e.key === "Escape") onCancel();
            e.stopPropagation();
          }}
          onBlur={(e) => onCommit(e.target.value)}
          className="absolute inset-0 w-full bg-[#fff] px-1.5 text-right outline-none ring-2 ring-inset ring-[#217346]"
        />
      ) : (
        <span className="relative truncate">{col.show ? col.show(row) : text}</span>
      )}
      {active && !editing && (
        <span aria-hidden className="pointer-events-none absolute -inset-px border-2 border-[#217346]" />
      )}
    </div>
  );
}

export default function Grid<T>({
  title,
  subtitle,
  buttons,
  cols,
  rows,
  rowKey,
  rowClass,
  selectedKey,
  onSelect,
  focusKey,
  pad = 12,
}: Props<T>) {
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const totalW = 40 + cols.reduce((s, c) => s + c.w, 0);

  const describe = (ri: number, ci: number) => {
    const row = rows[ri];
    const col = cols[ci];
    const r = FIRST_ROW + ri;
    const addr = `${LETTERS[ci]}${r}`;
    const content = col.formula ? col.formula(row, r) : String(col.get(row));
    return { addr, content };
  };

  const pick = (ri: number, ci: number) => {
    setActive({ r: ri, c: ci });
    setEditing(false);
    onSelect(describe(ri, ci), rows[ri]);
  };

  // La fila recién guardada: se ve y queda seleccionada
  useEffect(() => {
    if (!focusKey) return;
    const ri = rows.findIndex((x) => rowKey(x) === focusKey);
    if (ri < 0) return;
    setActive({ r: ri, c: 0 });
    onSelect(describe(ri, 0), rows[ri]);
    const el = wrap.current?.querySelector<HTMLElement>(`[data-row="${ri}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    // `describe` y `onSelect` cambian en cada render; basta con la fila
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  // Si la fila activa desaparece (se borró), no queda una selección colgando
  useEffect(() => {
    if (active && active.r >= rows.length) setActive(null);
  }, [rows.length, active]);

  const commit = (value: string) => {
    if (!active) return;
    const col = cols[active.c];
    const row = rows[active.r];
    const n = Number(value.replace(",", "."));
    const ok = Boolean(col.edit) && Number.isFinite(n) && n >= 0 && col.edit!(row, n) !== false;
    setEditing(false);
    // La barra de fórmulas enseña ya el valor nuevo (la fila aún es la de antes)
    const d = describe(active.r, active.c);
    onSelect(ok && !col.formula ? { ...d, content: String(n) } : d, row);
    wrap.current?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (!active || editing || !rows.length) return;
    const move = (dr: number, dc: number) => {
      e.preventDefault();
      pick(
        Math.max(0, Math.min(rows.length - 1, active.r + dr)),
        Math.max(0, Math.min(cols.length - 1, active.c + dc)),
      );
    };
    if (e.key === "ArrowDown") move(1, 0);
    else if (e.key === "ArrowUp") move(-1, 0);
    else if (e.key === "ArrowRight" || e.key === "Tab") move(0, e.shiftKey ? -1 : 1);
    else if (e.key === "ArrowLeft") move(0, -1);
    else if ((e.key === "Enter" || e.key === "F2" || /^[0-9]$/.test(e.key)) && cols[active.c].edit) {
      e.preventDefault();
      setEditing(true);
    }
  };

  const letterW = (ci: number) => cols[ci]?.w ?? 90;
  const extraCols = 2;

  return (
    <div
      ref={wrap}
      tabIndex={0}
      onKeyDown={onKey}
      role="grid"
      aria-label={title}
      className="relative min-h-full outline-none"
      style={{ width: Math.max(totalW + 180, 900) }}
    >
      {/* Letras de columna, fijas arriba */}
      <div className="sticky top-0 z-20 flex h-[22px] border-b border-[#d4d4d4] bg-[#f5f5f5] text-[11px] text-[#666]">
        <div className="sticky left-0 z-10 w-10 shrink-0 border-r border-[#d4d4d4] bg-[#f5f5f5]" />
        {[...cols.map((_, i) => i), ...Array.from({ length: extraCols }, (_, i) => cols.length + i)].map((ci) => (
          <div
            key={ci}
            className={`flex shrink-0 items-center justify-center border-r border-[#e0e0e0] ${
              active?.c === ci ? "bg-[#d9eadf] font-semibold text-[#217346]" : ""
            }`}
            style={{ width: letterW(ci) }}
          >
            {LETTERS[ci]}
          </div>
        ))}
      </div>

      {/* Filas 1 a 3: título del módulo y botones de sus macros */}
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex" style={{ height: n === 3 ? 40 : n === 1 ? 34 : 22 }}>
          <div className="sticky left-0 z-10 flex w-10 shrink-0 items-center justify-center border-b border-r border-[#d4d4d4] bg-[#f5f5f5] text-[11px] text-[#666]">
            {n}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[#ececec] px-3">
            {n === 1 && (
              <span className="text-[17px] font-bold tracking-[0.12em] text-[#1f2b38]">
                BOUW <span className="px-1 text-[#9aa3ad]">·</span> {title}
              </span>
            )}
            {n === 2 && <span className="text-[12px] text-[#6b7280]">{subtitle}</span>}
            {n === 3 && <div className="flex flex-wrap items-center gap-2">{buttons}</div>}
          </div>
        </div>
      ))}

      {/* Fila 4: encabezados */}
      <div className="sticky top-[22px] z-10 flex" style={{ height: ROW_H + 2 }}>
        <div className="sticky left-0 z-10 flex w-10 shrink-0 items-center justify-center border-b border-r border-[#d4d4d4] bg-[#f5f5f5] text-[11px] text-[#666]">
          4
        </div>
        {cols.map((c) => (
          <div
            key={c.key}
            className={`flex shrink-0 items-center border-r border-[#2d3b4a] bg-[#1f2b38] px-1.5 text-[11.5px] font-semibold text-[#fff] ${
              c.align === "right" ? "justify-end" : c.align === "center" ? "justify-center" : ""
            }`}
            style={{ width: c.w }}
          >
            {c.head}
          </div>
        ))}
      </div>

      {/* Datos */}
      {rows.map((row, ri) => {
        const key = rowKey(row);
        const sel = selectedKey === key;
        return (
          <div
            key={key}
            data-row={ri}
            className={`flex text-[12.5px] text-[#1f2328] ${ri % 2 ? "bg-[#f3f8fe]" : "bg-[#fff]"} ${
              rowClass?.(row) ?? ""
            } ${sel ? "!bg-[#e3f1e8]" : ""}`}
          >
            <div
              className={`sticky left-0 z-10 flex w-10 shrink-0 items-center justify-center border-b border-r border-[#d4d4d4] text-[11px] ${
                active?.r === ri ? "bg-[#d9eadf] font-semibold text-[#217346]" : "bg-[#f5f5f5] text-[#666]"
              }`}
            >
              {FIRST_ROW + ri}
            </div>
            {cols.map((col, ci) => (
              <Cell
                key={col.key}
                col={col}
                row={row}
                r={FIRST_ROW + ri}
                active={active?.r === ri && active?.c === ci}
                editing={editing && active?.r === ri && active?.c === ci}
                onPick={() => pick(ri, ci)}
                onEdit={() => {
                  pick(ri, ci);
                  setEditing(true);
                }}
                onCommit={commit}
                onCancel={() => {
                  setEditing(false);
                  wrap.current?.focus();
                }}
              />
            ))}
          </div>
        );
      })}

      {/* Filas vacías: la hoja sigue */}
      {Array.from({ length: pad }, (_, i) => (
        <div key={`p${i}`} className="flex" style={{ height: ROW_H }}>
          <div className="sticky left-0 z-10 flex w-10 shrink-0 items-center justify-center border-b border-r border-[#d4d4d4] bg-[#f5f5f5] text-[11px] text-[#666]">
            {FIRST_ROW + rows.length + i}
          </div>
          {cols.map((c) => (
            <div key={c.key} className="shrink-0 border-b border-r border-[#ececec]" style={{ width: c.w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Botón de macro, con el estilo que el archivo pone a sus formas. */
export function MacroButton({
  children,
  onClick,
  kind = "secondary",
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  kind?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  title?: string;
}) {
  const look = {
    primary: "bg-[#1f2b38] text-[#fff] hover:bg-[#2c3d50] border-[#1f2b38]",
    secondary: "bg-[#fff] text-[#1f2b38] hover:bg-[#f1f4f7] border-[#c9d1da]",
    danger: "bg-[#fff] text-[#b42318] hover:bg-[#fdf0ef] border-[#e8b4ae]",
    ghost: "bg-transparent text-[#4b5563] hover:bg-[#eef1f4] border-transparent",
  }[kind];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-7 rounded-[5px] border px-3 text-[12px] font-semibold shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${look}`}
    >
      {children}
    </button>
  );
}
