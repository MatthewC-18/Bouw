# BOUW — sitio web

Sitio corporativo de **BOUW · Automation & Digital Solutions** (Quito · Monterrey).

Landing de una sola página con hero 3D, cursor personalizado y bilingüe ES/EN,
más una página por caso completo en `/proyectos/<slug>`.

## Stack

| Pieza | Qué es |
| --- | --- |
| Next.js 16 (App Router) + TypeScript | framework y tipado |
| Tailwind CSS 4 | estilos, tokens de marca en `globals.css` |
| React Three Fiber + drei + postprocessing | escena 3D del hero |
| Sin backend | el formulario abre correo o WhatsApp |

## Correr en local

```bash
npm install
```

```bash
npm run dev
```

Abre <http://localhost:3000>.

## Build de producción

```bash
npm run build
```

## Desplegar en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel: **New Project → Import Git Repository**.
3. Framework preset: **Next.js**. No hace falta configurar nada más.
4. Deploy. Vercel detecta `next build` automáticamente.

Después de conectar el dominio real, actualiza `SITE_URL` en
`src/app/layout.tsx` para que los metadatos de OpenGraph apunten ahí.

## Dónde editar qué

| Quieres cambiar… | Archivo |
| --- | --- |
| Todo el texto, ES y EN | `src/lib/content.ts` |
| Proyectos (títulos, tags, año, enlaces) | `PROJECTS` en `src/lib/content.ts` |
| Datos de contacto y sedes | `COMPANY` en `src/lib/content.ts` |
| Colores de marca y tipografías | `@theme` en `src/app/globals.css` |
| El dragón y sus perchas | `src/components/three/Dragon.tsx`, `perch.ts` |
| La palabra BOUW 3D de la portada | `src/components/three/WordMark.tsx` |
| Modo claro y oscuro | `src/lib/theme.ts` y `:root[data-theme]` en `globals.css` |
| Gráficos de cada proyecto | `src/components/ProjectVisual.tsx` |
| Casos completos (texto, DMAIC, galería) | `CASES` en `src/lib/content.ts` |
| Página de caso | `src/components/CaseStudy.tsx` → `/proyectos/<slug>` |
| Videos en bucle de los paneles | `src/components/LoopVideo.tsx` |

## Videos

Cada video vive en `public/proyectos/` en dos archivos con el mismo nombre:
`.webm` (VP9, va primero) y `.mp4` (H.264, para Safari antiguo e iOS).
`LoopVideo` busca el `.webm` cambiando la extensión del `.mp4`, así que si se
agrega uno nuevo hacen falta los dos:

```bash
ffmpeg -i video.mp4 -c:v libvpx-vp9 -b:v 0 -crf 37 -row-mt 1 -an video.webm
```

Sin audio a propósito: los videos arrancan solos y mudos, y solo mientras
se ven. Los rótulos que van encima de una foto o un video llevan sombra
oscura en los dos modos: sobre una imagen, el crema del modo claro la lava.

El video de `Programa contable` es una réplica animada de las hojas del
archivo, grabada cuadro a cuadro, con datos de demostración: los RUC, los
nombres de clientes y la marca del cliente no aparecen.

## Pendientes

- [x] Programa contable: el dibujo del libro mayor se cambió por el video del archivo.
- [ ] Dispositivo médico: sigue con el plano dibujado en `ProjectVisual.tsx`.
- [ ] Enlace público de cada proyecto (campo `href` en `PROJECTS`).
- [x] Imagen OpenGraph (`src/app/opengraph-image.png`).
- [ ] Dominio propio y `SITE_URL`.
