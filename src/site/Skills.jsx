import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Reveal } from './fx.jsx';
import Title from './Title.jsx';

const Txt = ({ t, c, size = 34 }) => (
  <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontFamily="Archivo Black, Inter, sans-serif" fontWeight="900" fontSize={size} fill={c}>{t}</text>
);
const sv = (children) => <svg viewBox="0 0 100 100" aria-hidden>{children}</svg>;

// l/t = position in % of the 4:3 stage, r = resting tilt
const TOOLS = [
  { n: 'Claude', l: 4, t: 10, r: -6, icon: sv(<g stroke="#e8552a" strokeWidth="7" strokeLinecap="round">{[...Array(10)].map((_, i) => <line key={i} x1="50" y1="50" x2={50 + 34 * Math.cos(i * 0.628)} y2={50 + 34 * Math.sin(i * 0.628)} />)}</g>) },
  { n: 'JavaScript', l: 4, t: 50, r: 5, icon: sv(<Txt t="JS" c="#f7d83a" />) },
  { n: 'Terminal', l: 61, t: 12, r: 8, icon: sv(<g fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"><path d="M28 32 L50 50 L28 68" /><path d="M56 72 H76" /></g>) },
  { n: 'React', l: 61, t: 42, r: -4, icon: sv(<g fill="none" stroke="#61dafb" strokeWidth="5">{[0, 60, 120].map((a) => <ellipse key={a} cx="50" cy="50" rx="38" ry="14" transform={`rotate(${a} 50 50)`} />)}<circle cx="50" cy="50" r="6" fill="#61dafb" stroke="none" /></g>) },
  { n: 'Python', l: 8, t: 70, r: -5, icon: sv(<g><path d="M50 18c-16 0-16 7-16 12v8h17v4H28c-8 0-12 8-12 16s4 15 12 15h6V62c0-7 6-12 12-12h16c6 0 10-4 10-10V30c0-8-8-12-22-12Z" fill="#3b77a8" /><path d="M50 82c16 0 16-7 16-12v-8H49v-4h23c8 0 12-8 12-16s-4-15-12-15h-6v10c0 7-6 12-12 12H38c-6 0-10 4-10 10v10c0 8 8 13 22 13Z" fill="#fcd34d" /></g>) },
  { n: 'VS Code', l: 8, t: 30, r: 0, icon: sv(<g fill="#2f8cf0"><path d="M72 14 40 44 24 32l-8 6 18 12-18 12 8 6 16-12 32 30 12-6V20Z" /><path d="M72 36v28L56 50Z" fill="#0c1a33" /></g>) },
  { n: 'Node.js', l: 94, t: 42, r: 6, icon: sv(<g><path d="M50 12 82 31v38L50 88 18 69V31Z" fill="none" stroke="#3fb950" strokeWidth="6" /><Txt t="JS" c="#3fb950" size={26} /></g>) },
  { n: 'Figma', l: 4, t: 88, r: -7, icon: sv(<g><circle cx="62" cy="30" r="14" fill="#f24e1e" /><rect x="24" y="16" width="26" height="28" rx="13" fill="#ff7262" /><rect x="50" y="16" width="26" height="28" rx="13" fill="#a259ff" /><circle cx="63" cy="50" r="13" fill="#1abcfe" /><rect x="24" y="44" width="26" height="28" rx="13" fill="#0acf83" /></g>) },
  { n: 'GitHub', l: 83, t: 36, r: 4, icon: sv(<path fill="#fff" d="M50 14C30 14 14 30 14 50c0 16 10 29 24 34 2 0 3-1 3-2v-7c-10 2-12-5-12-5-2-4-4-5-4-5-3-2 0-2 0-2 4 0 6 4 6 4 3 5 8 4 10 3 0-2 1-4 2-5-8-1-16-4-16-18 0-4 1-7 4-10-1-1-2-5 0-10 0 0 3-1 10 4a34 34 0 0 1 18 0c7-5 10-4 10-4 2 5 1 9 0 10 3 3 4 6 4 10 0 14-8 17-16 18 2 1 3 4 3 8v12c0 1 1 2 3 2 14-5 24-18 24-34 0-20-16-36-36-36Z" />) },
  { n: 'Next.js', l: 67, t: 28, r: -3, icon: sv(<g><circle cx="50" cy="50" r="34" fill="#fff" /><path d="M38 34v32M40 34l24 32" stroke="#111" strokeWidth="6" fill="none" /></g>) },
  { n: 'Redis', l: 92, t: 58, r: 7, icon: sv(<g fill="#e63b36"><path d="M14 36 50 24l36 12-36 12Z" /><path d="M14 52 50 40l36 12-36 12Z" opacity=".8" /><path d="M14 68 50 56l36 12-36 12Z" opacity=".6" /></g>) },
  { n: 'Docker', l: 80, t: 54, r: 8, icon: sv(<g fill="#2496ed"><path d="M12 48h72c4-8 10-8 10-8 2 6-2 10-4 12 0 14-14 26-34 26C34 78 16 70 12 48Z" />{[[22, 36], [36, 36], [50, 36], [36, 24], [50, 24], [64, 36]].map(([x, y], i) => <rect key={i} x={x} y={y} width="11" height="10" />)}</g>) },
  { n: 'Notion', l: 72, t: 40, r: 6, icon: sv(<g><rect x="22" y="20" width="56" height="60" rx="6" fill="#fff" /><path d="M36 66V34l28 32V34" stroke="#111" strokeWidth="6" fill="none" /></g>) },
  { n: 'Git', l: 78, t: 72, r: -5, icon: sv(<g><rect x="20" y="20" width="60" height="60" rx="8" transform="rotate(45 50 50)" fill="#f05033" /><g stroke="#fff" strokeWidth="5" fill="#fff"><path d="M40 62V38m0 8 20-6" fill="none" /><circle cx="40" cy="62" r="6" /><circle cx="40" cy="36" r="6" /><circle cx="62" cy="40" r="6" /></g></g>) },
  { n: 'Tailwind', l: 66, t: 56, r: 5, icon: sv(<g fill="#38bdf8"><path d="M44 26c-12 0-20 6-24 18 5-6 10-9 17-7 4 1 6 4 9 7 4 4 9 8 18 8 12 0 20-6 24-18-5 6-10 9-17 7-4-1-6-4-9-7-4-4-9-8-18-8Z" /><path d="M36 50c-12 0-20 6-24 18 5-6 10-9 17-7 4 1 6 4 9 7 4 4 9 8 18 8 12 0 20-6 24-18-5 6-10 9-17 7-4-1-6-4-9-7-4-4-9-8-18-8Z" /></g>) },
  { n: 'MongoDB', l: 94, t: 76, r: -4, icon: sv(<path d="M50 10C40 28 28 40 28 58c0 14 9 24 21 28V92h2v-6c12-4 21-14 21-28 0-18-12-30-22-48Z" fill="#3fb950" />) },
  { n: 'PostgreSQL', l: 74, t: 90, r: 6, icon: sv(<g><ellipse cx="46" cy="44" rx="24" ry="28" fill="#6aa5d8" /><path d="M64 36c14-2 20 4 18 14-2 12-12 18-20 18" fill="none" stroke="#6aa5d8" strokeWidth="8" strokeLinecap="round" /><circle cx="40" cy="38" r="3.5" fill="#112033" /></g>) },
  { n: 'TypeScript', l: 88, t: 92, r: 10, icon: sv(<Txt t="TS" c="#3b82f6" />) },
];

const GROUPS = [
  ['Languages', 'JavaScript, TypeScript, Python, SQL'],
  ['AI & LLMs', 'Claude, GPT, Gemini, RAG, LangGraph, prompt engineering'],
  ['Frontend', 'React, Next.js, Vite, Tailwind, Framer Motion'],
  ['Backend', 'Node, Express, FastAPI, BullMQ + Redis, WebSockets'],
  ['Data', 'MongoDB, PostgreSQL, MySQL, SQLite, Supabase'],
  ['Ship it', 'Git, Vercel, Render, Razorpay, Figma, Claude Code'],
];

const DISH = { x: 56, y: 74.6 }; // where the icons emerge, % of stage

export default function Skills() {
  const ref = useRef(null);
  const open = useInView(ref, { once: true, amount: 0.45 });
  const [more, setMore] = useState(false);

  return (
    <section id="skills" className="section skills">
      <Title text="SKILLS & TOOLS" className="title-skills" />
      <Reveal y={16}>
        <p className="skills-hand">i always cook</p>
      </Reveal>
      <Reveal y={20}>
        <p className="skills-lead">
          Everything on the menu: the stack I use to take an idea from a blank file to a live product.
        </p>
      </Reveal>

      <div className="skills-body">
        <div className="cloche-stage" ref={ref}>

          <img className="chef" src="/assets/chef.png" alt="Atharva as a chef serving the stack" draggable="false" />

          {TOOLS.map((t, i) => {
            const dx = DISH.x - t.l;
            const dy = (DISH.y - t.t) * 0.667;
            t.d = 0.75 + (100 - t.t) * 0.012 + Math.abs(t.l - DISH.x) * 0.004; // bottom rows first, fountain-like
            return (
              <div className="tool-pos" key={t.n} style={{ left: `${t.l}%`, top: `${t.t}%` }}>
                <motion.div
                  className="tool-pop"
                  initial={{ x: `${dx}cqw`, y: `${dy}cqw`, scale: 0.15, opacity: 0, rotate: 0, rotateY: 90 }}
                  animate={open ? { x: 0, y: 0, scale: 1, opacity: 1, rotate: t.r, rotateY: 0 } : undefined}
                  transition={{
                    x: { type: 'spring', stiffness: 38, damping: 13, mass: 1, delay: t.d },
                    y: { type: 'spring', stiffness: 38, damping: 13, mass: 1, delay: t.d },
                    scale: { type: 'spring', stiffness: 90, damping: 14, delay: t.d },
                    rotateY: { type: 'spring', stiffness: 50, damping: 12, delay: t.d },
                    rotate: { duration: 1.2, delay: t.d },
                    opacity: { duration: 0.3, delay: t.d },
                  }}
                >
                  <div className="tool-float" style={{ animationDelay: `${(i % 6) * -0.9}s`, animationDuration: `${4 + (i % 4) * 0.7}s` }}>
                    <div className="tool" data-cursor={t.n}>
                      {t.icon}
                      <span className="tool-name">{t.n}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}

          <motion.div
            className="cloche-lid"
            initial={{ y: 0, x: 0, rotate: 0, rotateX: 0 }}
            animate={open ? { y: ['0%', '-45%', '-219%'], x: ['0%', '0%', '124%'], rotate: [0, 3, 16], rotateX: [0, 6, 18] } : undefined}
            transition={{ duration: 1.5, times: [0, 0.38, 1], ease: [0.65, 0, 0.3, 1], delay: 0.2 }}
          >
            <img src="/assets/lid.png" alt="" draggable="false" />
          </motion.div>
        </div>

        <Reveal y={24}>
          <button type="button" className="skills-toggle" aria-expanded={more} onClick={() => setMore((m) => !m)}>
            {more ? 'view less' : 'view more'}
          </button>
          <div className={`skills-more${more ? ' is-open' : ''}`}>
            <ul className="skills-list">
              {GROUPS.map(([h, d]) => (
                <li key={h}><b>{h}</b> {d}</li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
