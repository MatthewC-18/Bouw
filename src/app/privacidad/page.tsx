import type { Metadata } from "next";
import PrivacyNotice from "@/components/PrivacyNotice";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Qué hace BOUW con los datos del formulario de contacto, según la Ley Orgánica de Protección de Datos Personales del Ecuador.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return <PrivacyNotice />;
}
