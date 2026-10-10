import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Background from "@/components/Background";
import CaseStudy from "@/components/CaseStudy";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { CASES } from "@/lib/content";

/*
 * Una página por caso, generada en el build. Solo existen las que están en
 * `CASES`: cualquier otro slug es un 404, no una página vacía.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/proyectos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = CASES.find((x) => x.slug === slug);
  if (!c) return {};

  return {
    title: c.meta.title.es,
    description: c.meta.description.es,
    alternates: { canonical: `/proyectos/${c.slug}` },
    openGraph: {
      type: "article",
      url: `/proyectos/${c.slug}`,
      title: `${c.meta.title.es} | BOUW`,
      description: c.meta.description.es,
      /*
       * La misma tarjeta de la portada. La imagen de `src/app/` solo se hereda
       * si la página no declara su propio `openGraph`; al declararlo para el
       * título del caso, la imagen se caía y el enlace salía sin vista previa.
       */
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "BOUW | Automation & Digital Solutions",
        },
      ],
    },
  };
}

export default async function CasePage({
  params,
}: PageProps<"/proyectos/[slug]">) {
  const { slug } = await params;
  if (!CASES.some((c) => c.slug === slug)) notFound();

  return (
    <>
      {/* El mismo fondo de la portada, sin la escena: ver `Background` */}
      <Background scene={false} />
      <Nav home="/" />
      <CaseStudy slug={slug} />
      <Footer home="/" />
    </>
  );
}
