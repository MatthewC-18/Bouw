import Image from "next/image";

/**
 * Marca BOUW: la palabra con el dragón posado en la W.
 *
 * Sustituye a la B de bloques, arcos y bolas, que ya no era el logo de la
 * empresa. El nuevo sale de un vector (Bouw/logo/, `web.py` lo exporta aquí):
 * el dragón es grabado fino y a los tamaños de la barra se dibuja mejor como
 * imagen rasterizada desde el vector que como SVG de 470 KB.
 *
 * `variant="dragon"` es el dragón solo, para la marca de agua: a ese tamaño y
 * con esa opacidad, la palabra repetida sobraría.
 */
const VARIANTS = {
  logo: { src: "/marca/bouw-logo-negativo.png", width: 720, height: 304 },
  dragon: { src: "/marca/bouw-dragon-blanco.png", width: 900, height: 648 },
} as const;

export default function LogoMark({
  className = "",
  title = "BOUW",
  variant = "logo",
  preload = false,
}: {
  className?: string;
  title?: string;
  variant?: keyof typeof VARIANTS;
  /** Next 16 cambió `priority` por `preload`: el logo de la barra lo lleva. */
  preload?: boolean;
}) {
  const v = VARIANTS[variant];
  return (
    <Image
      src={v.src}
      width={v.width}
      height={v.height}
      alt={variant === "dragon" ? "" : title}
      aria-hidden={variant === "dragon" ? true : undefined}
      preload={preload}
      className={className}
    />
  );
}
