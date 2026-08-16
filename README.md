# BOUW — sitio web

Sitio corporativo de **BOUW · Automation & Digital Solutions** (Quito · Monterrey).

Landing de una sola página con hero 3D, cursor personalizado y bilingüe ES/EN.

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
| Geometría de la "B" 3D | `src/components/three/logoShapes.ts` |
| Animación de la "B" 3D | `src/components/three/BouwMark.tsx` |
| Luces, partículas y bloom | `src/components/three/HeroScene.tsx` |
| Cursor personalizado | `src/components/Cursor.tsx` |
| Gráficos de cada proyecto | `src/components/ProjectVisual.tsx` |

## Cursor personalizado

Cualquier elemento puede cambiar el cursor con atributos:

```html
<a data-cursor="link">…</a>
<article data-cursor="view" data-cursor-label="Ver">…</article>
```

Estados disponibles: `link`, `view`, `text`. El cursor se desactiva solo en
pantallas táctiles y con `prefers-reduced-motion`.

## Pendientes

- [ ] Reemplazar los gráficos abstractos de `ProjectVisual.tsx` por capturas reales.
- [ ] Enlace público de cada proyecto (campo `href` en `PROJECTS`).
- [ ] Imagen OpenGraph (`/public/og.png`, 1200×630).
- [ ] Dominio propio y `SITE_URL`.
