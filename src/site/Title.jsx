import { motion } from 'framer-motion';

/** Big heavy section heading: optional icon pops in, letters rise one by one */
export default function Title({ text, icon, iconClass = '', underline = false, className = '', align = 'center' }) {
  const letters = [...text];
  return (
    <motion.div
      className={`title title-${align} ${className}`}
      initial="h"
      whileInView="s"
      viewport={{ once: true, margin: '-60px' }}
    >
      {icon && (
        <motion.span
          className={`title-icon ${iconClass}`}
          variants={{ h: { scale: 0, rotate: -90 }, s: { scale: 1, rotate: 0 } }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          {typeof icon === 'string' ? <img src={icon} alt="" /> : icon}
        </motion.span>
      )}
      <h2 className={underline ? 'has-underline' : ''} aria-label={text}>
        {letters.map((c, i) => (
          <span className="title-mask" key={i} aria-hidden>
            <motion.span
              className="title-ch"
              variants={{ h: { y: '115%' }, s: { y: '0%' } }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 + i * 0.035 }}
            >
              {c === ' ' ? ' ' : c}
            </motion.span>
          </span>
        ))}
        {underline && (
          <motion.span
            className="title-underline"
            variants={{ h: { scaleX: 0 }, s: { scaleX: 1 } }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.1 + letters.length * 0.035 }}
          />
        )}
      </h2>
    </motion.div>
  );
}

/** White pill link with the chain icon and handwritten label */
export function Pill({ href, children }) {
  const Tag = href ? motion.a : motion.span;
  return (
    <Tag
      className={`pill ${href ? '' : 'is-disabled'}`}
      href={href || undefined}
      target={href ? '_blank' : undefined}
      rel="noreferrer"
      whileHover={{ scale: 1.06, rotate: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      data-cursor={href ? 'visit' : undefined}
    >
      <img src="/assets/link.png" alt="" className="pill-icon" />
      <span>{children}</span>
    </Tag>
  );
}
