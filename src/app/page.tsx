import About from "@/components/About";
import DebugPanel from "@/components/DebugPanel";
import Background from "@/components/Background";
import Contact from "@/components/Contact";
import Diagnosis from "@/components/Diagnosis";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HoursSheet from "@/components/HoursSheet";
import Nav from "@/components/Nav";
import PaperWindow from "@/components/PaperWindow";
import Projects from "@/components/Projects";
import SceneBreak from "@/components/SceneBreak";
import SideRails from "@/components/SideRails";
import VeilHeat from "@/components/VeilHeat";
import { BREAKS } from "@/lib/content";

export default function Home() {
  return (
    <>
      <Background />
      {/*
        El velo de cada sección deja de ser fijo y sigue al dragón: sube donde
        pasa por detrás del texto y baja donde no. Ver `VeilHeat`.
      */}
      <VeilHeat />
      <Nav />
      <SideRails />
      <main className="relative flex-1">
        <Hero />
        {/* Aquí la marca se desarma: la banda deja la escena despejada */}
        <SceneBreak mark={BREAKS[0].mark} quote={BREAKS[0].quote} />
        <Projects />
        {/* Síntomas → disciplina. Antes: rejilla de cuatro servicios. */}
        <Diagnosis />
        <SceneBreak
          mark={BREAKS[1].mark}
          quote={BREAKS[1].quote}
          align="right"
        />
        {/* Dossier impreso: pliego, troquel con la escena viva, pliego */}
        {/* La cuenta de horas. Antes: los cuatro pasos. */}
        <HoursSheet />
        <PaperWindow />
        <About />
        {/* Y aquí vuelve a armarse, justo antes de contacto */}
        <SceneBreak mark={BREAKS[2].mark} quote={BREAKS[2].quote} />
        <Contact />
      </main>
      <Footer />
      {/*
        Panel de números. Solo en desarrollo, y ahí solo con `?debug` en la
        URL — el guardia de entorno es constante en compilación, así que en
        producción el componente ni entra en el paquete.
      */}
      {process.env.NODE_ENV !== "production" && <DebugPanel />}
    </>
  );
}
