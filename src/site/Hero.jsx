import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLenis } from './fx.jsx';
import { scrollToId } from './SideNav.jsx';

const KEYS = ['p', 'o', 'r', 't', 'f', 'o', 'l', 'i', 'o'];

export default function Hero({ started }) {
  const ref = useRef(null);
  const lenisRef = useLenis();
  const [pressed, setPressed] = useState(() => new Set());
  const [landed, setLanded] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const keysY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const keysScale = useTransform(scrollYProgress, [0, 1], [1, 0.82]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  // Typing on a real keyboard presses the matching keycaps
  useEffect(() => {
    const down = (e) => {
      const k = e.key?.toLowerCase();
      if (KEYS.includes(k) && !e.target.closest?.('input, textarea')) setPressed((s) => new Set([...s, k]));
    };
    const up = (e) => setPressed((s) => { const n = new Set(s); n.delete(e.key?.toLowerCase()); return n; });
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setLanded(true), 1500);
    return () => clearTimeout(t);
  }, [started]);

  return (
    <section id="top" className="hero" ref={ref}>
      <motion.div className="hero-keys-wrap" style={{ y: keysY, scale: keysScale, opacity: fade }}>
        <div className="keys" role="img" aria-label="portfolio">
          {KEYS.map((k, i) => (
            <motion.div
              key={i}
              className={`key ${landed ? 'is-idle' : ''}`}
              style={{ '--i': i }}
              initial={{ y: -420, rotate: (i % 2 ? 1 : -1) * (20 + i * 4), opacity: 0 }}
              animate={started ? { y: 0, rotate: 0, opacity: 1 } : {}}
              transition={{ type: 'spring', stiffness: 240, damping: 13, mass: 0.9, delay: 0.1 + i * 0.075 }}
            >
              <motion.img
                src={`/assets/key-${i}.webp`}
                alt=""
                draggable="false"
                animate={pressed.has(k) ? { y: 12, scale: 0.93, filter: 'brightness(1.35)' } : { y: 0, scale: 1, filter: 'brightness(1)' }}
                whileHover={{ y: 10, scale: 0.95, filter: 'brightness(1.3)' }}
                whileTap={{ y: 14, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              />
            </motion.div>
          ))}
        </div>
        <motion.div className="keys-glow" initial={{ opacity: 0 }} animate={started ? { opacity: 1 } : {}} transition={{ delay: 1, duration: 1.2 }} />
      </motion.div>

      <motion.button
        className="hero-ready"
        style={{ opacity: fade }}
        onClick={() => scrollToId(lenisRef.current, 'about')}
        aria-label="Ready? Scroll to About"
        data-cursor="go!"
        initial={{ opacity: 0 }}
        animate={started ? { opacity: 1 } : {}}
        transition={{ delay: 1.1 }}
      >
        <span className="ready-wrap">
          <motion.img
            src="/assets/ready.png"
            alt=""
            className="ready-img"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={started ? { clipPath: 'inset(0 0% 0 0)' } : {}}
            transition={{ delay: 1.2, duration: 0.9, ease: (t) => Math.ceil(t * 7) / 7 }}
          />
          <span className="ready-cursor-mask" />
        </span>
      </motion.button>
    </section>
  );
}
