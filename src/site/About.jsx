import { motion } from 'framer-motion';
import { ScrubText, Parallax, Reveal } from './fx.jsx';
import Title, { Pill } from './Title.jsx';

export default function About({ settings }) {
  return (
    <section id="about" className="section about">
      <motion.div className="about-photo-col" initial="h" whileInView="s" viewport={{ once: true, amount: 0.15 }}>
        <Parallax amount={40} className="about-photo-par">
          <motion.div
            className="about-photo"
            variants={{ h: { clipPath: 'inset(100% 0% 0% 0%)', y: 60 }, s: { clipPath: 'inset(0% 0% 0% 0%)', y: 0 } }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            data-cursor="hi!"
          >
            <motion.img
              src="/assets/me.webp"
              alt={settings.name}
              animate={{ y: [0, -10, 0], rotate: [0, 0.8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            />
          </motion.div>
        </Parallax>
      </motion.div>

      <div className="about-text">
        <Title text="ABOUT ME" align="left" />
        <ScrubText className="about-bio" text={settings.about} />
        <Reveal y={20} delay={0.1}>
          <Pill href={settings.serviceUrl}>{settings.serviceLabel || 'my service website'}</Pill>
        </Reveal>
      </div>
    </section>
  );
}
