/**
 * Gráficos técnicos para los proyectos que no tienen foto.
 *
 * Son SVG, no imágenes: pesan nada y se ven nítidos en cualquier pantalla.
 * Cuando lleguen capturas reales, se reemplazan por el campo `image` del
 * proyecto en `content.ts` y estos dejan de usarse.
 */

const C = {
  cyan: "#22b5cf",
  cyanLight: "#4fd6e8",
  orange: "#e87722",
  orangeLight: "#f79b4a",
  navy: "#1f5488",
  dim: "#6d86a4",
} as const;

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Dispositivo médico: plano de taller con cotas y tolerancia. */
function DeviceVisual() {
  return (
    <Frame>
      <g stroke={C.navy} strokeWidth="0.5" opacity="0.4">
        {Array.from({ length: 21 }, (_, i) => (
          <line key={`x${i}`} x1={i * 20} y1="0" x2={i * 20} y2="300" />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`y${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} />
        ))}
      </g>

      {/* Cuerpo del dispositivo */}
      <g fill="none" stroke={C.cyan} strokeWidth="1.6" strokeLinejoin="round">
        <path d="M108 112 h122 a26 26 0 0 1 26 26 v34 a26 26 0 0 1 -26 26 h-122 a14 14 0 0 1 -14 -14 v-58 a14 14 0 0 1 14 -14 z" />
        <path d="M124 132 h64 v48 h-64 z" opacity="0.65" />
        <path d="M256 142 h26 v26 h-26" />
        <circle cx="222" cy="155" r="13" />
      </g>
      <circle cx="222" cy="155" r="5" fill={C.cyanLight}>
        <animate
          attributeName="opacity"
          values="1;0.15;1"
          dur="2.2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Línea de eje */}
      <line
        x1="70"
        y1="155"
        x2="330"
        y2="155"
        stroke={C.dim}
        strokeWidth="0.7"
        strokeDasharray="10 4 2 4"
        opacity="0.7"
      />

      {/* Cotas */}
      <g stroke={C.orange} strokeWidth="0.9" opacity="0.95">
        <line x1="94" y1="92" x2="256" y2="92" />
        <line x1="94" y1="86" x2="94" y2="98" />
        <line x1="256" y1="86" x2="256" y2="98" />
        <line x1="286" y1="112" x2="286" y2="198" />
        <line x1="280" y1="112" x2="292" y2="112" />
        <line x1="280" y1="198" x2="292" y2="198" />
      </g>

      <g
        fill={C.orangeLight}
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        <text x="175" y="84" textAnchor="middle">
          162.00 ±0.01
        </text>
        <text x="298" y="158">
          86.0
        </text>
      </g>

      <g
        fill={C.dim}
        fontSize="9"
        fontFamily="ui-monospace, monospace"
        opacity="0.9"
      >
        <text x="22" y="270">ESC 1:1</text>
        <text x="22" y="284">REV C · VALIDADO</text>
        <text x="378" y="284" textAnchor="end">ISO 13485</text>
      </g>
    </Frame>
  );
}

/** Programa contable: las hojas reales del libro y su tablero. */
function LedgerVisual() {
  const bars = [46, 78, 58, 104, 88, 132, 112];
  const sheets = ["MENU", "VENTAS", "KITS", "DASHBOARD", "REPORTES"];

  return (
    <Frame>
      {/* Ventana del libro */}
      <rect
        x="26"
        y="30"
        width="348"
        height="216"
        rx="8"
        fill="rgba(9,26,46,0.9)"
        stroke="rgba(255,255,255,0.12)"
      />
      <rect x="26" y="30" width="348" height="24" rx="8" fill="rgba(31,84,136,0.35)" />
      <text
        x="40"
        y="47"
        fill={C.dim}
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        Programa_contable.xlsm
      </text>

      {/* Cuadrícula de la hoja */}
      <g stroke="rgba(109,134,164,0.28)" strokeWidth="0.7">
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`r${i}`} x1="40" y1={78 + i * 22} x2="180" y2={78 + i * 22} />
        ))}
        {[40, 92, 140, 180].map((x) => (
          <line key={`c${x}`} x1={x} y1="66" x2={x} y2="210" />
        ))}
        <line x1="40" y1="66" x2="180" y2="66" />
      </g>
      <rect x="40" y="66" width="140" height="12" fill="rgba(34,181,207,0.22)" />

      <g fill={C.orange} opacity="0.8">
        {Array.from({ length: 6 }, (_, i) => (
          <rect
            key={i}
            x="46"
            y={84 + i * 22}
            width={i % 3 === 0 ? 38 : 24}
            height="5"
            rx="2.5"
          />
        ))}
      </g>
      <g fill={C.cyan} opacity="0.55">
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x="98" y={84 + i * 22} width="30" height="5" rx="2.5" />
        ))}
      </g>

      {/* Flecha macro */}
      <g>
        <line x1="190" y1="140" x2="212" y2="140" stroke={C.cyanLight} strokeWidth="1.6" />
        <path d="M206 134 L218 140 L206 146 Z" fill={C.cyanLight} />
        <text
          x="204"
          y="128"
          textAnchor="middle"
          fill={C.dim}
          fontSize="8"
          fontFamily="ui-monospace, monospace"
        >
          VBA
        </text>
      </g>

      {/* Tablero */}
      <g>
        {bars.map((h, i) => (
          <rect
            key={i}
            x={232 + i * 20}
            y={210 - h}
            width="12"
            height={h}
            rx="2.5"
            fill={i === 5 ? C.orange : C.cyan}
            opacity="0.85"
          >
            <animate
              attributeName="height"
              values={`${h * 0.5};${h};${h * 0.5}`}
              dur="4.4s"
              begin={`${i * 0.16}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="y"
              values={`${210 - h * 0.5};${210 - h};${210 - h * 0.5}`}
              dur="4.4s"
              begin={`${i * 0.16}s`}
              repeatCount="indefinite"
            />
          </rect>
        ))}
        <line x1="226" y1="210" x2="364" y2="210" stroke={C.dim} strokeWidth="1" opacity="0.6" />
      </g>

      {/* Pestañas del libro */}
      <g fontSize="8" fontFamily="ui-monospace, monospace">
        {sheets.map((s, i) => {
          const w = s.length * 5.4 + 12;
          const x = 30 + sheets.slice(0, i).reduce((acc, p) => acc + p.length * 5.4 + 16, 0);
          return (
            <g key={s}>
              <rect
                x={x}
                y="252"
                width={w}
                height="16"
                rx="3"
                fill={i === 3 ? "rgba(34,181,207,0.22)" : "rgba(255,255,255,0.05)"}
                stroke={i === 3 ? C.cyan : "rgba(255,255,255,0.1)"}
                strokeWidth="0.8"
              />
              <text
                x={x + w / 2}
                y="263"
                textAnchor="middle"
                fill={i === 3 ? C.cyanLight : C.dim}
              >
                {s}
              </text>
            </g>
          );
        })}
      </g>
    </Frame>
  );
}

export default function ProjectVisual({ kind }: { kind: "device" | "ledger" }) {
  return kind === "device" ? <DeviceVisual /> : <LedgerVisual />;
}
