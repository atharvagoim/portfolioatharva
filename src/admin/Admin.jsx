import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { api, getToken, setToken } from '../api.js';
import { Field, Text, Area, Toggle, ImageField } from './fields.jsx';
import { ProjectIcon } from '../site/Projects.jsx';
import './admin.css';

/* Fixed overlays (drawer, dialogs, save bar) must live on <body>: the animated tab
   wrapper keeps a CSS transform, which would otherwise trap position:fixed inside it
   and push the save buttons off-screen. */
const Portal = ({ children }) => createPortal(<div className="admin-layer">{children}</div>, document.body);

/* ---------------- toasts ---------------- */
function useToasts() {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, kind = 'ok') => {
    const id = Math.random();
    setItems((s) => [...s, { id, msg, kind }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3200);
  }, []);
  const view = (
    <div className="toasts">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} className={`toast toast-${t.kind}`} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  return [push, view];
}

/* ---------------- login ---------------- */
function Login({ onIn }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { const { token } = await api.login(pin); setToken(token); onIn(); }
    catch (e2) { setErr(e2.message); setPin(''); }
    finally { setBusy(false); }
  };
  return (
    <div className="login">
      <motion.form className="login-card" onSubmit={submit} initial={{ opacity: 0, y: 30 }}
        animate={err ? { x: [0, -10, 10, -6, 6, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }} key={err}>
        <img src="/assets/ready.png" alt="Ready?" className="login-ready" />
        <h1>Admin</h1>
        <p>Enter your PIN to manage the portfolio.</p>
        <input className="inp inp-pin" type="password" inputMode="numeric" autoComplete="current-password" autoFocus
          value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" aria-label="PIN" />
        {err && <div className="login-err">{err}</div>}
        <button className="a-btn a-btn-lime a-btn-block" disabled={busy || !pin}>{busy ? 'checking…' : 'Unlock'}</button>
        <a href="/" className="login-back">← back to site</a>
      </motion.form>
    </div>
  );
}

/* ---------------- project editor ---------------- */
const EMPTY = { title: '', tagline: '', description: '', tags: [], year: String(new Date().getFullYear()), category: '', accent: '#B9B4F0', icon: '', logo: '', cover: '', liveUrl: '', repoUrl: '', hidden: false };

