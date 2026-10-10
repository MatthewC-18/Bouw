# Marca BOUW

**Fecha:** 2026-09-06
**Prueba:** `guia-ideal-alambrec/sistema/marca/bouw-sello-final.png`

---

## Los archivos

```
bouw-sello.svg           PRINCIPAL. Sello azul, letra blanca y cian
bouw-sello-claro.svg     Sobre fondo oscuro o sobre imagen
bouw-sello-tinta.svg     Una sola tinta: caucho, grabado, prensa a un color
bouw-marca.svg           Secundaria. La letra suelta, sin sello
bouw-marca-tinta.svg     Secundaria a una tinta
```

Todas vectoriales y planas. **Sin degradados a propósito**: a los tamaños en que
se usa una marca de estudio no se ven, y en impresión dan problemas.

## Por qué el sello

La marca pasó por tres estados, y cada cambio salió de una prueba, no de una
opinión.

**El logo anterior** tenía cinco ideas compitiendo —bloques, dos arcos, flechas,
un grafo de nodos y dos bolas— y cuatro colores con degradado. A 9 mm, que es
donde vive una marca de estudio, era una mancha con dos manchas de color.

**La letra suelta** resolvió la legibilidad pero se quedó anónima: una B con un
hueco es correcta y no dice nada. Sin presencia.

**El sello la resuelve, y de paso rescata el concepto.** El círculo da masa —la
marca ocupa un área, no una silueta— y además **es** el ciclo. Hace el trabajo
que no podía hacer una punta de flecha: a 9 mm una flecha desaparece; un círculo,
no.

## La decisión sobre la punta de flecha

Se probaron cinco maneras de rematar el arco con una punta y ninguna funcionó,
por una razón que se puede medir: **una punta lo bastante pequeña para no
deformar la letra desaparece a 9 mm, y una lo bastante grande para verse rompe
la silueta.** El hueco entre los boceles hace ese trabajo sin coste.

## Corrección óptica en la versión suelta a una tinta

La versión a dos tintas aguanta un hueco de 7 unidades porque el color ata el
asta con los boceles. **En una sola tinta ese mismo hueco hace que la B se lea
«IB»**, así que ahí el hueco se cierra a 3. No son dos marcas: es la misma
corregida para su medio, como se hace en tipografía.

## Reglas

| | |
|---|---|
| **Tamaño mínimo** | 9 mm de diámetro en impreso · 32 px en pantalla |
| **Área de respeto** | Un cuarto del diámetro, todo alrededor |
| **Fondo claro** | `bouw-sello.svg` |
| **Fondo oscuro o foto** | `bouw-sello-claro.svg`. **Nunca** el sello azul dentro de un recuadro blanco |
| **Cuando el sello no cabe** | La marca suelta, que es la versión secundaria |
| **Nunca** | Degradado, sombra, contorno, ni cerrar el hueco de la letra |

El hueco no es un defecto de dibujo. Es la marca.

## Colores

| | Hex | Uso |
|---|---|---|
| Azul profundo | `#14395F` | Sello, asta y bocel inferior |
| Cian | `#1E9FB5` | Bocel superior sobre fondo claro |
| Cian claro | `#7FD4E3` | Bocel superior dentro del sello azul |
