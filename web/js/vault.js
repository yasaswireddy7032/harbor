// Private storage. Nothing is saved unless she chooses to, and what is saved is encrypted
// on the device with a passcode only she knows (PBKDF2-SHA256 → AES-256-GCM, Web Crypto).
// There is no server, no account and no recovery: if the passcode is lost, the data is gone.
// That is the point.

const KEY = "n.store";        // neutral names, in case someone looks at site data
const PREFS = "n.prefs";
const ITER = 310000;
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

let key = null;   // CryptoKey while unlocked, kept only in memory
let data = null;  // decrypted contents while unlocked

const blank = () => ({ journal: [], plan: {}, steps: {}, wins: [], cards: [], chat: [] });

function ls() { try { return window.localStorage; } catch { return null; } }

async function derive(pass, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base,
    { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export const vault = {
  exists() { return !!ls()?.getItem(KEY); },
  unlocked() { return !!key; },
  get() { return data; },

  async create(pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    key = await derive(pass, salt);
    data = { ...blank(), ...(data || {}) };
    ls()?.setItem(KEY, JSON.stringify({ v: 1, salt: b64(salt) }));
    await this.save();
  },

  async unlock(pass) {
    const raw = JSON.parse(ls()?.getItem(KEY) || "null");
    if (!raw) throw new Error("nothing saved");
    const k = await derive(pass, unb64(raw.salt));
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(raw.iv) }, k, unb64(raw.ct));
      key = k; data = { ...blank(), ...JSON.parse(dec.decode(pt)) };
      return true;
    } catch { return false; }
  },

  async save() {
    if (!key) return false;
    const raw = JSON.parse(ls()?.getItem(KEY) || "{}");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
    ls()?.setItem(KEY, JSON.stringify({ v: 1, salt: raw.salt, iv: b64(iv), ct: b64(ct) }));
    return true;
  },

  async update(fn) { if (!data) data = blank(); fn(data); return this.save(); },

  lock() { key = null; data = null; },

  wipe() { key = null; data = null; try { ls()?.removeItem(KEY); ls()?.removeItem(PREFS); sessionStorage.clear(); } catch { /* ignore */ } },

  // In-memory scratch space for someone who hasn't set a passcode. Gone when the tab closes.
  scratch() { if (!data) data = blank(); return data; },
};

export const prefs = {
  get() { try { return JSON.parse(ls()?.getItem(PREFS) || "{}"); } catch { return {}; } },
  set(p) { try { ls()?.setItem(PREFS, JSON.stringify({ ...this.get(), ...p })); } catch { /* private mode */ } },
};
