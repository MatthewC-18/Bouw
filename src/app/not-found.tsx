import type { Metadata } from "next";
import NotFound from "@/components/NotFound";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NotFoundPage() {
  return <NotFound />;
}
