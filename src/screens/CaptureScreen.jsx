import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Icon } from '../icons.jsx';
import { Thumb } from '../ui.jsx';
import { COLLECTIONS, COL, FIELD_SCHEMA, IMAGE_SLOTS } from '../data.js';
import { lookupBarcode, searchText } from '../discogs.js';

// ─── useCamera ───────────────────────────────────────────────────────────────
function useCamera() {
  const videoRef         = useRef(null);
  const streamRef        = useRef(null);
  const captureCanvasRef = useRef(null);
  const scanCanvasRef    = useRef(null);
  const [camState, setCamState]       = useState('idle');
  const [capturedImg, setCapturedImg] = useState(null);
  const [facingMode, setFacingMode]   = useState('environment');

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const start = useCallback(async (facing = 'environment') => {
    stop();
    setCapturedImg(null);
    setCamState('loading');
    if (!navigator.mediaDevices?.getUserMedia) { setCamState('unsupported'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamState('live');
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamState('live');
      } catch {
        setCamState('denied');
      }
    }
  }, [stop]);

  const capture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImg(dataUrl);
    setCamState('captured');
    stop();
    return dataUrl;
  }, [stop]);

  const retake = useCallback(() => {
    setCapturedImg(null);
    start(facingMode);
  }, [start, facingMode]);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    start(next);
  }, [facingMode, start]);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, captureCanvasRef, scanCanvasRef, camState, setCamState, capturedImg, setCapturedImg, start, capture, retake, flipCamera };
}

