import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/** Short spinner + percentage, then a CRT switch-off wipe */
export default function Preloader({ dataReady, onDone }) {
  const [pct, setPct] = useState(0);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min(1, (t - start) / 1300);
      setPct(Math.round((1 - Math.pow(1 - p, 2)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (pct >= 100 && dataReady && !exit) {
      const t = setTimeout(() => setExit(true), 150);
      return () => clearTimeout(t);
    }
  }, [pct, dataReady, exit]);

  useEffect(() => {
    if (exit) { const t = setTimeout(onDone, 650); return () => clearTimeout(t); }
  }, [exit, onDone]);

  return (
    <motion.div
      className="preloader"
      animate={exit ? { clipPath: ['inset(0% 0% 0% 0%)', 'inset(49.5% 0% 49.5% 0%)', 'inset(49.5% 50% 49.5% 50%)'] } : {}}
      transition={{ duration: 0.6, times: [0, 0.6, 1], ease: 'easeInOut' }}
    >
      <img src="/assets/loader.png" alt="" className="spin-steps preloader-spin" />
      <span className="preloader-pct">{String(pct).padStart(3, '0')}%</span>
    </motion.div>
  );
}
