const TOKEN = import.meta.env.VITE_DISCOGS_TOKEN;

export async function lookupBarcode(barcode) {
  if (!TOKEN) throw new Error('VITE_DISCOGS_TOKEN non configurato');
  const res = await fetch(
    `https://api.discogs.com/database/search?barcode=${encodeURIComponent(barcode)}&token=${TOKEN}`
  );
  if (!res.ok) throw new Error(`Discogs ${res.status}`);
  const data = await res.json();
  if (!data.results?.length) return null;
  return mapResult(data.results[0]);
}

function mapResult(r) {
  const raw = r.title || '';
  const sep = raw.indexOf(' - ');
  const artista = sep !== -1 ? raw.slice(0, sep).trim() : '';
  const titolo  = sep !== -1 ? raw.slice(sep + 3).trim() : raw.trim();

  return {
    artista,
    titolo,
    anno:      r.year  ? String(r.year)                           : '',
    etichetta: Array.isArray(r.label) ? r.label[0] : (r.label || ''),
    formato:   mapFormato(r.format),
    _coverUrl: r.cover_image || r.thumb || '',
  };
}

function mapFormato(formats) {
  if (!Array.isArray(formats)) return '';
  const f = formats.map(s => s.toLowerCase());
  if (f.includes('cd'))                                 return 'CD';
  if (f.includes('cassette'))                           return 'Musicassetta';
  if (f.some(s => s.includes('ep')))                   return 'EP';
  if (f.includes('single') || f.some(s => s === '7"')) return '45 giri';
  return 'LP'; // default for vinyl
}