// ─── useBarcodeScanner ───────────────────────────────────────────────────────
function useBarcodeScanner({ videoRef, scanCanvasRef, active, onDetected }) {
  const readerRef   = useRef(null);
  const rafRef      = useRef(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      detectedRef.current = false;
      return;
    }
    if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
    detectedRef.current = false;

    const tick = () => {
      if (detectedRef.current) return;
      const video  = videoRef.current;
      const canvas = scanCanvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      try {
        const result = readerRef.current.decodeFromCanvas(canvas);
        detectedRef.current = true;
        onDetected(result.getText());
      } catch {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); detectedRef.current = false; };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── SearchPanel ─────────────────────────────────────────────────────────────
function SearchPanel({ onSelect, onSkip }) {
  const [artista, setArtista] = useState('');
  const [titolo,  setTitolo]  = useState('');
  const [state,   setState]   = useState('idle'); // idle | searching | results | error
  const [results, setResults] = useState([]);

  const canSearch = artista.trim() || titolo.trim();

  const doSearch = async (e) => {
    e.preventDefault();
    if (!canSearch) return;
    setState('searching');
    try {
      const res = await searchText({ artista: artista.trim(), titolo: titolo.trim() });
      setResults(res);
      setState('results');
    } catch (err) {
      console.error('[Discogs search]', err);
      setState('error');
    }
  };

  return (
    <div className="cz-search-panel">
      <form className="cz-search-form" onSubmit={doSearch}>
        <input
          className="cz-search-input"
          value={artista}
          onChange={e => setArtista(e.target.value)}
          placeholder="Artista"
          autoComplete="off"
          disabled={state === 'searching'}
        />
        <input
          className="cz-search-input"
          value={titolo}
          onChange={e => setTitolo(e.target.value)}
          placeholder="Titolo"
          autoComplete="off"
          disabled={state === 'searching'}
        />
        <button
          type="submit"
          className="cz-btn cz-btn-primary"
          disabled={!canSearch || state === 'searching'}
          style={{ width: '100%' }}
        >
          {state === 'searching'
            ? <><span className="cz-spinner cz-spinner-sm" /> Ricerca…</>
            : <><Icon name="search" size={17} stroke={2.2} /> Cerca su Discogs</>}
        </button>
      </form>

      {state === 'error' && (
        <p className="cz-search-msg">Errore di rete — riprova.</p>
      )}

      {state === 'results' && results.length === 0 && (
        <div className="cz-search-empty">
          <p>Nessun risultato trovato.</p>
          <button className="cz-btn cz-btn-ghost" style={{ width: '100%' }} onClick={onSkip}>
            Compila manualmente
          </button>
        </div>
      )}

      {state === 'results' && results.length > 0 && (
        <ul className="cz-result-list">
          {results.map((r, i) => (
            <li key={i}>
              <button className="cz-result-item" onClick={() => onSelect(r)}>
                {r._coverUrl
                  ? <img src={r._coverUrl} className="cz-result-thumb" alt="" />
                  : <div className="cz-result-thumb cz-result-thumb--ph"><Icon name="disc" size={20} stroke={1.8} /></div>
                }
                <div className="cz-result-body">
                  <div className="cz-result-title">{r.artista ? `${r.artista} — ${r.titolo}` : r.titolo}</div>
                  <div className="cz-result-meta">
                    {[r.anno, r.etichetta, r.formato].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <Icon name="chevR" size={18} style={{ color: 'rgba(255,255,255,.4)', flexShrink: 0 }} />
              </button>
            </li>
          ))}
          <li>
            <button className="cz-result-skip" onClick={onSkip}>
              Nessuno di questi — compila manualmente
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

// ─── CaptureScreen ───────────────────────────────────────────────────────────
export function CaptureScreen({ capCol, setCapCol, onShutter, onClose }) {
  const c       = capCol ? COL[capCol] : null;
  const isDischi = capCol === 'dischi';
  const slots   = capCol ? IMAGE_SLOTS[capCol] : [];

  // 'barcode' | 'search' — solo per collezione dischi
  const [scanMode, setScanMode] = useState('barcode');
  const barcode = isDischi ? scanMode === 'barcode' : c?.capture !== 'barcode';

  const {
    videoRef, captureCanvasRef, scanCanvasRef,
    camState, capturedImg, setCapturedImg,
    start, capture, retake, flipCamera,
  } = useCamera();

  const [lookupState, setLookupState] = useState('idle');
  const [lookupMsg,   setLookupMsg]   = useState('');

  const startedRef = useRef(false);
  useEffect(() => {
    if (!capCol) return;
    startedRef.current = false;
  }, [capCol]);

  useEffect(() => {
    if (!capCol) return;
    if (startedRef.current) return;
    // In search mode, no camera needed
    if (isDischi && scanMode === 'search') return;
    startedRef.current = true;
    start('environment');
  }, [capCol, scanMode, isDischi, start]);

  useEffect(() => {
    setLookupState('idle');
    setLookupMsg('');
  }, [capCol, scanMode]);

  // ── Switch scan mode (barcode <-> search) ────────────────────────────────
  const switchMode = (mode) => {
    setScanMode(mode);
    startedRef.current = false;
    setCapturedImg(null);
  };

  // ── Barcode detected ─────────────────────────────────────────────────────
  const handleBarcode = useCallback(async (code) => {
    setLookupState('searching');
    setLookupMsg(`Codice: ${code}`);
    const photo = capture();
    try {
      const data = await lookupBarcode(code);
      onShutter(data ? { ...data, _photo: photo || undefined } : { _photo: photo || undefined, _noResults: true });
    } catch (err) {
      console.error('Discogs lookup failed:', err);
      onShutter({ _photo: photo || undefined, _noResults: true });
    }
  }, [capture, onShutter]);

  useBarcodeScanner({
    videoRef,
    scanCanvasRef,
    active: isDischi && scanMode === 'barcode' && camState === 'live',
    onDetected: handleBarcode,
  });

  // ── Manual shutter (photo mode) ──────────────────────────────────────────
  const handleShutter = () => { if (camState === 'live') capture(); };
  const handleConfirm = () => { onShutter({ _photo: capturedImg || undefined }); };

  const isLive      = camState === 'live';
  const isCaptured  = camState === 'captured';
  const isDenied    = camState === 'denied' || camState === 'unsupported';
  const isSearching = lookupState === 'searching';
  const showCamera  = !(isDischi && scanMode === 'search');

  return (
    <div className="cz-capture">
      {/* ── Top controls ── */}
      <div className="cz-cap-top">
        <div className="cz-cap-toprow">
          <button className="cz-cap-x" onClick={onClose} title="Chiudi"><Icon name="x" size={20} /></button>
          {isDischi ? (
            <div className="cz-scan-tabs">
              <button
                className="cz-scan-tab"
                data-active={scanMode === 'barcode'}
                onClick={() => switchMode('barcode')}
              >
                <Icon name="scan" size={14} stroke={2.1} /> Barcode
              </button>
              <button
                className="cz-scan-tab"
                data-active={scanMode === 'search'}
                onClick={() => switchMode('search')}
              >
                <Icon name="search" size={14} stroke={2.1} /> Cerca
              </button>
            </div>
          ) : (
            <div className="cz-cap-mode">
              <Icon name="camera" size={16} stroke={2.1} /> Foto oggetto
            </div>
          )}
        </div>
        {showCamera && (
          <div className="cz-chiprow">
            {COLLECTIONS.map((col) =>
              <button key={col.id} className="cz-chip" data-on={col.id === capCol} onClick={() => setCapCol(col.id)}>
                <Icon name={col.icon} size={15} stroke={2.1} /> {col.short}
              </button>
            )}
          </div>
        )}
        {!showCamera && (
          <div className="cz-chiprow" style={{ justifyContent: 'center', paddingTop: 4 }}>
            <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>Discogs — ricerca testuale</span>
          </div>
        )}
      </div>

      {/* ── Search panel (solo dischi + search mode) ── */}
      {isDischi && scanMode === 'search' ? (
        <div className="cz-viewfinder cz-viewfinder--search">
          <SearchPanel
            onSelect={(result) => onShutter(result)}
            onSkip={() => onShutter({ _noResults: true })}
          />
        </div>
      ) : (
        <>
          {/* ── Viewfinder ── */}
          <div className="cz-viewfinder">
            <video
              ref={videoRef}
              className="cz-vf-video"
              autoPlay playsInline muted
              style={{ display: isLive || isSearching ? 'block' : 'none' }}
            />

            {isCaptured && capturedImg && (
              <img src={capturedImg} className="cz-vf-video" alt="Foto scattata" />
            )}

            {!capCol && (
              <div className="cz-cap-nocol">Seleziona una raccolta per iniziare</div>
            )}

            {capCol && camState === 'loading' && (
              <div className="cz-cam-status">
                <div className="cz-spinner" style={{ borderTopColor: '#fff' }} />
                <span>Avvio fotocamera…</span>
              </div>
            )}

            {capCol && isDenied && (
              <div className="cz-cam-denied">
                <div className="cz-cam-denied-ico"><Icon name="camera" size={30} stroke={1.8} /></div>
                <p className="cz-cam-denied-title">Fotocamera non accessibile</p>
                <p className="cz-cam-denied-sub">
                  {camState === 'unsupported'
                    ? 'Il tuo browser non supporta l\'accesso alla fotocamera.'
                    : 'Hai negato l\'accesso alla fotocamera. Vai nelle impostazioni del browser, consenti la fotocamera per questo sito, poi ricarica la pagina.'}
                </p>
              </div>
            )}

            {isSearching && (
              <div className="cz-recog">
                <div className="cz-spinner" />
                <div style={{ textAlign: 'center' }}>
                  <div className="cz-recog-txt">Ricerca su Discogs…</div>
                  <div className="cz-recog-sub">{lookupMsg}</div>
                </div>
              </div>
            )}

            {capCol && isLive && isDischi && scanMode === 'barcode' && (
              <div className="cz-reticle cz-reticle-overlay">
                <span className="cz-corner tl" /><span className="cz-corner tr" />
                <span className="cz-corner bl" /><span className="cz-corner br" />
                <div className="cz-scanline" />
              </div>
            )}

            {capCol && isLive && !isDischi && (
              <div className="cz-objframe cz-objframe-overlay">
                <span className="cz-corner tl" /><span className="cz-corner tr" />
                <span className="cz-corner bl" /><span className="cz-corner br" />
              </div>
            )}

            {capCol && isLive && (
              <div className="cz-vf-hint">
                {isDischi && scanMode === 'barcode'
                  ? 'Inquadra il codice a barre sul retro del disco — rilevamento automatico'
                  : `Inquadra ${slots.length > 1 ? 'il fronte del' : "l'intero"} ${c?.singular} nel riquadro`}
              </div>
            )}

            {isCaptured && (
              <div className="cz-cap-confirm">
                <button className="cz-btn cz-btn-ghost cz-cap-confirm-btn" onClick={retake}>
                  <Icon name="flip" size={18} stroke={2.1} /> Rifai
                </button>
                <button className="cz-btn cz-btn-primary cz-cap-confirm-btn" onClick={handleConfirm}>
                  <Icon name="check" size={18} stroke={2.4} /> Usa foto
                </button>
              </div>
            )}
          </div>

          <canvas ref={captureCanvasRef} style={{ display: 'none' }} />
          <canvas ref={scanCanvasRef}    style={{ display: 'none' }} />

          {/* ── Shutter bar ── */}
          <div className="cz-cap-bottom">
            <button className="cz-cap-side" style={{ opacity: 0.4, cursor: 'default' }}>
              <Icon name="image" size={22} stroke={2.1} />
            </button>
            {isDischi && scanMode === 'barcode' ? (
              <div className="cz-shutter cz-shutter-auto" aria-label="Rilevamento automatico">
                <Icon name="scan" size={26} stroke={1.8} style={{ color: 'rgba(255,255,255,.5)' }} />
              </div>
            ) : (
              <button
                className="cz-shutter"
                onClick={handleShutter}
                disabled={!isLive}
                style={{ display: isCaptured ? 'none' : 'grid' }}
                aria-label="Scatta"
              >
                <span />
              </button>
            )}
            {isCaptured && <div style={{ width: 74, height: 74 }} />}
            <button className="cz-cap-side" onClick={flipCamera} disabled={!isLive} title="Cambia fotocamera">
              <Icon name="flip" size={22} stroke={2.1} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
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

// ─── CustomFields ─────────────────────────────────────────────────────────────
function CustomFields({ item, onChange }) {
  const custom = item.custom || [];
  const update = (i, patch) => onChange({ custom: custom.map((f, idx) => idx === i ? { ...f, ...patch } : f) });
  const add    = () => onChange({ custom: [...custom, { label: '', value: '' }] });
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
          <button className="cz-iconbtn" style={{ marginBottom: 1 }} onClick={() => remove(i)} title="Rimuovi">
            <Icon name="x" size={18} />
          </button>
        </div>
      )}
      <button className="cz-addfield" onClick={add}><Icon name="plus" size={16} stroke={2.4} /> Aggiungi campo libero</button>
    </>
  );
}

// ─── DetailScreen ─────────────────────────────────────────────────────────────
export function DetailScreen({ item, mode, onChange, onSave, onClose, onDelete }) {
  const c      = COL[item.collection];
  const schema = FIELD_SCHEMA[item.collection];
  const slots  = IMAGE_SLOTS[item.collection];
  const set    = (k, v) => onChange({ [k]: v });
  const cap    = (s) => s.charAt(0).toUpperCase() + s.slice(1);

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
          <span className="cz-saved-chip" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
            <Icon name="sparkle" size={13} stroke={2.2} /> {item.artista ? 'Trovato su Discogs' : 'Nuovo'}
          </span>
        )}
      </div>

      <div className="cz-detail-body">
        {item._noResults && (
          <div className="cz-no-results-banner">
            <Icon name="search" size={16} stroke={2} />
            Nessun risultato trovato — compila manualmente
          </div>
        )}

        <div className="cz-imgrow">
          {slots.map((s) =>
            <div className="cz-imslot" key={s.key}>
              {item._coverUrl ? (
                <img src={item._coverUrl} className="cz-imslot-cover" alt={s.label} />
              ) : (
                <Thumb label={s.label} icon="image" />
              )}
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
