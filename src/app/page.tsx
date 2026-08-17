import About from "@/components/About";
import Background from "@/components/Background";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Nav from "@/components/Nav";
import PaperWindow from "@/components/PaperWindow";
import Process from "@/components/Process";
import Projects from "@/components/Projects";
import SceneBreak from "@/components/SceneBreak";
import Services from "@/components/Services";
import SideRails from "@/components/SideRails";
import { BREAKS } from "@/lib/content";

export default function Home() {
  return (
    <>
      <Background />
      <Nav />
      <SideRails />
      <main className="relative flex-1">
        <Hero />
        {/* Aquí la marca se desarma: la banda deja la escena despejada */}
        <SceneBreak mark={BREAKS[0].mark} quote={BREAKS[0].quote} />
        <Projects />
        <Services />
        <SceneBreak
          mark={BREAKS[1].mark}
          quote={BREAKS[1].quote}
          align="right"
        />
        {/* Dossier impreso: pliego, troquel con la escena viva, pliego */}
        <Process />
        <PaperWindow />
        <About />
        {/* Y aquí vuelve a armarse, justo antes de contacto */}
        <SceneBreak mark={BREAKS[2].mark} quote={BREAKS[2].quote} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
