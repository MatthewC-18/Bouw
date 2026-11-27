"use client";

import { useLang } from "@/lib/i18n";

/**
 * Los paneles de los dos proyectos de cliente sin nombre (25 nov 2026).
 *
 * No hay capturas: las de verdad llevan su marca, sus productos y sus
 * precios. Se dibujan con código, con datos de ejemplo y sin nada que
 * delate al cliente, y la ficha lo dice («Datos de ejemplo»). Las cifras que
 * sí son del trabajo (266 páginas, 394 casos) son las mismas de `content.ts`.
 *
 * Los rótulos van en el idioma del visitante.
 *
 * SVG estático, en los colores de la ficha (`--p-*`): nada se anima por
 * fotograma (ver la nota de `ProjectVisual` sobre el SVG que se repinta).
 */

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
const sans = "var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif";

const ink = { fill: "var(--color-ink)" };
const soft = { fill: "var(--color-ink-soft)" };
const dim = { fill: "var(--color-ink-dim)" };
const accent = { fill: "var(--p-accent)" };

function Grid() {
  return (
    <g strokeWidth="0.5" style={{ stroke: "var(--p-line)" }} opacity="0.55">
      {Array.from({ length: 33 }, (_, i) => (
        <line key={`x${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" />
      ))}
      {Array.from({ length: 21 }, (_, i) => (
        <line key={`y${i}`} x1="0" y1={i * 20} x2="640" y2={i * 20} />
      ))}
    </g>
  );
}

/** Renglones de texto de una página: barras finas de largo variable. */
function Lines({ x, y, w, n, gap = 9, seed = 0 }: { x: number; y: number; w: number; n: number; gap?: number; seed?: number }) {
  return (
    <g style={{ fill: "var(--color-ink-dim)" }} opacity="0.55">
      {Array.from({ length: n }, (_, i) => {
        const k = ((i * 7 + seed * 3) % 5) / 10;
        const last = i === n - 1;
        return <rect key={i} x={x} y={y + i * gap} width={w * (last ? 0.55 : 0.92 - k * 0.3)} height="3" rx="1.5" />;
      })}
    </g>
  );
}

/**
 * Guía técnica: el libro abierto en una doble página y, al lado, la salida
 * del control de calidad que tiene que dar cero avisos antes de entregar.
 */
export function BookVisual() {
  const es = useLang().lang === "es";
  const page = { fill: "var(--p-window)", stroke: "var(--p-line)" };
  return (
    <svg viewBox="0 0 640 400" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <Grid />

      {/* El lomo: hojas debajo, para que se lea como libro y no como hoja */}
      <g style={page} strokeWidth="1">
        <rect x="52" y="66" width="300" height="232" rx="3" opacity="0.5" />
        <rect x="47" y="61" width="300" height="232" rx="3" opacity="0.75" />
      </g>

      {/* Doble página */}
      <g strokeWidth="1.2" style={page}>
        <rect x="40" y="54" width="152" height="232" rx="3" />
        <rect x="192" y="54" width="152" height="232" rx="3" />
      </g>
      <line x1="192" y1="54" x2="192" y2="286" strokeWidth="1" style={{ stroke: "var(--p-accent)" }} opacity="0.6" />

      {/* Página izquierda: banda, título y texto */}
      <rect x="40" y="54" width="152" height="10" style={accent} opacity="0.85" />
      <rect x="54" y="80" width="96" height="8" rx="2" style={ink} opacity="0.85" />
      <rect x="54" y="93" width="64" height="8" rx="2" style={ink} opacity="0.85" />
      <Lines x={54} y={114} w={124} n={7} seed={1} />
      <rect x="54" y="184" width="124" height="54" rx="4" fill="none" strokeWidth="1" strokeDasharray="3 3" style={{ stroke: "var(--p-accent)" }} />
      <Lines x={64} y={196} w={104} n={4} gap={9} seed={3} />
      <text x="54" y="276" fontSize="8" fontFamily={mono} style={dim}>136</text>

      {/* Página derecha: un plano con cotas y su pie */}
      <rect x="192" y="54" width="152" height="10" style={accent} opacity="0.85" />
      <g fill="none" strokeWidth="1.3" style={{ stroke: "var(--p-accent)" }}>
        <rect x="214" y="86" width="108" height="78" />
        <line x1="214" y1="125" x2="322" y2="125" opacity="0.6" />
        <line x1="268" y1="86" x2="268" y2="164" opacity="0.6" />
        <rect x="282" y="138" width="22" height="26" opacity="0.8" />
      </g>
      <g strokeWidth="0.8" style={{ stroke: "var(--color-ink-dim)" }}>
        <line x1="214" y1="176" x2="322" y2="176" />
        <line x1="214" y1="172" x2="214" y2="180" />
        <line x1="322" y1="172" x2="322" y2="180" />
        <line x1="332" y1="86" x2="332" y2="164" />
        <line x1="328" y1="86" x2="336" y2="86" />
        <line x1="328" y1="164" x2="336" y2="164" />
      </g>
      <text x="268" y="190" fontSize="7.5" fontFamily={mono} textAnchor="middle" style={dim}>{es ? "6,00 m" : "6.00 m"}</text>
      <Lines x={206} y={204} w={124} n={5} seed={2} />
      <text x="330" y="276" fontSize="8" fontFamily={mono} textAnchor="end" style={dim}>137</text>

      {/* La consola del control de calidad */}
      <g>
        <rect x="372" y="54" width="232" height="232" rx="8" style={{ fill: "var(--p-window)", stroke: "var(--p-line)" }} strokeWidth="1" />
        <rect x="372" y="54" width="232" height="26" rx="8" style={{ fill: "var(--p-chip)" }} />
        <circle cx="388" cy="67" r="3" style={{ fill: "var(--p-line)" }} />
        <circle cx="399" cy="67" r="3" style={{ fill: "var(--p-line)" }} />
        <circle cx="410" cy="67" r="3" style={{ fill: "var(--p-line)" }} />
        <text x="426" y="70.5" fontSize="9" fontFamily={mono} style={dim}>{es ? "control de calidad" : "quality check"}</text>

        <g fontSize="10" fontFamily={mono}>
          {(es
            ? [
                ["páginas", "266"],
                ["solapes", "0"],
                ["letra bajo 10 pt", "0"],
                ["fidelidad del texto", "ok"],
                ["rótulos en su sitio", "ok"],
              ]
            : [
                ["pages", "266"],
                ["overlaps", "0"],
                ["type under 10 pt", "0"],
                ["text fidelity", "ok"],
                ["labels in place", "ok"],
              ]
          ).map(([k, v], i) => (
            <g key={k}>
              <text x="388" y={104 + i * 21} style={soft}>{k}</text>
              <text x="588" y={104 + i * 21} textAnchor="end" style={v === "ok" ? accent : ink}>{v}</text>
            </g>
          ))}
        </g>
        <line x1="388" y1="206" x2="588" y2="206" strokeWidth="0.8" style={{ stroke: "var(--p-line)" }} />
        <text x="388" y="228" fontSize="12" fontFamily={mono} fontWeight="700" style={accent}>{es ? "avisos" : "warnings"}</text>
        <text x="588" y="228" fontSize="12" fontFamily={mono} fontWeight="700" textAnchor="end" style={accent}>0</text>
        <text x="388" y="254" fontSize="9" fontFamily={mono} style={dim}>{es ? "→ impreso.pdf" : "→ print.pdf"}</text>
        <text x="388" y="270" fontSize="9" fontFamily={mono} style={dim}>→ digital.pdf</text>
      </g>

      <text x="40" y="320" fontSize="10" fontFamily={sans} style={dim}>
        {es
          ? "Un solo texto · dos versiones · cero avisos antes de entregar"
          : "One text · two editions · zero warnings before delivery"}
      </text>
    </svg>
  );
}

/**
 * Cotizador web: la pantalla de una cotización con productos genéricos y, al
 * lado, la validación del motor contra el Excel (394 casos).
 */
export function QuoteVisual() {
  const es = useLang().lang === "es";
  // Cifras de ejemplo; en inglés, con punto decimal
  const n = (v: string) => (es ? v : v.replace(/[.,]/g, (c) => (c === "." ? "," : ".")));
  const rows: [string, string, string, string][] = [
    [es ? "Producto A" : "Product A", "12", "48,50", "582,00"],
    [es ? "Producto B" : "Product B", "30", "7,20", "216,00"],
    [es ? "Producto C" : "Product C", "4", "95,00", "380,00"],
    [es ? "Instalación" : "Installation", "1", "150,00", "150,00"],
  ];
  const panel = { fill: "var(--p-window)", stroke: "var(--p-line)" };
  return (
    <svg viewBox="0 0 640 400" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <Grid />

      {/* La aplicación */}
      <rect x="28" y="34" width="584" height="332" rx="10" style={panel} strokeWidth="1" />

      {/* Menú */}
      <rect x="28" y="34" width="120" height="332" rx="10" style={{ fill: "var(--p-chip)" }} />
      <text x="44" y="62" fontSize="12" fontFamily={sans} fontWeight="700" style={ink}>{es ? "Cotizador" : "Quotes"}</text>
      {(es ? ["Nueva cotización", "Historial", "Catálogo", "Reglas", "Usuarios"] : ["New quote", "History", "Catalog", "Rules", "Users"]).map((m, i) => (
        <g key={m}>
          {i === 0 && <rect x="36" y={80 + i * 26} width="104" height="20" rx="5" style={{ fill: "var(--p-accent)" }} opacity="0.18" />}
          <text x="46" y={94 + i * 26} fontSize="9.5" fontFamily={sans} style={i === 0 ? accent : soft}>{m}</text>
        </g>
      ))}
      <text x="44" y="350" fontSize="8.5" fontFamily={mono} style={dim}>{es ? "perfil · asesor" : "role · sales rep"}</text>

      {/* Cabecera de la cotización */}
      <text x="166" y="64" fontSize="13" fontFamily={sans} fontWeight="700" style={ink}>{es ? "Cotización 2026-0142" : "Quote 2026-0142"}</text>
      <rect x="470" y="50" width="124" height="20" rx="10" style={{ fill: "var(--p-chip)", stroke: "var(--p-line)" }} strokeWidth="1" />
      <text x="532" y="63.5" fontSize="8.5" fontFamily={mono} textAnchor="middle" style={dim}>{es ? "datos de ejemplo" : "sample data"}</text>

      {/* Tabla */}
      <g fontFamily={mono} fontSize="9.5">
        {(es ? ["Ítem", "Cant.", "P. unit.", "Total"] : ["Item", "Qty", "Unit", "Total"]).map((h, i) => (
          <text key={h} x={[166, 340, 410, 480][i]} y="96" textAnchor={i === 0 ? "start" : "end"} style={dim}>
            {h}
          </text>
        ))}
        <line x1="166" y1="104" x2="480" y2="104" strokeWidth="0.8" style={{ stroke: "var(--p-line)" }} />
        {rows.map((r, j) => (
          <g key={r[0]}>
            <text x="166" y={124 + j * 22} style={soft}>{r[0]}</text>
            <text x="340" y={124 + j * 22} textAnchor="end" style={soft}>{r[1]}</text>
            <text x="410" y={124 + j * 22} textAnchor="end" style={soft}>{n(r[2])}</text>
            <text x="480" y={124 + j * 22} textAnchor="end" style={ink}>{n(r[3])}</text>
          </g>
        ))}
        <line x1="166" y1="206" x2="480" y2="206" strokeWidth="0.8" style={{ stroke: "var(--p-line)" }} />
        <text x="410" y="226" textAnchor="end" style={dim}>Subtotal</text>
        <text x="480" y="226" textAnchor="end" style={ink}>{n("1.328,00")}</text>
        <text x="410" y="246" textAnchor="end" style={dim}>{es ? "IVA 15 %" : "VAT 15%"}</text>
        <text x="480" y="246" textAnchor="end" style={ink}>{n("199,20")}</text>
        <text x="410" y="272" textAnchor="end" fontSize="11" fontWeight="700" style={ink}>Total USD</text>
        <text x="480" y="272" textAnchor="end" fontSize="11" fontWeight="700" style={accent}>{n("1.527,20")}</text>
      </g>

      {/* Botón */}
      <rect x="166" y="300" width="112" height="30" rx="15" style={{ fill: "var(--p-accent)" }} />
      <text x="222" y="319" fontSize="10" fontFamily={sans} fontWeight="700" textAnchor="middle" style={{ fill: "var(--p-on-accent)" }}>
        {es ? "Generar PDF" : "Generate PDF"}
      </text>
      <text x="292" y="319" fontSize="8.5" fontFamily={mono} style={dim}>{es ? "queda en el registro" : "logged"}</text>

      {/* La validación del motor */}
      <rect x="500" y="86" width="96" height="130" rx="8" style={{ fill: "var(--p-chip)", stroke: "var(--p-line)" }} strokeWidth="1" />
      <text x="548" y="106" fontSize="8" fontFamily={mono} textAnchor="middle" style={dim}>{es ? "motor contra Excel" : "engine vs Excel"}</text>
      <text x="548" y="146" fontSize="28" fontFamily={sans} fontWeight="700" textAnchor="middle" style={accent}>394</text>
      <text x="548" y="164" fontSize="8.5" fontFamily={mono} textAnchor="middle" style={soft}>{es ? "casos comparados" : "cases checked"}</text>
      <text x="548" y="180" fontSize="8.5" fontFamily={mono} textAnchor="middle" style={soft}>{es ? "al centavo" : "to the cent"}</text>
      <path d="M534 196 l8 8 l16 -16" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--p-accent)" }} />
    </svg>
  );
}
