import { motion } from 'framer-motion';
import { useLenis } from './fx.jsx';
import Title from './Title.jsx';
import { ICONS, CONTACT_ORDER, contactHref } from './SocialIcons.jsx';
import { scrollToId } from './SideNav.jsx';

export default function Contact({ settings }) {
  const lenisRef = useLenis();
  const contacts = settings.contacts || {};

  return (
    <section id="contact" className="section contact">
      <Title text="CONTACT" icon={settings.contactIcon || "/assets/contact-icon.png"} iconClass="title-icon-contact" />

      <motion.ul
        className="socials"
        initial="h"
        whileInView="s"
        viewport={{ once: true, margin: '-60px' }}
        variants={{ s: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } } }}
      >
        {CONTACT_ORDER.map(({ key, label }, i) => {
          const href = contactHref(key, contacts[key]);
          const Icon = ICONS[key];
          const external = href && !href.startsWith('mailto:') && !href.startsWith('tel:');
          return (
            <motion.li
              key={key}
              variants={{ h: { opacity: 0, y: 80, scale: 0.4, rotate: i % 2 ? 25 : -25 }, s: { opacity: 1, y: 0, scale: 1, rotate: 0 } }}
              transition={{ type: 'spring', stiffness: 260, damping: 13 }}
            >
              <motion.a
                className={`social ${href ? '' : 'is-empty'}`}
                href={href || undefined}
                target={external ? '_blank' : undefined}
                rel="noreferrer"
                aria-label={label}
                title={label}
                data-cursor={href ? label.toLowerCase() : undefined}
                style={{ '--d': `${i * 0.35}s` }}
                whileHover={{ y: -14, scale: 1.12, rotate: i % 2 ? 8 : -8 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              >
                <Icon />
              </motion.a>
              <span className="social-label">{label}</span>
            </motion.li>
          );
        })}
      </motion.ul>

      <motion.button
        className="game-over"
        onClick={() => scrollToId(lenisRef.current, 'top')}
        data-cursor="restart"
        initial={{ opacity: 0, scale: 2.2, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Game over. Back to top"
      >
        <span className="go-text" data-text="GAME OVER">GAME OVER</span>
        <span className="go-sub">press to continue ↑</span>
      </motion.button>

      <footer className="footer">© {new Date().getFullYear()} {settings.name}</footer>
    </section>
  );
}
