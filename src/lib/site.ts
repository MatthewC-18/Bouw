/*
 * Dominio real del despliegue.
 *
 * Estaba en `bouw.vercel.app`, que resultó estar ocupado por otra cuenta: al
 * crear el proyecto Vercel asignó `bouw-eight`. Con la URL equivocada, el
 * `metadataBase` construía las canónicas y las tarjetas de Open Graph
 * apuntando al sitio de un desconocido — o sea que compartir un enlace de
 * BOUW llevaba a otra parte.
 *
 * 24 nov 2026: ya hay dominio propio, bouwlatam.com. La raíz redirige a
 * `www` (308), así que la dirección canónica es la de `www`. Se cambia solo
 * aquí: lo leen el `layout`, `robots.txt` y `sitemap.xml`.
 */
export const SITE_URL = "https://www.bouwlatam.com";
