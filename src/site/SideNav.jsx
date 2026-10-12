import { useEffect, useState } from 'react';
import { useLenis } from './fx.jsx';

export const SECTIONS = [
  { id: 'top', label: 'Start' },
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

export function scrollToId(lenis, id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/** Progress bar on top + pixel dot navigation on the right */
export default function SideNav() {
  const lenisRef = useLenis();
  const [active, setActive] = useState('top');

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -45% 0px' }
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); el && io.observe(el); });
    return () => io.disconnect();
  }, []);

  return (
    <>
      <nav className="sidenav" aria-label="Sections">
        {SECTIONS.map((s) => (
          <button key={s.id} className={active === s.id ? 'is-on' : ''} onClick={() => scrollToId(lenisRef.current, s.id)} aria-label={s.label}>
            <span className="sidenav-label">{s.label}</span>
            <i />
          </button>
        ))}
      </nav>
    </>
  );
}
