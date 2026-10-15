import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const COUNT_MS = 2100; // full intro: drop-in, sway, count to 100

/** Spider-Man hangs from a web while the count runs, then is pulled up and the screen fades. */
export default function Preloader({ dataReady, onDone }) {
  const pctRef = useRef(null);
  const [counted, setCounted] = useState(false);
  const [exit, setExit] = useState(false);

  // count straight into the DOM so the animation never waits on a React render
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min(1, (t - start) / COUNT_MS);
      if (pctRef.current) pctRef.current.textContent = `${String(Math.round((1 - Math.pow(1 - p, 2)) * 100)).padStart(3, '0')}%`;
      if (p < 1) raf = requestAnimationFrame(tick);
      else setCounted(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (counted && dataReady && !exit) {
      const t = setTimeout(() => setExit(true), 200);
      return () => clearTimeout(t);
    }
  }, [counted, dataReady, exit]);

  useEffect(() => {
    if (exit) { const t = setTimeout(onDone, 1000); return () => clearTimeout(t); }
  }, [exit, onDone]);

  return (
    <motion.div
      className="preloader"
      initial={{ opacity: 1 }}
      animate={{ opacity: exit ? 0 : 1 }}
      transition={{ duration: 0.45, delay: exit ? 0.55 : 0, ease: 'easeInOut' }}
    >
      <motion.div
        className="pl-hang"
        initial={{ y: '-100%' }}
        animate={{ y: exit ? '-125%' : 0 }}
        transition={exit ? { duration: 0.7, ease: [0.55, 0, 0.9, 0.4] } : { type: 'spring', stiffness: 55, damping: 12, mass: 1.1, delay: 0.1 }}
      >
        <div className={`pl-swing${exit ? ' is-still' : ''}`}>
          <span className="pl-thread" />
          <img src="/assets/spidey.png" alt="" className="pl-spidey" draggable="false" />
        </div>
      </motion.div>

      <motion.div
        className="pl-info"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: exit ? 0 : 1, y: exit ? 8 : 0 }}
        transition={{ duration: exit ? 0.3 : 0.7, delay: exit ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src="/assets/loader.png" alt="" className="spin-steps pl-spin" />
        <p className="pl-text">loading<br />please wait</p>
        <span className="pl-pct" ref={pctRef}>000%</span>
      </motion.div>
    </motion.div>
  );
}
