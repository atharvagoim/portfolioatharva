import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Parallax, Reveal } from './fx.jsx';
import Title, { Pill } from './Title.jsx';

function Computer({ image }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const ry = useSpring(useTransform(mx, [-1, 1], [-12, 12]), { stiffness: 120, damping: 16 });
  const rx = useSpring(useTransform(my, [-1, 1], [10, -10]), { stiffness: 120, damping: 16 });
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const reset = () => { mx.set(0); my.set(0); };
  const custom = image && image.length > 0;

  return (
    <div className="pc-zone" onPointerMove={onMove} onPointerLeave={reset}>
      <motion.div
        className="pc"
        style={{ rotateX: rx, rotateY: ry }}
        initial={{ opacity: 0, x: -80, rotate: -6 }}
        whileInView={{ opacity: 1, x: 0, rotate: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}>
          <img src={custom ? image : '/assets/pc.webp'} alt="" className="pc-img" draggable="false" />
          {!custom && (
            <div className="pc-screen" aria-hidden>
              <motion.div className="pc-boot" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9 }}>
                <span>&gt; npm run build</span>
                <span className="pc-ok">✓ shipped</span>
                <span className="pc-caret" />
              </motion.div>
              <div className="pc-scan" />
            </div>
          )}
        </motion.div>
        <div className="pc-shadow" />
      </motion.div>
    </div>
  );
}

export default function Experience({ items = [] }) {
  const [i, setI] = useState(0);
  if (!items.length) return null;
  const x = items[Math.min(i, items.length - 1)];
  const many = items.length > 1;

  return (
    <section id="experience" className="section experience">
      <Title text="EXPERIENCE" icon={<img src="/assets/loader.png" alt="" className="spin-steps" />} />

      <div className="xp-body">
        <Parallax amount={30} className="xp-pc-col">
          <Computer image={x.image} />
        </Parallax>

        <div className="xp-text-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {many && <h3 className="xp-title">{x.title}</h3>}
              <XpText text={x.text} />
            </motion.div>
          </AnimatePresence>

          {many && (
            <div className="xp-pager">
              <button onClick={() => setI((i - 1 + items.length) % items.length)} aria-label="Previous"><img src="/assets/arrow.png" alt="" className="flip" /></button>
              <span>{String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
              <button onClick={() => setI((i + 1) % items.length)} aria-label="Next"><img src="/assets/arrow.png" alt="" /></button>
            </div>
          )}
        </div>
      </div>

      {(x.linkLabel || x.linkUrl) && (
        <Reveal className="xp-pill" y={20}>
          <Pill href={x.linkUrl}>{x.linkLabel || x.linkUrl}</Pill>
        </Reveal>
      )}
    </section>
  );
}

/** Lines of text fade in word by word when they enter view */
function XpText({ text = '' }) {
  const words = text.split(' ');
  return (
    <motion.p className="xp-text" initial="h" whileInView="s" viewport={{ once: true, margin: '-60px' }}
      variants={{ s: { transition: { staggerChildren: Math.min(0.012, 1.2 / words.length) } } }}>
      {words.map((w, k) => (
        <motion.span key={k} variants={{ h: { opacity: 0, y: 8 }, s: { opacity: 1, y: 0 } }} transition={{ duration: 0.4 }}>
          {w}{' '}
        </motion.span>
      ))}
    </motion.p>
  );
}
