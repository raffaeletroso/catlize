import { getAccessToken, requestToken } from './auth.js';

const BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'Catlize';
const IMAGES_FOLDER_NAME = 'immagini';
const CATALOG_FILENAME = 'catalogo.json';

async function authFetch(url, opts = {}) {
  let token = getAccessToken();
  if (!token) token = await requestToken();
  const headers = { Authorization: `Bearer ${token}`, ...(opts.headers || {}) };
  return fetch(url, { ...opts, headers });
}

async function findFile(name, parentId, mimeType) {
  const q = [
    `name = '${name}'`,
    `trashed = false`,
    mimeType ? `mimeType = '${mimeType}'` : null,
    parentId ? `'${parentId}' in parents` : null,
  ].filter(Boolean).join(' and ');
  const res = await authFetch(`${BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  if (!res.ok) throw new Error(`Drive search ${res.status}`);
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function createFolder(name, parentId) {
  const meta = { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : [] };
  const res = await authFetch(`${BASE}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meta),
  });
  if (!res.ok) throw new Error(`Drive createFolder ${res.status}`);
  const data = await res.json();
  return data.id;
}

async function getOrCreateFolder(name, parentId) {
  const id = await findFile(name, parentId, 'application/vnd.google-apps.folder');
  return id || await createFolder(name, parentId);
}

async function uploadJson(fileId, folderId, content) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  if (fileId) {
    const res = await authFetch(`${UPLOAD}/files/${fileId}?uploadType=media`, { method: 'PATCH', body: blob });
    if (!res.ok) throw new Error(`Drive update ${res.status}`);
    return fileId;
  }
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name: CATALOG_FILENAME, parents: [folderId] })], { type: 'application/json' }));
  form.append('file', blob);
  const res = await authFetch(`${UPLOAD}/files?uploadType=multipart`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Drive create ${res.status}`);
  const data = await res.json();
  return data.id;
}

async function uploadImage(fileId, folderId, filename, dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  if (fileId) {
    const res = await authFetch(`${UPLOAD}/files/${fileId}?uploadType=media`, { method: 'PATCH', body: blob });
    if (!res.ok) throw new Error(`Drive img update ${res.status}`);
    return fileId;
  }
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name: filename, parents: [folderId] })], { type: 'application/json' }));
  form.append('file', blob);
  const res = await authFetch(`${UPLOAD}/files?uploadType=multipart`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Drive img create ${res.status}`);
  const data = await res.json();
  return data.id;
}

let _rootId = null;
let _imagesId = null;
let _catalogFileId = null;

async function ensureFolders() {
  if (!_rootId) _rootId = await getOrCreateFolder(FOLDER_NAME, null);
  if (!_imagesId) _imagesId = await getOrCreateFolder(IMAGES_FOLDER_NAME, _rootId);
}

export async function saveCatalogToDrive(items) {
  await ensureFolders();
  if (!_catalogFileId) {
    _catalogFileId = await findFile(CATALOG_FILENAME, _rootId, 'application/json');
  }
  _catalogFileId = await uploadJson(_catalogFileId, _rootId, items);
}

export async function saveImageToDrive(itemId, dataUrl) {
  if (!dataUrl?.startsWith('data:')) return;
  await ensureFolders();
  const filename = `${itemId}_cover.jpg`;
  const existingId = await findFile(filename, _imagesId, 'image/jpeg');
  await uploadImage(existingId, _imagesId, filename, dataUrl);
}

export async function loadCatalogFromDrive() {
  await ensureFolders();
  const fileId = await findFile(CATALOG_FILENAME, _rootId, 'application/json');
  if (!fileId) return null;
  _catalogFileId = fileId;
  const res = await authFetch(`${BASE}/files/${fileId}?alt=media`);
  if (!res.ok) throw new Error(`Drive load ${res.status}`);
  return res.json();
}

export function resetDriveCache() {
  _rootId = null;
  _imagesId = null;
  _catalogFileId = null;
}
