import { useRef, createContext, useContext } from 'react';
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';

export const LenisContext = createContext({ current: null });
export const useLenis = () => useContext(LenisContext);

const ease = [0.22, 1, 0.36, 1];

/** Fade + rise when scrolled into view */
export function Reveal({ children, delay = 0, y = 40, className, as = 'div', ...rest }) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease, delay }}
      {...rest}
    >
      {children}
    </M>
  );
}

/** Words slide up out of a mask, one after another */
export function SplitText({ text, className, delay = 0, stagger = 0.06, as = 'h2', animateNow = false }) {
  const M = motion[as];
  const words = String(text || '').split(' ');
  const trigger = animateNow ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '-40px' } };
  return (
    <M className={className} initial="hide" {...trigger} aria-label={text}>
      {words.map((w, i) => (
        <span className="split-mask" key={i} aria-hidden="true">
          <motion.span
            className="split-word"
            variants={{ hide: { y: '110%', rotate: 6 }, show: { y: '0%', rotate: 0 } }}
            transition={{ duration: 0.85, ease, delay: delay + i * stagger }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </M>
  );
}

/** Element drifts toward the pointer */
export function Magnetic({ children, strength = 0.35, className, ...rest }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 15, mass: 0.4 });
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };
  return (
    <motion.div ref={ref} className={className} style={{ x: sx, y: sy, display: 'inline-block' }}
      onPointerMove={onMove} onPointerLeave={reset} {...rest}>
      {children}
    </motion.div>
  );
}

/** Pixel section label like  01 / ABOUT */
export function Label({ n, children }) {
  return (
    <Reveal className="label" y={12}>
      <span className="label-n">{n}</span>
      <span className="label-slash">/</span>
      <span>{children}</span>
      <span className="label-line" />
    </Reveal>
  );
}

/** Parallax wrapper: moves children by `amount` px across the viewport */
export function Parallax({ children, amount = 80, className, rotate = 0 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  const r = useTransform(scrollYProgress, [0, 1], [-rotate, rotate]);
  return (
    <motion.div ref={ref} className={className} style={{ y, rotate: r }}>
      {children}
    </motion.div>
  );
}

/** Scroll-scrubbed word highlight paragraph */
export function ScrubText({ text, className }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'end 70%'] });
  const words = String(text || '').split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>
      ))}
    </p>
  );
}
function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return <motion.span style={{ opacity }} className="scrub-word">{children} </motion.span>;
}
