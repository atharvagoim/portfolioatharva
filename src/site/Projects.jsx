import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Title from './Title.jsx';
import ProjectModal from './ProjectModal.jsx';

export function ProjectIcon({ project, className = '' }) {
  const src = project.icon || project.logo;
  if (src) return <img className={`proj-icon-img ${className}`} src={src} alt="" draggable="false" />;
  return <span className={`proj-mono ${className}`} style={{ color: project.accent || '#B9B4F0' }}>{(project.title || '?').trim()[0]}</span>;
}

// position for each offset from the active card
const POS = {
  0: { x: '0%', scale: 1, z: 5, opacity: 1, rotateY: 0 },
  1: { x: '84%', scale: 0.82, z: 4, opacity: 1, rotateY: -14 },
  2: { x: '140%', scale: 0.58, z: 3, opacity: 0.8, rotateY: -22 },
  3: { x: '175%', scale: 0.4, z: 2, opacity: 0, rotateY: -26 },
};
const posFor = (off) => {
  const a = Math.min(Math.abs(off), 3);
  const p = POS[a];
  const sign = off < 0 ? -1 : 1;
  return { ...p, x: off < 0 ? `-${p.x}` : p.x, rotateY: p.rotateY * sign * -1 };
};

export default function Projects({ projects }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [open, setOpen] = useState(null);
  const [paused, setPaused] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '-30%' });
  const n = projects.length;

  const go = useCallback((d) => { if (!n) return; setDir(d); setIdx((i) => (i + d + n) % n); }, [n]);

  // autoplay while visible
  useEffect(() => {
    if (!inView || paused || n < 2 || open) return;
    const t = setInterval(() => go(1), 4200);
    return () => clearInterval(t);
  }, [inView, paused, n, go, open]);

  // keyboard arrows while visible
  useEffect(() => {
    if (!inView || open) return;
    const k = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [inView, go, open]);

  const cur = projects[idx];

  // shortest signed offset so the ring wraps around
  const offsetOf = (i) => {
    let o = i - idx;
    if (o > n / 2) o -= n;
    if (o < -n / 2) o += n;
    return o;
  };

  return (
    <section id="projects" className="section projects" ref={ref}>
      <div className="grid-bg" aria-hidden />
      <Title text="PROJECTS" icon="/assets/folder.webp" iconClass="title-icon-folder" />

      {n === 0 ? (
        <p className="empty">No projects yet. Add some from the admin panel.</p>
      ) : (
        <>
          <div className="carousel" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
            <motion.button className="car-arrow car-prev" onClick={() => go(-1)} aria-label="Previous project" whileHover={{ x: -6 }} whileTap={{ scale: 0.85 }}>
              <img src="/assets/arrow.png" alt="" />
            </motion.button>

            <motion.div
              className="car-stage"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50 || info.velocity.x < -400) go(1);
                else if (info.offset.x > 50 || info.velocity.x > 400) go(-1);
              }}
            >
              {projects.map((p, i) => {
                const off = offsetOf(i);
                const pos = posFor(off);
                const isActive = off === 0;
                return (
                  <motion.div
                    key={p.id}
                    className={`car-card ${isActive ? 'is-active' : ''}`}
                    style={{ zIndex: pos.z, pointerEvents: Math.abs(off) > 2 ? 'none' : 'auto' }}
                    initial={false}
                    animate={{ x: pos.x, scale: pos.scale, opacity: pos.opacity, rotateY: pos.rotateY }}
                    transition={{ type: 'spring', stiffness: 170, damping: 22, mass: 0.9 }}
                    onClick={() => (isActive ? setOpen(p) : go(off > 0 ? 1 : -1))}
                    data-cursor={isActive ? 'open' : undefined}
                    role="button"
                    tabIndex={Math.abs(off) <= 1 ? 0 : -1}
                    aria-label={isActive ? `Open ${p.title}` : `Show ${p.title}`}
                    onKeyDown={(e) => e.key === 'Enter' && (isActive ? setOpen(p) : go(off > 0 ? 1 : -1))}
                  >
                    <motion.div
                      className="car-icon"
                      animate={isActive ? { y: [0, -8, 0], rotate: [0, -2, 0] } : { y: 0, rotate: 0 }}
                      transition={isActive ? { repeat: Infinity, duration: 3.2, ease: 'easeInOut' } : { duration: 0.3 }}
                    >
                      <ProjectIcon project={p} />
                    </motion.div>
                    {isActive && <span className="car-shine" />}
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.button className="car-arrow car-next" onClick={() => go(1)} aria-label="Next project" whileHover={{ x: 6 }} whileTap={{ scale: 0.85 }}>
              <img src="/assets/arrow.png" alt="" />
            </motion.button>
          </div>

          <div className="car-info" aria-live="polite">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={cur?.id}
                custom={dir}
                initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                transition={{ duration: 0.35 }}
              >
                <h3 className="car-title">{cur?.title}</h3>
                <p className="car-desc">{cur?.description}</p>
              </motion.div>
            </AnimatePresence>
            <div className="car-dots">
              {projects.map((p, i) => (
                <button key={p.id} className={i === idx ? 'is-on' : ''} onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }} aria-label={`Go to ${p.title}`} />
              ))}
            </div>
          </div>
        </>
      )}

      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </section>
  );
}
