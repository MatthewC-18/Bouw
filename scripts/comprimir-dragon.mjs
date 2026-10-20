// Comprime `public/dragon.glb` (20 oct 2026: de 1104 a 595 KB al descargarse).
//
// No va en las dependencias del sitio: se instala aparte, en una carpeta
// cualquiera fuera del repo, y se corre desde ahí:
//
//   npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer@0.22
//   node comprimir-dragon.mjs dragon-exportado.glb public/dragon.glb
//
// El sitio lo lee sin cambios: `useGLTF` de drei ya trae el decodificador de
// meshopt. Si se vuelve a exportar el dragón desde Blender, hay que pasarlo
// otra vez por aquí.
//
// Comprime el dragón con meshopt sin tocar las posiciones.
//
// Las posiciones quedan en float32 tal cual: el efecto plano/realidad de la
// portada (`vPlanLocal = position`) y la caja del bicho (`Dragon.tsx`, que lee
// `attributes.position`) trabajan en el espacio local del modelo, y cuantizar
// las posiciones añade una escala al nodo que lo descuadraría. Se cuantizan
// normales (10 bits), coordenadas de textura (12) y pesos de hueso (8), que
// no necesitan transformación; después, meshopt sobre todo (geometría y
// animaciones).
//
// Uso: node comprimir.mjs entrada.glb salida.glb
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { quantize } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const [input, output] = process.argv.slice(2);
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.encoder": MeshoptEncoder,
  "meshopt.decoder": MeshoptDecoder,
});

const doc = await io.read(input);

// Rango de las coordenadas de textura: fuera de 0…1 cuantizarlas pediría una
// transformación de textura, y entonces mejor no tocarlas
let uvOut = false;
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const uv = prim.getAttribute("TEXCOORD_0");
    if (!uv) continue;
    const min = [Infinity, Infinity];
    const max = [-Infinity, -Infinity];
    uv.getMinNormalized(min);
    uv.getMaxNormalized(max);
    console.log("UV min", min, "max", max);
    if (min[0] < 0 || min[1] < 0 || max[0] > 1 || max[1] > 1) uvOut = true;
  }
}

const pattern = uvOut ? /^(NORMAL|WEIGHTS_0)$/ : /^(NORMAL|TEXCOORD_0|WEIGHTS_0)$/;
console.log("se cuantiza:", pattern);
await doc.transform(
  quantize({ pattern, quantizeNormal: 10, quantizeTexcoord: 12, quantizeWeight: 8 }),
);

doc
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });

await io.write(output, doc);
console.log("listo:", output);
