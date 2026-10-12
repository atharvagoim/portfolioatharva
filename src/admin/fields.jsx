import { useRef, useState } from 'react';
import { imageToDataUrl } from './image.js';

export function Field({ label, hint, children, wide }) {
  return (
    <label className={`f ${wide ? 'f-wide' : ''}`}>
      <span className="f-label">{label}{hint && <em>{hint}</em>}</span>
      {children}
    </label>
  );
}

export function Text({ value, onChange, ...rest }) {
  return <input className="inp" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export function Area({ value, onChange, rows = 5, ...rest }) {
  return <textarea className="inp" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" className={`toggle ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
      <i /><span>{label}</span>
    </button>
  );
}

/** Drag-drop / click / paste-URL image picker that stores a data URL (or plain URL) */
export function ImageField({ label, hint, value, onChange, maxSize = 512, quality = 0.9, onError, square }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async (file) => {
    if (!file) return;
    setBusy(true);
    try { onChange(await imageToDataUrl(file, maxSize, quality)); }
    catch (e) { onError?.(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="f">
      <span className="f-label">{label}{hint && <em>{hint}</em>}</span>
      <div
        className={`drop ${over ? 'is-over' : ''} ${value ? 'has-img' : ''} ${square ? 'is-square' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files?.[0]); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}
      >
        {value ? <img src={value} alt="" /> : <span className="drop-hint">{busy ? 'processing…' : 'drop image or click'}</span>}
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <div className="drop-row">
        <input
          className="inp inp-sm"
          placeholder="…or paste an image URL"
          value={value && !value.startsWith('data:') ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && <button type="button" className="a-btn a-btn-sm a-btn-danger" onClick={() => onChange('')}>remove</button>}
      </div>
    </div>
  );
}
