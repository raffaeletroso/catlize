const TOKEN = import.meta.env.VITE_DISCOGS_TOKEN;

async function discogsSearch(params) {
  if (!TOKEN) throw new Error('VITE_DISCOGS_TOKEN non configurato');
  const qs = new URLSearchParams({ ...params, token: TOKEN }).toString();
  const res = await fetch(`https://api.discogs.com/database/search?${qs}`);
  if (!res.ok) throw new Error(`Discogs ${res.status}`);
  return res.json();
}

export async function lookupBarcode(barcode) {
  console.log('[Discogs] barcode:', barcode, 'token:', !!TOKEN);
  const data = await discogsSearch({ barcode });
  console.log('[Discogs] risultati barcode:', data.results?.length ?? 0);
  if (!data.results?.length) return null;
  return mapResult(data.results[0]);
}

export async function searchText({ artista, titolo }) {
  const params = { type: 'release' };
  if (titolo)  params.release_title = titolo;
  if (artista) params.artist        = artista;
  const data = await discogsSearch(params);
  return (data.results || []).slice(0, 5).map(mapResult);
}

export function mapResult(r) {
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
  return 'LP';
}
