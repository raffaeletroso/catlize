const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const STORAGE_KEY = 'catlize_gtoken';

let tokenClient = null;
let currentToken = null; // { access_token, expiresAt }

// ── persistence ──────────────────────────────────────────────

function persist(tok) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tok)); } catch {}
}

function clearPersisted() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── internal helpers ─────────────────────────────────────────

function isExpired(tok) {
  return Date.now() > tok.expiresAt - 60_000;
}

function storeToken(resp) {
  const tok = { access_token: resp.access_token, expiresAt: Date.now() + resp.expires_in * 1000 };
  currentToken = tok;
  persist(tok);
  return tok.access_token;
}

function getTokenClient(callback) {
  if (!window.google?.accounts?.oauth2) throw new Error('GIS non caricato');
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID non configurato');
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback,
    });
  } else {
    tokenClient.callback = callback;
  }
  return tokenClient;
}

// ── public API ───────────────────────────────────────────────

export function getAccessToken() {
  return currentToken && !isExpired(currentToken) ? currentToken.access_token : null;
}

/**
 * Try to restore session from localStorage, then attempt silent refresh.
 * Returns the access token on success, null if the user must log in manually.
 * Never shows a popup.
 */
export function restoreSession() {
  const saved = loadPersisted();
  if (saved && !isExpired(saved)) {
    currentToken = saved;
    return Promise.resolve(saved.access_token);
  }
  // Token expired or missing — attempt silent refresh (no popup)
  return new Promise((resolve) => {
    try {
      const client = getTokenClient((resp) => {
        if (resp.error) {
          // Silent refresh failed (user not logged in to Google, or no prior consent)
          clearPersisted();
          resolve(null);
        } else {
          resolve(storeToken(resp));
        }
      });
      // prompt: '' = silent; GIS will use the browser's existing Google session
      client.requestAccessToken({ prompt: '' });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Show the Google login popup and get a token.
 * Use this only when restoreSession() returns null.
 */
export function requestToken() {
  return new Promise((resolve, reject) => {
    try {
      const client = getTokenClient((resp) => {
        if (resp.error) return reject(new Error(resp.error));
        resolve(storeToken(resp));
      });
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (e) {
      reject(e);
    }
  });
}

export function revokeToken() {
  if (currentToken) {
    window.google?.accounts.oauth2.revoke(currentToken.access_token, () => {});
    currentToken = null;
  }
  clearPersisted();
}

export function isAuthenticated() {
  return !!getAccessToken();
}
