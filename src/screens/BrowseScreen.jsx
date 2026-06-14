import React, { useMemo, useRef, useEffect } from 'react';
import { Icon } from '../icons.jsx';
import { Thumb } from '../ui.jsx';
import { COLLECTIONS, COL, itemTitle, itemSubs, thumbLabel } from '../data.js';

function CardThumb({ it }) {
  if (it._coverUrl) {
    return <img src={it._coverUrl} className="cz-card-thumb cz-card-thumb--img" alt="" loading="lazy" />;
  }
  return <Thumb className="cz-card-thumb" label={thumbLabel(it.collection)} />;
}

function RowThumb({ it }) {
  if (it._coverUrl) {
    return <img src={it._coverUrl} className="cz-rowitem-thumb cz-rowitem-thumb--img" alt="" loading="lazy" />;
  }
  return <Thumb className="cz-rowitem-thumb" label="" showIcon={false} />;
}

function CardItem({ it, onOpen, showTag }) {
  const subs = itemSubs(it).slice(0, 2);
  return (
    <button className="cz-card" onClick={() => onOpen(it)}>
      <CardThumb it={it} />
      <div className="cz-card-body">
        {showTag && <div className="cz-card-tag">{COL[it.collection].short}</div>}
        <div className="cz-card-title">{itemTitle(it)}</div>
        {subs.map((s, i) => <div key={i} className="cz-card-sub">{s}</div>)}
      </div>
    </button>
  );
}

function RowItem({ it, onOpen, showTag }) {
  const subs = showTag
    ? [COL[it.collection].short, ...itemSubs(it)]
    : itemSubs(it);
  return (
    <button className="cz-rowitem" onClick={() => onOpen(it)}>
      <RowThumb it={it} />
      <div className="cz-rowitem-main">
        <div className="cz-rowitem-title">{itemTitle(it)}</div>
        <div className="cz-rowitem-sub">{subs.join(' · ')}</div>
      </div>
      <Icon className="cz-rowitem-chev" name="chevR" size={18} />
    </button>
  );
}

export function BrowseScreen({ collection, items, view, setView, query, setQuery, sort, setSort, cardStyle, onOpen, onBack, focusSignal, browseAll, onSetCollection }) {
  const searchRef = useRef(null);
  useEffect(() => {
    if (focusSignal) { searchRef.current && searchRef.current.focus(); }
  }, [focusSignal]);

  const display = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = browseAll
      ? items.slice()
      : items.filter((it) => it.collection === collection.id);
    if (q) {
      r = r.filter((it) => {
        const hay = [itemTitle(it), ...itemSubs(it), ...Object.values(it)].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    const yr = (it) => parseInt(it.anno, 10) || 0;
    if (sort === 'az') r = [...r].sort((a, b) => itemTitle(a).localeCompare(itemTitle(b), 'it'));
    else if (sort === 'anno') r = [...r].sort((a, b) => yr(b) - yr(a));
    else r = [...r].sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
    return r;
  }, [items, collection.id, query, sort, browseAll]);

  const totalInCol = browseAll
    ? items.length
    : items.filter((it) => it.collection === collection.id).length;

  return (
    <div className="cz-main">
      <div className="cz-topbar">
        <div className="cz-topbar-row">
          <button className="cz-iconbtn cz-hide-wide" onClick={onBack} title="Indietro" style={{ marginLeft: -6 }}>
            <Icon name="back" size={20} />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="cz-title" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              {browseAll ? 'Tutte le collezioni' : collection.name}
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-faint)' }}>{totalInCol}</span>
            </h1>
          </div>
        </div>
        <div className="cz-topbar-row">
          <div className="cz-search">
            <Icon name="search" size={18} stroke={2.1} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={browseAll ? 'Cerca in tutte le collezioni…' : `Cerca in ${collection.short.toLowerCase()}…`}
            />
          </div>
        </div>
        <div className="cz-topbar-row">
          <select className="cz-select cz-select-sm" style={{ flex: 1 }}
            value={browseAll ? 'all' : collection.id}
            onChange={e => onSetCollection(e.target.value)}>
            <option value="all">Tutte le collezioni</option>
            {COLLECTIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="cz-select cz-select-sm" style={{ flex: 1 }}
            value={sort + '_' + view}
            onChange={e => { const [s, v] = e.target.value.split('_'); setSort(s); setView(v); }}>
            <option value="recent_grid">Recenti · Griglia</option>
            <option value="recent_list">Recenti · Lista</option>
            <option value="az_grid">A→Z · Griglia</option>
            <option value="az_list">A→Z · Lista</option>
            <option value="anno_grid">Anno · Griglia</option>
            <option value="anno_list">Anno · Lista</option>
          </select>
        </div>
      </div>

      <div className="cz-scroll">
        <div className="cz-content">
          {display.length > 0 &&
            <div className="cz-rescount">{display.length} {display.length === 1 ? 'risultato' : 'risultati'}</div>
          }
          {totalInCol === 0 ? (
            <div className="cz-empty">
              <div className="cz-empty-ico"><Icon name={collection.icon} size={28} stroke={2} /></div>
              <div>
                <h3>Collezione vuota</h3>
                <p>Tocca il pulsante fotocamera per catalogare il primo {collection.singular}.</p>
              </div>
            </div>
          ) : display.length === 0 ? (
            <div className="cz-empty">
              <div className="cz-empty-ico"><Icon name="search" size={26} stroke={2} /></div>
              <div>
                <h3>Nessun risultato</h3>
                <p>Nessun {collection.singular} corrisponde a "{query}".</p>
              </div>
            </div>
          ) : view === 'grid' ? (
            <div className="cz-grid" data-style={cardStyle}>
              {display.map((it) => <CardItem key={it.id} it={it} onOpen={onOpen} showTag={browseAll} />)}
            </div>
          ) : (
            <div className="cz-list">
              {display.map((it) => <RowItem key={it.id} it={it} onOpen={onOpen} showTag={browseAll} />)}
            </div>
          )}
        </div>
        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}
