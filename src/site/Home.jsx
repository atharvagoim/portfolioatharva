import { useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import { api } from '../api.js';
import { LenisContext } from './fx.jsx';
import SideNav from './SideNav.jsx';
import Hero from './Hero.jsx';
import About from './About.jsx';
import Skills from './Skills.jsx';
import Projects from './Projects.jsx';
import Experience from './Experience.jsx';
import Contact from './Contact.jsx';

const FALLBACK = {
  settings: { name: 'Atharva Goim', about: '', contacts: {}, experience: [] },
  projects: [],
};

export default function Home() {
  const [data, setData] = useState(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    api.site().then(setData).catch(() => setData(FALLBACK));
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenisRef.current = lenis;
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); lenisRef.current = null; };
  }, []);

  useEffect(() => {
    if (data?.settings?.name) document.title = `${data.settings.name} | Portfolio`;
  }, [data]);

  const s = data?.settings || FALLBACK.settings;
  const projects = data?.projects || [];

  return (
    <MotionConfig reducedMotion="user">
      <LenisContext.Provider value={lenisRef}>
        <div className="noise" aria-hidden />
        {data && (
          <>
            <SideNav />
            <main>
              <Hero started />
              <About settings={s} />
              <Skills />
              <Projects projects={projects} />
              <Experience items={s.experience} />
              <Contact settings={s} />
            </main>
          </>
        )}
      </LenisContext.Provider>
    </MotionConfig>
  );
}
