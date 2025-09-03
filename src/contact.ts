import { randomBytes } from 'crypto';

export type ContactBundle = {
  identityKey: string; // base64url
  pqIdentityKey: string; // base64url
  suites: string[]; // e.g., ["VELI-DEFAULT-2025"]
  rv?: { urls: string[] }; // optional rendezvous hints
};

export type ContactCode = string; // base64url(JSON)

export function encodeContactCode(bundle: ContactBundle): ContactCode {
  const json = JSON.stringify({ v: 1, ...bundle });
  return Buffer.from(json).toString('base64url');
}

export function decodeContactCode(code: ContactCode): ContactBundle {
  const json = Buffer.from(code, 'base64url').toString('utf8');
  const obj = JSON.parse(json);
  if (typeof obj.identityKey !== 'string' || typeof obj.pqIdentityKey !== 'string') {
    throw new Error('invalid contact code');
  }
  return { identityKey: obj.identityKey, pqIdentityKey: obj.pqIdentityKey, suites: obj.suites ?? [], rv: obj.rv };
}

export function generateContactBundle(): ContactBundle {
  const ik = randomBytes(32);
  const pq = randomBytes(48);
  return {
    identityKey: Buffer.from(ik).toString('base64url'),
    pqIdentityKey: Buffer.from(pq).toString('base64url'),
    suites: ["VELI-DEFAULT-2025"],
  };
}


