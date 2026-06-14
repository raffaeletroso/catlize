import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from './icons.jsx';
import { COLLECTIONS, COL, SEED_ITEMS, recognise } from './data.js';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { BrowseScreen } from './screens/BrowseScreen.jsx';
import { CaptureScreen, DetailScreen } from './screens/CaptureScreen.jsx';

const DEVICES = {
  mobile:  { w: 390,  h: 844,  r: 44 },
  tablet:  { w: 834,  h: 1112, r: 28 },
  desktop: { w: 1320, h: 840,  r: 16 },
  fluido:  null,
};

const ALL_COLLECTION = { id:'all', name:'Tutte le collezioni', short:'Tutto', singular:'risultato', icon:'search', capture:'photo' };

function onAccent(hex) {
  const c = (hex || '').replace('#', '');
  if (c.length < 6) return '#fff';
  const ch = (i) => parseInt(c.slice(i, i + 2), 16) / 255;
  const lin = (x) => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  const L = 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(2)) + 0.0722 * lin(ch(4));
  return L > 0.45 ? '#1b1604' : '#ffffff';
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [device, setDevice] = useState('fluido');

  const [base, setBase] = useState('home');
  const [activeCol, setActiveCol] = useState('dischi');
  const [overlay, setOverlay] = useState(null);
  const [capCol, setCapCol] = useState(null);
  const [capStatus, setCapStatus] = useState('idle');
  const [editing, setEditing] = useState(null);
  const [autoAdd, setAutoAdd] = useState(true);
  const [browseAll, setBrowseAll] = useState(false);
  const [items, setItems] = useState(SEED_ITEMS);
  const [view, setView] = useState('grid');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [toast, setToast] = useState(null);
  const [focusSignal, setFocusSignal] = useState(0);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const toastTimer = useRef(null);

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const counts = useMemo(() => {
    const c = {};
    for (const col of COLLECTIONS) c[col.id] = 0;
    for (const it of items) c[it.collection] = (c[it.collection] || 0) + 1;
    return c;
  }, [items]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const goHome = () => { setOverlay(null); setBase('home'); };
  const openCollection = (id) => { setActiveCol(id); setBrowseAll(false); setBase('browse'); setQuery(''); setOverlay(null); };
  const goBrowse = () => { setOverlay(null); setBase('browse'); };
  const doSearch = () => { setOverlay(null); setBrowseAll(true); setBase('browse'); setFocusSignal((n) => n + 1); };
  const onSetCollection = (id) => { if (id === 'all') { setBrowseAll(true); setBase('browse'); } else { openCollection(id); } };

  const openCapture = (forCol) => {
    setCapCol(forCol || null);
    setCapStatus('idle');
    setOverlay('capture');
  };

  const shutter = () => {
    if (capStatus === 'recognizing') return;
    setCapStatus('recognizing');
    setTimeout(() => {
      const rec = recognise(capCol);
      if (autoAdd) {
        const saved = { ...rec }; delete saved._new;
        setItems((p) => [...p, saved]);
        setActiveCol(capCol);
        setEditing({ item: saved, mode: 'saved', source: 'capture' });
        setOverlay('detail');
        setCapStatus('idle');
        showToast(`Salvato in ${COL[capCol].name}`);
      } else {
        setEditing({ item: rec, mode: 'new', source: 'capture' });
        setOverlay('detail');
        setCapStatus('idle');
      }
    }, 1650);
  };

  const onDetailChange = (patch) => {
    setEditing((e) => {
      if (!e) return e;
      const item = { ...e.item, ...patch };
      if (e.mode === 'saved') setItems((p) => p.map((it) => it.id === item.id ? item : it));
      return { ...e, item };
    });
  };

  const saveNew = () => {
    const item = { ...editing.item }; delete item._new;
    setItems((p) => [...p, item]);
    setActiveCol(item.collection);
    setBase('browse');
    setOverlay(null);
    showToast(`Salvato in ${COL[item.collection].name}`);
  };

  const closeDetail = () => {
    const item = editing && editing.item;
    setOverlay(null);
    if (editing && editing.source === 'capture' && item) {
      setActiveCol(item.collection);
      setBrowseAll(false);
      setBase('browse');
    }
  };

  const deleteItem = () => {
    setItems((p) => p.filter((it) => it.id !== editing.item.id));
    setOverlay(null);
    setBase('browse');
    showToast('Eliminato');
  };

  const openItem = (it) => { setEditing({ item: it, mode: 'saved', source: 'browse' }); setOverlay('detail'); };
  const toggleDark = () => setDark((d) => !d);

  const dev = DEVICES[device];
  let frameStyle;
  if (dev) {
    const pad = device === 'mobile' ? 20 : 44;
    const scale = Math.min(1, (vp.w - pad) / dev.w, (vp.h - pad) / dev.h);
    frameStyle = { width: dev.w, height: dev.h, borderRadius: dev.r, transform: `scale(${scale})` };
  } else {
    frameStyle = { width: '100vw', height: '100dvh', borderRadius: 0 };
  }

  const collection = browseAll ? ALL_COLLECTION : COL[activeCol];

  return (
    <div className="cz-stage" data-theme={dark ? 'dark' : 'light'}
      style={{ '--accent': '#f4b400', '--on-accent': onAccent('#f4b400'), '--radius': '14px' }}>
      <div className="cz-frame" data-device={device} style={frameStyle}>
        <div className="cz-app">
          <aside className="cz-side">
            <div className="cz-brand">
              <div className="cz-logo"><Icon name="layers" size={18} stroke={2.2} /></div>
              <b>catlize</b>
            </div>
            <button className="cz-btn cz-btn-primary cz-cta cz-btn-block" onClick={() => openCapture(null)}>
              <Icon name="camera" size={19} stroke={2.1} /> Cattura
            </button>
            <button className="cz-navitem" data-active={base === 'home'} onClick={goHome}>
              <Icon name="home" size={19} stroke={2.1} /> Home
            </button>
            <div className="cz-navlabel">Collezioni</div>
            {COLLECTIONS.map((c) =>
              <button key={c.id} className="cz-navitem" data-active={base === 'browse' && activeCol === c.id && !browseAll}
                onClick={() => openCollection(c.id)}>
                <Icon name={c.icon} size={19} stroke={2.1} /> {c.name}
                <span className="cz-count">{counts[c.id]}</span>
              </button>
            )}
            <div className="cz-side-foot">
              <button className="cz-iconbtn" data-bordered="true" onClick={toggleDark} title="Tema">
                <Icon name={dark ? 'sun' : 'moon'} size={19} />
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                Tema {dark ? 'scuro' : 'chiaro'}
              </span>
            </div>
          </aside>

          <div className="cz-mainwrap">
            {base === 'home' ? (
              <HomeScreen counts={counts} tileStyle="cover" onOpen={openCollection} dark={dark} onToggleTheme={toggleDark} />
            ) : (
              <BrowseScreen collection={collection} items={items} view={view} setView={setView}
                query={query} setQuery={setQuery} sort={sort} setSort={setSort}
                cardStyle="standard" onOpen={openItem} onBack={goHome} focusSignal={focusSignal}
                browseAll={browseAll} onSetCollection={onSetCollection} />
            )}

            <nav className="cz-bottombar">
              <button className="cz-navbtn" data-active={base === 'home' && !overlay} onClick={goHome}>
                <Icon name="home" size={22} stroke={2.2} /> Home
              </button>
              <button className="cz-navbtn" data-active={base === 'browse' && !overlay} onClick={goBrowse}>
                <Icon name="layers" size={22} stroke={2.2} /> Sfoglia
              </button>
              <div className="cz-fabslot">
                <button className="cz-fab" onClick={() => openCapture(base === 'browse' ? activeCol : null)} aria-label="Cattura">
                  <Icon name="camera" size={26} stroke={2.1} />
                </button>
              </div>
              <button className="cz-navbtn" onClick={doSearch}>
                <Icon name="search" size={22} stroke={2.2} /> Cerca
              </button>
              <button className="cz-navbtn" onClick={toggleDark}>
                <Icon name={dark ? 'sun' : 'moon'} size={22} stroke={2.2} /> Tema
              </button>
            </nav>
          </div>

          {overlay === 'capture' && (
            <div className="cz-overlay">
              <CaptureScreen capCol={capCol} setCapCol={(id) => { setCapCol(id); setCapStatus('idle'); }}
                status={capStatus} onShutter={shutter} onClose={() => setOverlay(null)}
                autoAdd={autoAdd} setAutoAdd={setAutoAdd} />
            </div>
          )}
          {overlay === 'detail' && editing && (
            <div className="cz-overlay">
              <DetailScreen item={editing.item} mode={editing.mode} onChange={onDetailChange}
                onSave={saveNew} onClose={closeDetail} onDelete={deleteItem} />
            </div>
          )}

          {toast && (
            <div className="cz-toast">
              <span className="cz-toast-ico"><Icon name="checkCircle" size={17} stroke={2.4} /></span>
              {toast}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
