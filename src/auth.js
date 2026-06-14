const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let tokenClient = null;
let currentToken = null;

function getTokenClient(callback) {
  if (!window.google) throw new Error('GIS non caricato');
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

export function getAccessToken() {
  return currentToken && !isExpired(currentToken) ? currentToken.access_token : null;
}

function isExpired(tok) {
  return Date.now() > tok.expiresAt - 60_000;
}

export function requestToken() {
  return new Promise((resolve, reject) => {
    try {
      const client = getTokenClient((resp) => {
        if (resp.error) return reject(new Error(resp.error));
        currentToken = { access_token: resp.access_token, expiresAt: Date.now() + resp.expires_in * 1000 };
        resolve(currentToken.access_token);
      });
      client.requestAccessToken({ prompt: '' });
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
}

export function isAuthenticated() {
  return !!getAccessToken();
}
