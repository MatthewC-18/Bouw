import type { MetadataRoute } from "next";
import { CASES } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/**
 * `sitemap.xml`: la portada y los casos completos. La privacidad va
 * también, con prioridad baja. Las demos no: llevan `noindex`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...CASES.map((c) => ({
      url: `${SITE_URL}/proyectos/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
