import About from "@/components/About";
import DebugPanel from "@/components/DebugPanel";
import Background from "@/components/Background";
import Contact from "@/components/Contact";
import Diagnosis from "@/components/Diagnosis";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HoursSheet from "@/components/HoursSheet";
import Nav from "@/components/Nav";
import Projects from "@/components/Projects";
import SceneBreak from "@/components/SceneBreak";
import { BREAKS } from "@/lib/content";

export default function Home() {
  return (
    <>
      <Background />
      <Nav />
      {/*
        Oscuro de principio a fin. El dragón se posa en cada sección —la W de
        la portada, la esquina de cada proyecto, el titular de cada capítulo—
        y vuela de una a otra; ver `data-perch` y `Dragon.tsx`. Ya no hay velo
        que siga al bicho ni troquel: posado en un borde no pasa por detrás de
        ningún párrafo.

        Sin rieles laterales: eran instrumentación de la escena —sección
        actual, tanto por ciento— que ninguna firma seria lleva en los
        márgenes.
      */}
      <main className="relative flex-1">
        <Hero />
        <SceneBreak {...BREAKS[0]} />
        <Projects />
        {/*
          Después de Proyectos, sin capítulos a pantalla completa: eran dos
          pantallas con una frase cada una y la página seguía y seguía
          («siento que sigue bajando mucho y el usuario se va a cansar»,
          Matthew, 15 oct 2026). La frase de las sedes vive ahora en Nosotros.
        */}
        <Diagnosis />
        <HoursSheet />
        <About />
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
