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

export function HomeScreen({ counts, tileStyle, onOpen, dark, onToggleTheme, driveAuthed, driveSyncing, onConnectDrive, onDisconnectDrive }) {
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
        <div className="cz-drive-row">
          {driveAuthed ? (
            <button className="cz-drive-btn cz-drive-btn--connected" onClick={onDisconnectDrive} disabled={driveSyncing}>
              <DriveIcon />
              <span>Google Drive collegato</span>
            </button>
          ) : (
            <button className="cz-drive-btn" onClick={onConnectDrive} disabled={driveSyncing}>
              <DriveIcon />
              <span>{driveSyncing ? 'Connessione…' : 'Collega Google Drive'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DriveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a7.9 7.9 0 003.3 6.65z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L.5 50.3A7.9 7.9 0 000 53.7h27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25A7.9 7.9 0 0087.3 54H59.75l5.9 12.2z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="M59.75 54H87.3a7.9 7.9 0 00-.5-3.3L60.65 4.5C59.85 3.1 58.7 2 57.4 1.2L43.65 25z" fill="#2684fc"/>
      <path d="M27.5 54L13.75 77.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2L59.75 54z" fill="#ffba00"/>
    </svg>
  );
}
