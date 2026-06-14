const ICON_SVG = {
  camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.2"/>',
  search:'<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.1-4.1"/>',
  grid:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  list:'<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3.5" x2="3.6" y1="6" y2="6"/><line x1="3.5" x2="3.6" y1="12" y2="12"/><line x1="3.5" x2="3.6" y1="18" y2="18"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  disc:'<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="2.4"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="2.5"/><line x1="2" x2="22" y1="9.5" y2="9.5"/><line x1="6" x2="9" y1="14.5" y2="14.5"/>',
  box:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  home:'<path d="m3 9.5 9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V13h6v9"/>',
  layers:'<path d="m12 2 9 4.5-9 4.5L3 6.5 12 2z"/><path d="m21 12-9 4.5L3 12"/><path d="m21 17.5-9 4.5-9-4.5"/>',
  sliders:'<line x1="21" x2="14" y1="5" y2="5"/><line x1="10" x2="3" y1="5" y2="5"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="19" y2="19"/><line x1="12" x2="3" y1="19" y2="19"/><circle cx="12" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="19" r="2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5"/><path d="M12 19.5V22"/><path d="m4.5 4.5 1.8 1.8"/><path d="m17.7 17.7 1.8 1.8"/><path d="M2 12h2.5"/><path d="M19.5 12H22"/><path d="m6.3 17.7-1.8 1.8"/><path d="m19.5 4.5-1.8 1.8"/>',
  moon:'<path d="M12 3a6.5 6.5 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  back:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5.5"/>',
  chevR:'<path d="m9 6 6 6-6 6"/>',
  chevD:'<path d="m6 9 6 6 6-6"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  pencil:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M3.5 12h17"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="m21 15-4-4a2 2 0 0 0-2.8 0L6 19"/>',
  sort:'<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
  trash:'<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  flip:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.7 2.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.7-2.7L3 16"/><path d="M3 21v-5h5"/>',
  sparkle:'<path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>',
  checkCircle:'<path d="M21.8 10A10 10 0 1 1 17 3.3"/><path d="m9 11 3 3L22 4"/>',
};

export function Icon({ name, size = 22, stroke = 2.25, style, className }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
      strokeLinejoin="round" className={className} style={style}
      dangerouslySetInnerHTML={{ __html: ICON_SVG[name] || '' }}
    />
  );
}
