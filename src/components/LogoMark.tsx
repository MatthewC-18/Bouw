/**
 * Versión plana (SVG) de la marca BOUW, con la misma geometría que la 3D.
 * Se usa en la barra de navegación, el footer y el favicon.
 */
export default function LogoMark({
  className = "",
  title = "BOUW",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="-2 -3.15 3.95 6.3"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bouw-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b4c80" />
          <stop offset="100%" stopColor="#0d2947" />
        </linearGradient>
        <linearGradient id="bouw-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4fd6e8" />
          <stop offset="100%" stopColor="#1a97b3" />
        </linearGradient>
        <linearGradient id="bouw-orange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f79b4a" />
          <stop offset="100%" stopColor="#d5610f" />
        </linearGradient>
        <radialGradient id="bouw-teal-ball" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#8ff0f8" />
          <stop offset="55%" stopColor="#17a4b6" />
          <stop offset="100%" stopColor="#0b5f6b" />
        </radialGradient>
        <radialGradient id="bouw-orange-ball" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffd08a" />
          <stop offset="55%" stopColor="#ef8a22" />
          <stop offset="100%" stopColor="#a8480a" />
        </radialGradient>
      </defs>

      {/* Asta superior + flecha a la derecha */}
      <path
        d="M -1.8 -2.5 H 0.5 V -2.86 L 1.22 -2.125 L 0.5 -1.39 V -1.75 H -0.9 V -0.25 H -1.8 Z"
        fill="url(#bouw-navy)"
      />
      {/* Asta inferior */}
      <path
        d="M -1.8 0.25 H -0.9 V 1.75 H 0.2 V 2.5 H -1.8 Z"
        fill="url(#bouw-navy)"
      />
      {/* Panza superior */}
      <path
        d="M 0.2 -2.65 A 1.5 1.5 0 0 1 0.2 0.35 L 0.2 -0.2 A 0.95 0.95 0 0 0 0.2 -2.1 Z"
        fill="url(#bouw-cyan)"
      />
      {/* Panza inferior + flecha a la izquierda */}
      <path
        d="M 0.2 -0.35 A 1.5 1.5 0 0 1 0.2 2.65 L -0.5 2.65 L -0.5 2.97 L -1.28 2.375 L -0.5 1.78 L -0.5 2.1 L 0.2 2.1 A 0.95 0.95 0 0 0 0.2 0.2 Z"
        fill="url(#bouw-orange)"
      />

      {/* Circuito */}
      <g
        fill="none"
        stroke="#17a4b6"
        strokeWidth="0.17"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M -0.9 -0.95 H -0.59" />
        <path d="M -0.11 -0.95 C 0.25 -0.85 0.25 -0.25 0.1 0.15 L 0.1 0.61" />
        <path d="M -0.14 0.85 H -0.9" />
        <circle cx="-0.35" cy="-0.95" r="0.24" />
        <circle cx="0.1" cy="0.85" r="0.24" />
      </g>

      {/* Esferas */}
      <circle cx="1.31" cy="-1.668" r="0.44" fill="url(#bouw-teal-ball)" />
      <circle cx="1.31" cy="0.632" r="0.44" fill="url(#bouw-orange-ball)" />
    </svg>
  );
}
