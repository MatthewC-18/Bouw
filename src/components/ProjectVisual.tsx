/**
 * Gráficos abstractos por proyecto.
 *
 * Son SVG animados, no imágenes: pesan nada y se ven nítidos en cualquier
 * pantalla. Cuando lleguen las capturas reales de cada proyecto, se
 * reemplazan aquí sin tocar el resto del componente de proyectos.
 */

const STROKE = {
  cyan: "#22b5cf",
  cyanLight: "#4fd6e8",
  orange: "#e87722",
  orangeLight: "#f79b4a",
  navy: "#1f5488",
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

/** Fisio 3D — malla anatómica en alambre con nodos que pulsan. */
function FisioVisual() {
  const rings = [0, 1, 2, 3, 4, 5];
  return (
    <Frame>
      <g
        fill="none"
        stroke={STROKE.cyan}
        strokeWidth="0.7"
        opacity="0.55"
        transform="translate(200 150)"
      >
        {rings.map((i) => (
          <ellipse
            key={`v-${i}`}
            rx={92}
            ry={92}
            transform={`rotate(${(180 / rings.length) * i}) scale(${
              Math.cos((Math.PI / rings.length) * i) * 0.95 + 0.05
            } 1)`}
          />
        ))}
        {[-60, -30, 0, 30, 60].map((y) => (
          <ellipse
            key={`h-${y}`}
            cy={y}
            rx={Math.sqrt(Math.max(92 * 92 - y * y, 1))}
            ry={Math.sqrt(Math.max(92 * 92 - y * y, 1)) * 0.22}
          />
        ))}
      </g>
      <g transform="translate(200 150)">
        {[
          [62, -46],
          [-70, 24],
          [16, 78],
          [-24, -70],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.5" fill={STROKE.cyanLight}>
            <animate
              attributeName="r"
              values="3.5;7;3.5"
              dur="2.6s"
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="1;0.35;1"
              dur="2.6s"
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>
    </Frame>
  );
}

/** Dispositivos médicos — plano técnico con cotas. */
function DeviceVisual() {
  return (
    <Frame>
      <g stroke={STROKE.navy} strokeWidth="0.6" opacity="0.5">
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`x${i}`} x1={i * 32} y1="0" x2={i * 32} y2="300" />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`y${i}`} x1="0" y1={i * 32} x2="400" y2={i * 32} />
        ))}
      </g>
      <g fill="none" stroke={STROKE.cyan} strokeWidth="1.6">
        <rect x="110" y="96" width="180" height="108" rx="14" />
        <rect x="132" y="118" width="88" height="64" rx="6" opacity="0.7" />
        <circle cx="256" cy="150" r="18" />
        <circle cx="256" cy="150" r="7" fill={STROKE.cyanLight} stroke="none">
          <animate
            attributeName="opacity"
            values="1;0.2;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
      <g stroke={STROKE.orange} strokeWidth="1" opacity="0.9">
        <line x1="110" y1="76" x2="290" y2="76" />
        <line x1="110" y1="70" x2="110" y2="82" />
        <line x1="290" y1="70" x2="290" y2="82" />
        <line x1="308" y1="96" x2="308" y2="204" />
        <line x1="302" y1="96" x2="314" y2="96" />
        <line x1="302" y1="204" x2="314" y2="204" />
      </g>
      <text
        x="200"
        y="68"
        textAnchor="middle"
        fill={STROKE.orangeLight}
        fontSize="11"
        fontFamily="ui-monospace, monospace"
      >
        ±0.01
      </text>
    </Frame>
  );
}

/** Sistema contable — hoja de cálculo que se convierte en reporte. */
function LedgerVisual() {
  const bars = [58, 92, 44, 118, 76, 138, 100];
  return (
    <Frame>
      <g opacity="0.35">
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={`r${i}`}
            x1="40"
            y1={40 + i * 28}
            x2="180"
            y2={40 + i * 28}
            stroke={STROKE.navy}
            strokeWidth="1"
          />
        ))}
        {[40, 96, 152, 180].map((x) => (
          <line
            key={`c${x}`}
            x1={x}
            y1="40"
            x2={x}
            y2="236"
            stroke={STROKE.navy}
            strokeWidth="1"
          />
        ))}
      </g>
      <g fill={STROKE.orange} opacity="0.85">
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x="46" y={48 + i * 28} width={i % 3 === 0 ? 40 : 26} height="6" rx="3" />
        ))}
      </g>
      <path
        d="M186 138 L212 138"
        stroke={STROKE.cyanLight}
        strokeWidth="1.6"
        markerEnd=""
      />
      <path
        d="M206 132 L216 138 L206 144 Z"
        fill={STROKE.cyanLight}
      />
      <g>
        {bars.map((h, i) => (
          <rect
            key={i}
            x={228 + i * 22}
            y={236 - h}
            width="13"
            height={h}
            rx="3"
            fill={i === 5 ? STROKE.orange : STROKE.cyan}
            opacity={0.85}
          >
            <animate
              attributeName="height"
              values={`${h * 0.55};${h};${h * 0.55}`}
              dur="4s"
              begin={`${i * 0.18}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="y"
              values={`${236 - h * 0.55};${236 - h};${236 - h * 0.55}`}
              dur="4s"
              begin={`${i * 0.18}s`}
              repeatCount="indefinite"
            />
          </rect>
        ))}
      </g>
      <line x1="222" y1="236" x2="384" y2="236" stroke={STROKE.navy} strokeWidth="1.4" />
    </Frame>
  );
}

/** Charms — piezas de catálogo flotando. */
function CharmsVisual() {
  return (
    <Frame>
      <defs>
        <linearGradient id="charm-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={STROKE.orangeLight} stopOpacity="0.9" />
          <stop offset="100%" stopColor={STROKE.orange} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="charm-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={STROKE.cyanLight} stopOpacity="0.9" />
          <stop offset="100%" stopColor={STROKE.cyan} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {[
        { x: 74, y: 78, w: 84, h: 108, fill: "url(#charm-b)", d: 0 },
        { x: 158, y: 58, w: 84, h: 108, fill: "url(#charm-a)", d: 0.6 },
        { x: 242, y: 92, w: 84, h: 108, fill: "url(#charm-b)", d: 1.2 },
      ].map((c, i) => (
        <g key={i}>
          <rect
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            rx="12"
            fill={c.fill}
            stroke="rgba(255,255,255,0.16)"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 0 -10; 0 0"
              dur="5s"
              begin={`${c.d}s`}
              repeatCount="indefinite"
            />
          </rect>
        </g>
      ))}
      <g fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2">
        <circle cx="116" cy="118" r="16" />
        <circle cx="200" cy="98" r="16" />
        <circle cx="284" cy="132" r="16" />
      </g>
      <rect x="74" y="216" width="252" height="8" rx="4" fill="rgba(255,255,255,0.08)" />
      <rect x="74" y="216" width="96" height="8" rx="4" fill={STROKE.orange} />
    </Frame>
  );
}

export default function ProjectVisual({ slug }: { slug: string }) {
  switch (slug) {
    case "fisio-3d":
      return <FisioVisual />;
    case "dispositivos-medicos":
      return <DeviceVisual />;
    case "sistema-contable":
      return <LedgerVisual />;
    case "charms-ecuador":
      return <CharmsVisual />;
    default:
      return null;
  }
}
