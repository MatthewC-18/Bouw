/*
 * Dominio real del despliegue.
 *
 * Estaba en `bouw.vercel.app`, que resultó estar ocupado por otra cuenta: al
 * crear el proyecto Vercel asignó `bouw-eight`. Con la URL equivocada, el
 * `metadataBase` construía las canónicas y las tarjetas de Open Graph
 * apuntando al sitio de un desconocido — o sea que compartir un enlace de
 * BOUW llevaba a otra parte.
 *
 * Cuando haya dominio propio (bouw.ec o similar), se cambia solo aquí: lo
 * leen el `layout`, `robots.txt` y `sitemap.xml`.
 */
export const SITE_URL = "https://bouw-eight.vercel.app";
