import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Icon } from './icons.jsx';
import { COLLECTIONS, COL, SEED_ITEMS, nid } from './data.js';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { BrowseScreen } from './screens/BrowseScreen.jsx';
import { CaptureScreen, DetailScreen } from './screens/CaptureScreen.jsx';
import { isAuthenticated, requestToken, revokeToken, restoreSession } from './auth.js';
import { saveCatalogToDrive, loadCatalogFromDrive, saveImageToDrive, resetDriveCache } from './drive.js';

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
  const [editing, setEditing] = useState(null);
  const [browseAll, setBrowseAll] = useState(false);
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('catlize_items');
      return saved ? JSON.parse(saved) : SEED_ITEMS;
    } catch {
      return SEED_ITEMS;
    }
  });
  const [view, setView] = useState('grid');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [toast, setToast] = useState(null);
  const [focusSignal, setFocusSignal] = useState(0);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [driveAuthed, setDriveAuthed] = useState(false);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const toastTimer = useRef(null);
  const driveSaveTimer = useRef(null);

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  // Restore Drive session silently on startup (after GIS script loads)
  useEffect(() => {
    let cancelled = false;
    function attempt() {
      if (!window.google?.accounts?.oauth2) return;
      restoreSession().then((token) => {
        if (cancelled || !token) return;
        setDriveAuthed(true);
        loadCatalogFromDrive().then((remote) => {
          if (cancelled || !remote || !Array.isArray(remote) || !remote.length) return;
          // Preserve _coverUrl from local items if Drive version lacks it
          let local = [];
          try { local = JSON.parse(localStorage.getItem('catlize_items') || '[]'); } catch {}
          const localCover = Object.fromEntries(local.filter(it => it._coverUrl).map(it => [it.id, it._coverUrl]));
          const merged = remote.map(it => localCover[it.id] && !it._coverUrl ? { ...it, _coverUrl: localCover[it.id] } : it);
          setItems(merged);
          try { localStorage.setItem('catlize_items', JSON.stringify(merged)); } catch {}
        }).catch(() => {});
      });
    }
    // GIS loads asynchronously — poll until ready (max ~5s)
    let tries = 0;
    const iv = setInterval(() => {
      if (window.google?.accounts?.oauth2 || ++tries > 25) {
        clearInterval(iv);
        attempt();
      }
    }, 200);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  // localStorage fallback — always keep in sync
  useEffect(() => {
    try {
      localStorage.setItem('catlize_items', JSON.stringify(items));
    } catch {}
  }, [items]);

  // Drive debounced sync on items change
  useEffect(() => {
    if (!driveAuthed) return;
    clearTimeout(driveSaveTimer.current);
    driveSaveTimer.current = setTimeout(async () => {
      try {
        await saveCatalogToDrive(items);
      } catch (e) {
        console.warn('[Drive] sync failed:', e);
      }
    }, 1500);
  }, [items, driveAuthed]);

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

  const connectDrive = useCallback(async () => {
    try {
      setDriveSyncing(true);
      await requestToken();
      setDriveAuthed(true);
      // Load catalog from Drive
      const remote = await loadCatalogFromDrive();
      if (remote && Array.isArray(remote) && remote.length > 0) {
        setItems(remote);
        localStorage.setItem('catlize_items', JSON.stringify(remote));
        showToast('Catalogo caricato da Google Drive');
      } else {
        // Push local to Drive if Drive is empty
        await saveCatalogToDrive(items);
        showToast('Google Drive collegato');
      }
    } catch (e) {
      console.error('[Drive] connect failed:', e);
      showToast('Errore connessione Drive');
    } finally {
      setDriveSyncing(false);
    }
  }, [items]);

  const disconnectDrive = useCallback(() => {
    revokeToken();
    resetDriveCache();
    setDriveAuthed(false);
    showToast('Google Drive scollegato');
  }, []);

  // History management for device back button
  const appStateRef = useRef({ base: 'home', overlay: null, editing: null });
  useEffect(() => { appStateRef.current = { base, overlay, editing }; }, [base, overlay, editing]);
  const lastBackAtHome = useRef(0);
  const showToastRef = useRef(null);
  useEffect(() => { showToastRef.current = showToast; });

  useEffect(() => {
    history.replaceState({ catlize: true }, '');
    history.pushState({ catlize: true }, '');
    const onPop = () => {
      const { overlay: o, base: b, editing: ed } = appStateRef.current;
      console.log('[back]', { overlay: o, base: b });
      if (o === 'detail') {
        history.pushState({ catlize: true }, '');
        appStateRef.current = { ...appStateRef.current, overlay: null };
        setOverlay(null);
        if (ed?.source === 'capture') {
          appStateRef.current = { ...appStateRef.current, base: 'browse' };
          setActiveCol(ed.item.collection); setBrowseAll(false); setBase('browse');
        }
      } else if (o === 'capture') {
        history.pushState({ catlize: true }, '');
        appStateRef.current = { ...appStateRef.current, overlay: null };
        setOverlay(null);
      } else if (b === 'browse') {
        history.pushState({ catlize: true }, '');
        appStateRef.current = { ...appStateRef.current, base: 'home' };
        setBase('home');
      } else {
        // At home: double-back to exit
        const now = Date.now();
        if (now - lastBackAtHome.current < 2000) {
          // Second press within 2s — let the browser close the app (no re-push)
        } else {
          history.pushState({ catlize: true }, '');
          lastBackAtHome.current = now;
          showToastRef.current?.('Premi ancora per uscire');
        }
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goHome = () => { setOverlay(null); setBase('home'); };
  const openCollection = (id) => { setActiveCol(id); setBrowseAll(false); setBase('browse'); setQuery(''); setOverlay(null); };
  const goBrowse = () => { setOverlay(null); setBase('browse'); };
  const doSearch = () => { setOverlay(null); setBrowseAll(true); setBase('browse'); setFocusSignal((n) => n + 1); };
  const onSetCollection = (id) => { if (id === 'all') { setBrowseAll(true); setBase('browse'); } else { openCollection(id); } };

  const openCapture = (forCol) => {
    setCapCol(forCol || null);
    setOverlay('capture');
  };

  const shutter = (prefilled = {}) => {
    const item = { id: nid(), collection: capCol, _new: true, ...prefilled };
    setEditing({ item, mode: 'new', source: 'capture' });
    setOverlay('detail');
  };

  const onDetailChange = (patch) => {
    setEditing((e) => {
      if (!e) return e;
      const item = { ...e.item, ...patch };
      if (e.mode === 'saved') setItems((p) => p.map((it) => it.id === item.id ? item : it));
      return { ...e, item };
    });
  };

  const saveNew = async () => {
    const item = { ...editing.item }; delete item._new;
    setItems((p) => [...p, item]);
    setActiveCol(item.collection);
    setBase('browse');
    setOverlay(null);
    showToast(`Salvato in ${COL[item.collection].name}`);
    // Upload cover image to Drive if available
    if (driveAuthed && item._capturedImage) {
      saveImageToDrive(item.id, item._capturedImage).catch((e) => console.warn('[Drive] img upload failed:', e));
    }
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
    frameStyle = { position: 'absolute', inset: 0, borderRadius: 0 };
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
              <HomeScreen counts={counts} items={items} tileStyle="cover" onOpen={openCollection} dark={dark} onToggleTheme={toggleDark}
                driveAuthed={driveAuthed} driveSyncing={driveSyncing}
                onConnectDrive={connectDrive} onDisconnectDrive={disconnectDrive} />
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
              <CaptureScreen capCol={capCol} setCapCol={setCapCol}
                onShutter={shutter} onClose={() => setOverlay(null)} />
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
