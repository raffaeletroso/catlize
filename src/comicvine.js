const PROXY_URL = import.meta.env.VITE_COMICVINE_PROXY_URL;

export async function searchComicVine({ testata, numero }) {
  if (!PROXY_URL) throw new Error('VITE_COMICVINE_PROXY_URL non configurato');
  const params = new URLSearchParams();
  if (testata) params.set('title', testata);
  if (numero)  params.set('issue_number', numero);
  const res = await fetch(`${PROXY_URL}?${params}`);
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const data = await res.json();
  return (data.results || []).slice(0, 8).map(mapIssue);
}

function mapIssue(r) {
  const anno = r.cover_date ? r.cover_date.slice(0, 4) : '';
  return {
    testata:   r.volume?.name || '',
    numero:    r.issue_number  || '',
    editore:   '',
    anno,
    _coverUrl: r.image?.medium_url || r.image?.thumb_url || '',
  };
}
