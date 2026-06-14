import React from 'react';
import { Icon } from '../icons.jsx';
import { Thumb } from '../ui.jsx';
import { COLLECTIONS, COL, FIELD_SCHEMA, IMAGE_SLOTS } from '../data.js';
import { BarcodeBars } from '../ui.jsx';

export function CaptureScreen({ capCol, setCapCol, status, onShutter, onClose, autoAdd, setAutoAdd }) {
  const c = capCol ? COL[capCol] : null;
  const barcode = c && c.capture === 'barcode';
  const slots = capCol ? IMAGE_SLOTS[capCol] : [];

  return (
    <div className="cz-capture">
      <div className="cz-cap-top">
        <div className="cz-cap-toprow">
          <button className="cz-cap-x" onClick={onClose} title="Chiudi"><Icon name="x" size={20} /></button>
          <div className="cz-cap-mode">
            <Icon name={barcode ? 'scan' : 'camera'} size={16} stroke={2.1} />
            {barcode ? 'Scansione barcode' : 'Foto oggetto'}
          </div>
        </div>
        <div className="cz-chiprow">
          {COLLECTIONS.map((col) =>
            <button key={col.id} className="cz-chip" data-on={col.id === capCol} onClick={() => setCapCol(col.id)}>
              <Icon name={col.icon} size={15} stroke={2.1} />
              {col.short}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 2 }}>
          <button className="cz-autoadd" data-on={autoAdd} onClick={() => setAutoAdd(!autoAdd)}>
            <Icon name={autoAdd ? 'check' : 'plus'} size={14} stroke={2.4} />
            {autoAdd ? 'Aggiungi subito' : 'Modifica prima di salvare'}
          </button>
        </div>
      </div>

      <div className="cz-viewfinder">
        {!capCol ? (
          <div className="cz-cap-nocol">Seleziona una raccolta per iniziare</div>
        ) : barcode ? (
          <div className="cz-reticle">
            <span className="cz-corner tl" /><span className="cz-corner tr" />
            <span className="cz-corner bl" /><span className="cz-corner br" />
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <BarcodeBars />
            </div>
            <div className="cz-scanline" />
          </div>
        ) : (
          <div className="cz-objframe">
            <span className="cz-corner tl" /><span className="cz-corner tr" />
            <span className="cz-corner bl" /><span className="cz-corner br" />
          </div>
        )}
        {capCol && (
          <div className="cz-vf-hint">
            {barcode
              ? 'Inquadra il codice a barre sul retro del disco'
              : `Inquadra ${slots.length > 1 ? 'il fronte del' : "l'intero"} ${c && c.singular} nel riquadro`}
          </div>
        )}
      </div>

      <div className="cz-cap-bottom">
        <button className="cz-cap-side" title="Galleria"><Icon name="image" size={22} stroke={2.1} /></button>
        <button className="cz-shutter" onClick={onShutter} disabled={!capCol} aria-label="Scatta"><span /></button>
        <button className="cz-cap-side" title={barcode ? 'Inserisci a mano' : 'Cambia fotocamera'}>
          <Icon name={barcode ? 'pencil' : 'flip'} size={22} stroke={2.1} />
        </button>
      </div>

      {status === 'recognizing' && (
        <div className="cz-recog">
          <div className="cz-spinner" />
          <div style={{ textAlign: 'center' }}>
            <div className="cz-recog-txt">Riconoscimento in corso…</div>
            <div className="cz-recog-sub">{barcode ? 'Lettura del codice e ricerca nel database' : 'Analisi dell\'immagine'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ field, item, set }) {
  if (field.row) {
    return (
      <div className="cz-field-row">
        {field.fields.map((f) => <Field key={f.key} field={f} item={item} set={set} />)}
      </div>
    );
  }
  const val = item[field.key] || '';
  let control;
  if (field.type === 'select') {
    const opts = field.options.includes(val) || !val ? field.options : [val, ...field.options];
    control = (
      <select className="cz-select" value={val} onChange={(e) => set(field.key, e.target.value)}>
        <option value="" disabled>Seleziona…</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  } else if (field.type === 'textarea') {
    control = <textarea className="cz-textarea" value={val} onChange={(e) => set(field.key, e.target.value)} placeholder="Aggiungi una nota…" />;
  } else {
    control = <input className="cz-input" value={val} onChange={(e) => set(field.key, e.target.value)} placeholder={field.label} />;
  }
  return (
    <div className="cz-field">
      <label>{field.label}</label>
      {control}
    </div>
  );
}

function CustomFields({ item, onChange }) {
  const custom = item.custom || [];
  const update = (i, patch) => {
    const next = custom.map((f, idx) => idx === i ? { ...f, ...patch } : f);
    onChange({ custom: next });
  };
  const add = () => onChange({ custom: [...custom, { label: '', value: '' }] });
  const remove = (i) => onChange({ custom: custom.filter((_, idx) => idx !== i) });
  return (
    <>
      {custom.map((f, i) =>
        <div className="cz-customfield" key={i}>
          <div className="cz-field" style={{ flex: '0 0 38%' }}>
            <label>Campo</label>
            <input className="cz-input" value={f.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="es. Provenienza" />
          </div>
          <div className="cz-field">
            <label>Valore</label>
            <input className="cz-input" value={f.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="es. Mercatino, 2019" />
          </div>
          <button className="cz-iconbtn" style={{ marginBottom: 1 }} onClick={() => remove(i)} title="Rimuovi"><Icon name="x" size={18} /></button>
        </div>
      )}
      <button className="cz-addfield" onClick={add}><Icon name="plus" size={16} stroke={2.4} /> Aggiungi campo libero</button>
    </>
  );
}

export function DetailScreen({ item, mode, onChange, onSave, onClose, onDelete }) {
  const c = COL[item.collection];
  const schema = FIELD_SCHEMA[item.collection];
  const slots = IMAGE_SLOTS[item.collection];
  const set = (k, v) => onChange({ [k]: v });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="cz-detail">
      <div className="cz-detail-top">
        <button className="cz-iconbtn" onClick={onClose} title="Chiudi" style={{ marginLeft: -6 }}>
          <Icon name={mode === 'new' ? 'back' : 'x'} size={20} />
        </button>
        <h2>{mode === 'new' ? `Nuovo ${c.singular}` : cap(c.singular)}</h2>
        {mode === 'saved' ? (
          <span className="cz-saved-chip"><Icon name="check" size={14} stroke={2.6} /> Salvato</span>
        ) : (
          <span className="cz-saved-chip" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}><Icon name="sparkle" size={13} stroke={2.2} /> Riconosciuto</span>
        )}
      </div>

      <div className="cz-detail-body">
        <div className="cz-imgrow">
          {slots.map((s) =>
            <div className="cz-imslot" key={s.key}>
              <Thumb label={s.label} icon="image" />
              <div className="cz-imslot-cap"><Icon name="camera" size={13} stroke={2} /> Tocca per sostituire</div>
            </div>
          )}
        </div>

        <div className="cz-fields">
          {schema.map((f, i) => <Field key={f.key || 'row' + i} field={f} item={item} set={set} />)}
          {item.collection === 'altro' && <CustomFields item={item} onChange={onChange} />}
        </div>
      </div>

      <div className="cz-detail-foot">
        {mode === 'new' ? (
          <>
            <button className="cz-btn cz-btn-ghost" onClick={onClose}>Annulla</button>
            <button className="cz-btn cz-btn-primary cz-btn-lg" style={{ flex: 1 }} onClick={onSave}>
              <Icon name="check" size={19} stroke={2.4} /> Salva nella collezione
            </button>
          </>
        ) : (
          <>
            <button className="cz-btn cz-btn-danger" onClick={onDelete} title="Elimina"><Icon name="trash" size={19} /></button>
            <button className="cz-btn cz-btn-primary cz-btn-lg" style={{ flex: 1 }} onClick={onClose}>
              <Icon name="check" size={19} stroke={2.4} /> Fatto
            </button>
          </>
        )}
      </div>
    </div>
  );
}
