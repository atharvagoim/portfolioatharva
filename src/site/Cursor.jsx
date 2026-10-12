import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/** Dot + trailing ring. Grows over interactive elements; shows a label for [data-cursor]. */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState('');
  const [down, setDown] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 350, damping: 30, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 350, damping: 30, mass: 0.6 });

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setEnabled(mq.matches);
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('has-cursor');
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY);
      const t = e.target.closest?.('a, button, [data-cursor], input, textarea, select, label');
      setHover(!!t);
      setLabel(t?.getAttribute?.('data-cursor') || '');
    };
    const d = () => setDown(true);
    const u = () => setDown(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', d);
    window.addEventListener('pointerup', u);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', d);
      window.removeEventListener('pointerup', u);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;
  const size = label ? 84 : hover ? 54 : 34;
  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} animate={{ scale: down ? 0.5 : hover ? 0 : 1 }} />
      <motion.div
        className={`cursor-ring ${label ? 'has-label' : ''}`}
        style={{ x: rx, y: ry }}
        animate={{ width: size, height: size, scale: down ? 0.85 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        {label && <span>{label}</span>}
      </motion.div>
    </>
  );
}