function ProjectEditor({ initial, onClose: close, onSaved, toast }) {
  const [p, setP] = useState(() => ({ ...EMPTY, ...initial, tagsText: (initial?.tags || []).join(', ') }));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const set = (k) => (v) => { setP((s) => ({ ...s, [k]: v })); setDirty(true); };
  const isNew = !initial?.id;
  // don't silently throw away edits on Esc / backdrop click / Cancel
  const onClose = () => { if (!dirty || window.confirm('Discard your unsaved changes to this project?')) close(); };
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = async () => {
    if (saving) return;
    if (!p.title.trim()) return toast('Title is required', 'err');
    setSaving(true);
    const { tagsText, id, order, createdAt, ...rest } = p;
    const body = { ...rest, tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean) };
    try {
      const saved = isNew ? await api.createProject(body) : await api.updateProject(initial.id, body);
      toast(isNew ? 'Project added' : 'Project saved');
      onSaved(saved);
    } catch (e) { toast(e.message, 'err'); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const preview = { ...p, tags: p.tagsText.split(',').map((t) => t.trim()).filter(Boolean) };

  return (
    <motion.div className="drawer-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside className="drawer" onClick={(e) => e.stopPropagation()}
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
        <header className="drawer-head">
          <h2>{isNew ? 'New project' : 'Edit project'}</h2>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={onClose}>close</button>
        </header>

        <div className="drawer-body">
          <div className="preview">
            <span className="preview-label">carousel preview</span>
            <div className="preview-card">
              <div className="car-icon"><ProjectIcon project={preview} /></div>
            </div>
            <strong>{p.title || 'Project title'}</strong>
            <p>{p.description || 'Description shows here.'}</p>
          </div>

          <div className="form-grid">
            <Field label="Title" wide><Text value={p.title} onChange={set('title')} placeholder="Productivity Agent" /></Field>
            <Field label="Description" hint="shown under the carousel" wide><Area value={p.description} onChange={set('description')} rows={4} /></Field>
            <ImageField label="Icon" hint="shown in the carousel card · transparent PNG/SVG works best" value={p.icon} onChange={set('icon')} maxSize={600} onError={(m) => toast(m, 'err')} square />
            <ImageField label="Logo" hint="optional · used if no icon, and in the detail view" value={p.logo} onChange={set('logo')} maxSize={600} onError={(m) => toast(m, 'err')} square />
            <ImageField label="Cover / screenshot" hint="optional · top of the detail popup" value={p.cover} onChange={set('cover')} maxSize={1400} quality={0.8} onError={(m) => toast(m, 'err')} />
            <div className="form-col">
              <Field label="Live URL"><Text value={p.liveUrl} onChange={set('liveUrl')} placeholder="https://…" type="url" /></Field>
              <Field label="Repo URL"><Text value={p.repoUrl} onChange={set('repoUrl')} placeholder="https://github.com/…" type="url" /></Field>
              <Field label="Tags" hint="comma separated"><Text value={p.tagsText} onChange={set('tagsText')} placeholder="React, Node, MongoDB" /></Field>
              <div className="row-2">
                <Field label="Year"><Text value={p.year} onChange={set('year')} /></Field>
                <Field label="Category"><Text value={p.category} onChange={set('category')} placeholder="AI" /></Field>
              </div>
              <Field label="Tagline" hint="optional"><Text value={p.tagline} onChange={set('tagline')} /></Field>
              <Field label="Letter color" hint="when no icon is set">
                <div className="color-row"><input type="color" value={p.accent || '#B9B4F0'} onChange={(e) => set('accent')(e.target.value)} /><Text value={p.accent} onChange={set('accent')} /></div>
              </Field>
              <Toggle checked={p.hidden} onChange={set('hidden')} label="Hide from site" />
            </div>
          </div>
        </div>

        <footer className="drawer-foot">
          <span className="kbd-hint">ctrl/⌘ + S to save</span>
          <button className="a-btn a-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="a-btn a-btn-lime" onClick={save} disabled={saving}>{saving ? 'saving…' : isNew ? 'Add project' : 'Save changes'}</button>
        </footer>
      </motion.aside>
    </motion.div>
  );
}

/* ---------------- projects tab ---------------- */
function Row({ p, i, n, onEdit, onDelete, onMove, onToggle }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={p} dragListener={false} dragControls={controls} className={`prow ${p.hidden ? 'is-hidden' : ''}`}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} whileDrag={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,.5)' }}>
      <button className="handle" onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder">⋮⋮</button>
      <div className="prow-icon"><ProjectIcon project={p} /></div>
      <div className="prow-main">
        <strong>{p.title}</strong>
        <span>{p.description}</span>
      </div>
      <div className="prow-badges">
        {p.hidden && <em className="badge">hidden</em>}
        {p.liveUrl && <em className="badge badge-lime">live</em>}
      </div>
      <div className="prow-actions">
        <button className="a-btn a-btn-icon" onClick={() => onMove(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
        <button className="a-btn a-btn-icon" onClick={() => onMove(i, 1)} disabled={i === n - 1} aria-label="Move down">↓</button>
        <button className="a-btn a-btn-icon" onClick={() => onToggle(p)} aria-label={p.hidden ? 'Show' : 'Hide'} title={p.hidden ? 'Show on site' : 'Hide from site'}>{p.hidden ? '◌' : '●'}</button>
        <button className="a-btn a-btn-sm" onClick={() => onEdit(p)}>edit</button>
        <button className="a-btn a-btn-sm a-btn-danger" onClick={() => onDelete(p)}>delete</button>
      </div>
    </Reorder.Item>
  );
}

function ProjectsTab({ toast }) {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const orderTimer = useRef(null);

  useEffect(() => { api.projects().then(setList).catch((e) => toast(e.message, 'err')); }, [toast]);

  const persistOrder = (next) => {
    setList(next);
    clearTimeout(orderTimer.current);
    orderTimer.current = setTimeout(() => {
      api.reorder(next.map((p) => p.id)).then(() => toast('Order saved')).catch((e) => toast(e.message, 'err'));
    }, 600);
  };
  const move = (i, d) => { const next = [...list]; const [x] = next.splice(i, 1); next.splice(i + d, 0, x); persistOrder(next); };
  const toggle = async (p) => {
    try { const u = await api.updateProject(p.id, { hidden: !p.hidden }); setList((l) => l.map((x) => (x.id === u.id ? u : x))); toast(u.hidden ? 'Hidden from site' : 'Visible on site'); }
    catch (e) { toast(e.message, 'err'); }
  };
  const del = async () => {
    const p = confirm; setConfirm(null);
    try { await api.deleteProject(p.id); setList((l) => l.filter((x) => x.id !== p.id)); toast('Project deleted'); }
    catch (e) { toast(e.message, 'err'); }
  };
  const onSaved = (saved) => {
    setList((l) => (l.some((x) => x.id === saved.id) ? l.map((x) => (x.id === saved.id ? saved : x)) : [...l, saved]));
    setEditing(null);
  };

  return (
    <section>
      <div className="tab-head">
        <div>
          <h2>Projects <sup>{list?.length ?? ''}</sup></h2>
          <p>Drag ⋮⋮ (or use the arrows) to set the carousel order.</p>
        </div>
        <button className="a-btn a-btn-lime" onClick={() => setEditing({})}>+ New project</button>
      </div>

      {!list ? <div className="skeleton" /> : list.length === 0 ? (
        <div className="empty-box">No projects yet. <button className="link" onClick={() => setEditing({})}>Add your first one →</button></div>
      ) : (
        <Reorder.Group axis="y" values={list} onReorder={persistOrder} className="plist">
          <AnimatePresence initial={false}>
            {list.map((p, i) => (
              <Row key={p.id} p={p} i={i} n={list.length} onEdit={setEditing} onDelete={setConfirm} onMove={move} onToggle={toggle} />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      <Portal><AnimatePresence>
        {editing && <ProjectEditor key={editing.id || 'new'} initial={editing} onClose={() => setEditing(null)} onSaved={onSaved} toast={toast} />}
      </AnimatePresence></Portal>

      <Portal><AnimatePresence>
        {confirm && (
          <motion.div className="drawer-bg center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(null)}>
            <motion.div className="confirm" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>Delete “{confirm.title}”?</h3>
              <p>This can’t be undone.</p>
              <div className="confirm-actions">
                <button className="a-btn a-btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
                <button className="a-btn a-btn-danger-solid" onClick={del} autoFocus>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence></Portal>
    </section>
  );
}

/* ---------------- site content tab ---------------- */
const CONTACT_FIELDS = [
  ['github', 'GitHub', 'username or URL'],
  ['linkedin', 'LinkedIn', 'username or URL'],
  ['instagram', 'Instagram', 'username or URL'],
  ['whatsapp', 'WhatsApp', 'number with country code, e.g. 919876543210'],
  ['email', 'Email', 'you@example.com'],
  ['phone', 'Phone', '+91 98765 43210'],
];

function SettingsTab({ toast, onDirty }) {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    onDirty?.(dirty);
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, onDirty]);
  useEffect(() => () => onDirty?.(false), [onDirty]);

  useEffect(() => { api.site().then((d) => setS(d.settings)).catch((e) => toast(e.message, 'err')); }, [toast]);

  const set = (k) => (v) => { setS((x) => ({ ...x, [k]: v })); setDirty(true); };
  const setC = (k) => (v) => { setS((x) => ({ ...x, contacts: { ...(x.contacts || {}), [k]: v } })); setDirty(true); };
  const setX = (i, k) => (v) => { setS((x) => ({ ...x, experience: x.experience.map((e, j) => (j === i ? { ...e, [k]: v } : e)) })); setDirty(true); };
  const addX = () => { setS((x) => ({ ...x, experience: [...(x.experience || []), { title: '', text: '', linkLabel: '', linkUrl: '', image: '' }] })); setDirty(true); };
  const delX = (i) => { setS((x) => ({ ...x, experience: x.experience.filter((_, j) => j !== i) })); setDirty(true); };
  const moveX = (i, d) => { setS((x) => { const e = [...x.experience]; const [it] = e.splice(i, 1); e.splice(i + d, 0, it); return { ...x, experience: e }; }); setDirty(true); };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try { setS(await api.saveSettings(s)); setDirty(false); toast('Site content saved'); }
    catch (e) { toast(e.message, 'err'); }
    finally { setSaving(false); }
  };

  if (!s) return <div className="skeleton" />;
  return (
    <section>
      <div className="tab-head">
        <div><h2>Site content</h2><p>Text, links and contact details shown on the portfolio.</p></div>
      </div>

      <div className="card-block">
        <h3>About me</h3>
        <div className="form-grid">
          <Field label="Your name"><Text value={s.name} onChange={set('name')} /></Field>
          <Field label="Role" hint="used in page title"><Text value={s.role} onChange={set('role')} /></Field>
          <Field label="About text" wide><Area value={s.about} onChange={set('about')} rows={6} /></Field>
          <Field label="Button label"><Text value={s.serviceLabel} onChange={set('serviceLabel')} placeholder="my service website" /></Field>
          <Field label="Button link"><Text value={s.serviceUrl} onChange={set('serviceUrl')} placeholder="https://…" type="url" /></Field>
        </div>
      </div>

      <div className="card-block">
        <div className="block-head"><h3>Experience</h3><button className="a-btn a-btn-sm" onClick={addX}>+ add entry</button></div>
        {(s.experience || []).map((x, i) => (
          <div className="xp-edit" key={i}>
            <div className="xp-edit-head">
              <strong>#{i + 1} {x.title}</strong>
              <div className="prow-actions">
                <button className="a-btn a-btn-icon" onClick={() => moveX(i, -1)} disabled={i === 0}>↑</button>
                <button className="a-btn a-btn-icon" onClick={() => moveX(i, 1)} disabled={i === s.experience.length - 1}>↓</button>
                <button className="a-btn a-btn-sm a-btn-danger" onClick={() => delX(i)}>remove</button>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Title" hint="shown when you have more than one"><Text value={x.title} onChange={setX(i, 'title')} /></Field>
              <ImageField label="Image" hint="optional · defaults to the retro PC" value={x.image} onChange={setX(i, 'image')} maxSize={1100} onError={(m) => toast(m, 'err')} />
              <Field label="Description" wide><Area value={x.text} onChange={setX(i, 'text')} rows={6} /></Field>
              <Field label="Button label"><Text value={x.linkLabel} onChange={setX(i, 'linkLabel')} placeholder="www.example.com" /></Field>
              <Field label="Button link"><Text value={x.linkUrl} onChange={setX(i, 'linkUrl')} placeholder="https://…" type="url" /></Field>
            </div>
          </div>
        ))}
      </div>

      <div className="card-block">
        <h3>Contact</h3>
        <div className="form-grid">
          {CONTACT_FIELDS.map(([k, l, ph]) => (
            <Field key={k} label={l}><Text value={s.contacts?.[k]} onChange={setC(k)} placeholder={ph} /></Field>
          ))}
          <ImageField label="Icon next to CONTACT" hint="optional" value={s.contactIcon} onChange={set('contactIcon')} maxSize={300} onError={(m) => toast(m, 'err')} square />
        </div>
      </div>

      <Portal><AnimatePresence>
        {dirty && (
          <motion.div className="savebar" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}>
            <span>You have unsaved changes</span>
            <button className="a-btn a-btn-lime" onClick={save} disabled={saving}>{saving ? 'saving…' : 'Save changes'}</button>
          </motion.div>
        )}
      </AnimatePresence></Portal>
    </section>
  );
}

/* ---------------- shell ---------------- */
export default function Admin() {
  const [state, setState] = useState(getToken() ? 'checking' : 'out');
  const [tab, setTab] = useState('projects');
  const [toast, toasts] = useToasts();
  const settingsDirty = useRef(false);
  const onDirty = useCallback((d) => { settingsDirty.current = d; }, []);
  const switchTab = (k) => {
    if (k === tab) return;
    if (settingsDirty.current && !window.confirm('You have unsaved site content. Leave without saving?')) return;
    settingsDirty.current = false;
    setTab(k);
  };

  useEffect(() => {
    const out = () => { setState((s) => { if (s === 'in') toast('Session expired, please log in again', 'err'); return 'out'; }); };
    window.addEventListener('pf:logout', out);
    return () => window.removeEventListener('pf:logout', out);
  }, [toast]);

  useEffect(() => {
    document.title = 'Admin | Portfolio';
    if (state !== 'checking') return;
    api.me().then(() => setState('in')).catch(() => { setToken(null); setState('out'); });
  }, [state]);

  const logout = () => {
    if (settingsDirty.current && !window.confirm('You have unsaved site content. Log out anyway?')) return;
    settingsDirty.current = false;
    setToken(null); setState('out');
  };

  if (state === 'checking') return <div className="admin-loading">loading…</div>;
  if (state === 'out') return <div className="admin"><Login onIn={() => setState('in')} />{toasts}</div>;

  return (
    <div className="admin">
      <header className="a-top">
        <div className="a-brand"><img src="/assets/key-0.webp" alt="" /><span>Portfolio admin</span></div>
        <nav className="a-tabs">
          {[['projects', 'Projects'], ['site', 'Site content']].map(([k, l]) => (
            <button key={k} className={tab === k ? 'is-on' : ''} onClick={() => switchTab(k)}>
              {tab === k && <motion.i layoutId="tab-bg" className="a-tab-bg" />}
              <span>{l}</span>
            </button>
          ))}
        </nav>
        <div className="a-top-actions">
          <a className="a-btn a-btn-ghost a-btn-sm" href="/" target="_blank" rel="noreferrer">view site ↗</a>
          <button className="a-btn a-btn-sm" onClick={logout}>log out</button>
        </div>
      </header>
      <main className="a-main">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            {tab === 'projects' ? <ProjectsTab toast={toast} /> : <SettingsTab toast={toast} onDirty={onDirty} />}
          </motion.div>
        </AnimatePresence>
      </main>
      {toasts}
    </div>
  );
}
