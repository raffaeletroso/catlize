const ALLOWED_ORIGINS = ['https://catlize.pages.dev', 'http://localhost:5173'];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const apiKey = env.COMICVINE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'COMICVINE_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const url = new URL(request.url);
    const title = url.searchParams.get('title') || '';
    const issueNumber = url.searchParams.get('issue_number') || '';

    if (!title && !issueNumber) {
      return new Response(JSON.stringify({ error: 'Missing title or issue_number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const query = [title, issueNumber].filter(Boolean).join(' ');
    const cvUrl = new URL('https://comicvine.gamespot.com/api/search/');
    cvUrl.searchParams.set('api_key', apiKey);
    cvUrl.searchParams.set('format', 'json');
    cvUrl.searchParams.set('query', query);
    cvUrl.searchParams.set('resources', 'issue');
    cvUrl.searchParams.set('field_list', 'id,name,volume,issue_number,cover_date,image');
    cvUrl.searchParams.set('limit', '10');

    const cvRes = await fetch(cvUrl.toString(), {
      headers: { 'User-Agent': 'catlize/1.0 (https://catlize.pages.dev)' },
    });

    if (!cvRes.ok) {
      return new Response(JSON.stringify({ error: `Comic Vine error ${cvRes.status}` }), {
        status: cvRes.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const data = await cvRes.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};
