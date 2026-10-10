"use client";

import { useEffect, useRef } from "react";

type Props = {
  /**
   * El `.mp4` (H.264). Al lado tiene que existir el mismo nombre en `.webm`
   * (VP9): va primero, y el mp4 queda para Safari antiguo e iOS. Hay Chromium
   * sin códecs propietarios —los de varias distribuciones de Linux, el de las
   * pruebas automáticas— y con solo el mp4 ahí el panel se queda en el póster.
   */
  src: string;
  poster: string;
  /** Texto para lectores de pantalla: qué se ve en el video. */
  label: string;
  className?: string;
};

/**
 * Video de panel: mudo, en bucle y solo mientras se ve.
 *
 * Hay tres en la página y cada uno decodifica cuadros aunque nadie lo mire.
 * Con la escena 3D repintando detrás, tres videos corriendo fuera de pantalla
 * son tres razones gratuitas para que el scroll pierda fluidez. Así que se
 * reproducen al entrar en la ventana y se pausan al salir.
 *
 * `preload="none"`: hasta que el panel se acerca, lo único que baja es el
 * póster. Y con movimiento reducido no arranca nunca — se queda el póster,
 * que es una foto de la misma toma.
 */
export default function LoopVideo({ src, poster, label, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // React pone `muted` como propiedad y no como atributo: en el HTML del
    // servidor no llega, y sin él el navegador rechaza el autoplay
    video.muted = true;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [src]);

  // Con `<source>` cambiar la ruta no recarga el video: la clave lo rehace
  // entero cuando cambia el idioma y con él el archivo
  return (
    <video
      key={src}
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      className={className}
    >
      <source src={src.replace(/\.mp4$/, ".webm")} type="video/webm" />
      <source src={src} type="video/mp4" />
    </video>
  );
}
