// 보관함(Vercel Blob)에 설정·접수 내용을 넣고 꺼내는 도구 (서버에서만 쓴다)
import { put, list } from '@vercel/blob';

export const ADMIN_KEY = '1234';

export const SETTINGS_PATH = 'settings/common.json';

export async function saveJson(path, data) {
  await put(path, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
    allowOverwrite: true,
  });
}

export async function readJson(path) {
  const { blobs } = await list({ prefix: path, limit: 1 });
  if (!blobs.length) return null;
  const res = await fetch(`${blobs[0].url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function readMany(prefix, max = 500) {
  const { blobs } = await list({ prefix, limit: max });
  const items = await Promise.all(
    blobs.map(async (b) => {
      try {
        const res = await fetch(b.url, { cache: 'no-store' });
        if (!res.ok) return null;
        const j = await res.json();
        return { ...j, _path: b.pathname, _uploadedAt: b.uploadedAt };
      } catch (err) {
        return null;
      }
    })
  );
  return items.filter(Boolean);
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function makeCode(len = 6) {
  let out = '';
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i += 1) out += ALPHABET[buf[i] % ALPHABET.length];
  return out;
}

// 기본 설정값
export function emptySettings() {
  return {
    bank: '',
    accountNo: '',
    holder: '',
    bankPhoto: '',
    payNote: '',
    contact: '',
    supplierName: '영유아교육디자인연구소',
  };
}
