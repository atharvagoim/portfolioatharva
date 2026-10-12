import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from './fx.jsx';
import { ProjectIcon } from './Projects.jsx';

export default function ProjectModal({ project, onClose }) {
  const lenisRef = useLenis();

  useEffect(() => {
    if (!project) return;
    lenisRef.current?.stop();
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      lenisRef.current?.start();
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [project, onClose, lenisRef]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div className="modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={project.title}
            onClick={(e) => e.stopPropagation()}
            style={{ '--accent': project.accent || '#9BEA3B' }}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            data-lenis-prevent
          >
            <div className="modal-bar">
              <span className="modal-dots"><i /><i /><i /></span>
              <span className="modal-path">~/projects/{(project.title || '').toLowerCase().replace(/\s+/g, '-')}</span>
              <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
            </div>

            <div className="modal-scroll">
              {project.cover && (
                <motion.div className="modal-cover" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} transition={{ delay: 0.3, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}>
                  <img src={project.cover} alt="" />
                </motion.div>
              )}

              <motion.div className="modal-content" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } } }}>
                <motion.div className="modal-head" variants={item}>
                  <span className="modal-icon"><ProjectIcon project={project} /></span>
                  <div>
                    <h2>{project.title}</h2>
                    {project.tagline && <p>{project.tagline}</p>}
                  </div>
                  {project.logo && project.icon && <img className="modal-logo" src={project.logo} alt="" />}
                </motion.div>

                <motion.dl className="modal-meta" variants={item}>
                  {project.year && <div><dt>year</dt><dd>{project.year}</dd></div>}
                  {project.category && <div><dt>type</dt><dd>{project.category}</dd></div>}
                  {project.tags?.length > 0 && <div><dt>stack</dt><dd>{project.tags.join(' · ')}</dd></div>}
                </motion.dl>

                <motion.p className="modal-desc" variants={item}>{project.description}</motion.p>

                <motion.div className="modal-links" variants={item}>
                  {project.liveUrl && (
                    <a className="btn btn-lime" href={project.liveUrl} target="_blank" rel="noreferrer">
                      <img src="/assets/link.png" alt="" className="btn-link-ic" /> Visit live
                    </a>
                  )}
                  {project.repoUrl && (
                    <a className="btn btn-ghost" href={project.repoUrl} target="_blank" rel="noreferrer">
                      Source <img src="/assets/arrow.png" alt="" className="btn-arrow" />
                    </a>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const item = { h: { opacity: 0, y: 24 }, s: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };
