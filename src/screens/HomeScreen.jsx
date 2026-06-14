import React from 'react';
import { Icon } from '../icons.jsx';
import { Thumb } from '../ui.jsx';
import { COLLECTIONS, thumbLabel } from '../data.js';

function Tile({ c, count, style, onOpen }) {
  const countTxt = `${count} ${count === 1 ? 'pezzo' : 'pezzi'}`;
  const open = () => onOpen(c.id);

  if (style === 'icon') {
    return (
      <button className="cz-tile" data-variant="icon" onClick={open}>
        <div className="cz-tile-ico"><Icon name={c.icon} size={24} stroke={2.1} /></div>
        <div className="cz-tile-name">{c.name}</div>
        <div className="cz-tile-count">{countTxt}</div>
      </button>
    );
  }
  if (style === 'compact') {
    return (
      <button className="cz-tile" data-variant="compact" onClick={open}>
        <div className="cz-tile-ico" style={{ width: 52, height: 52, borderRadius: 11 }}>
          <Icon name={c.icon} size={24} stroke={2.1} />
        </div>
        <div className="cz-tile-txt">
          <div className="cz-tile-name">{c.name}</div>
          <div className="cz-tile-count">{countTxt}</div>
        </div>
        <Icon className="cz-tile-chev" name="chevR" size={18} />
      </button>
    );
  }
  return (
    <button className="cz-tile" data-variant="cover" onClick={open}>
      <Thumb className="cz-tile-thumb" label={thumbLabel(c.id)} />
      <div className="cz-tile-body">
        <div className="cz-tile-ico"><Icon name={c.icon} size={18} stroke={2.1} /></div>
        <div className="cz-tile-txt">
          <div className="cz-tile-name">{c.name}</div>
          <div className="cz-tile-count">{countTxt}</div>
        </div>
      </div>
    </button>
  );
}

export function HomeScreen({ counts, tileStyle, onOpen, dark, onToggleTheme }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="cz-main">
      <div className="cz-topbar">
        <div className="cz-topbar-row">
          <div className="cz-brand cz-hide-wide" style={{ padding: 0, gap: 9 }}>
            <div className="cz-logo" style={{ width: 28, height: 28 }}><Icon name="layers" size={17} stroke={2.2} /></div>
            <b style={{ fontSize: 18 }}>catlize</b>
          </div>
          <div className="cz-grow" />
          <button className="cz-iconbtn cz-hide-wide" onClick={onToggleTheme} title="Tema">
            <Icon name={dark ? 'sun' : 'moon'} size={20} />
          </button>
        </div>
        <div>
          <p className="cz-subtle">{total} pezzi catalogati</p>
          <h1 className="cz-h1">Le tue collezioni</h1>
        </div>
      </div>
      <div className="cz-scroll" style={{ paddingBottom: 24 }}>
        <div className="cz-tiles" data-style={tileStyle}>
          {COLLECTIONS.map((c) =>
            <Tile key={c.id} c={c} count={counts[c.id] || 0} style={tileStyle} onOpen={onOpen} />
          )}
        </div>
      </div>
    </div>
  );
}
