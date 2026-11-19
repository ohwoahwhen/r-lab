/**
 * Save codes: a short, typeable, checksummed encoding of full progress so
 * the same account of XP/streak/missions can move between a MacBook, a
 * Windows PC and a phone with no server and no login.
 *
 * Layout (bytes, then base32, then dash-grouped):
 *   0      format version (1)
 *   1..3   total XP, 24-bit big endian
 *   4      current streak (capped 255)
 *   5      best streak  (capped 255)
 *   6..7   last-played day, days since 2024-01-01 (0 = never)
 *   8      number of mission slots that follow
 *   9..    three bits per mission, in registry order, packed most significant
 *            bit first: bit 2 = passed, bits 0-1 = hints revealed
 *   last 2 FNV-1a checksum of everything before it
 *
 * Format 1 stored a whole byte per mission (0x80 = passed, low 2 bits = hints).
 * It is still read on import so codes saved before the change keep working.
 *
 * The bytes are then Crockford base32 encoded and grouped with dashes.
 *
 * The mission order comes from the content registry and MUST stay
 * append-only: new missions go on the end, existing ids never move.
 */

const EPOCH = Date.UTC(2024, 0, 1) / 86400000;
const PREFIX = 'RLAB1';
const FMT = 2;          // v2 packs three bits per mission; v1 used a whole byte

/*
 * Crockford base32: uppercase letters and digits with I, L, O and U removed.
 * Chosen over base64url because its alphabet contains no "-", so the dashes
 * that group the code for readability can never be confused with data, and
 * because O/0 and I/1/L mix-ups are forgiven on import.
 */
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function toB32(bytes) {
  let bits = 0, val = 0, out = '';
  for (const b of bytes) {
    val = (val << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(val >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

function normalise(str) {
  return str
    .replace(/[\s-]/g, '')
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

function fromB32(str) {
  let bits = 0, val = 0;
  const out = [];
  for (const ch of str) {
    const v = B32.indexOf(ch);
    if (v < 0) return null;
    val = (val << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((val >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

function fnv16(bytes) {
  let h = 0x811c9dc5;
  for (const b of bytes) {
    h ^= b;
    h = (h * 0x01000193) >>> 0;
  }
  return ((h >>> 16) ^ (h & 0xffff)) & 0xffff;
}

function dayNum(iso) {
  if (!iso) return 0;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return 0;
  const n = Math.floor(Date.UTC(y, m - 1, d) / 86400000) - EPOCH;
  return n > 0 && n < 65535 ? n : 0;
}

function dayIso(n) {
  if (!n) return null;
  const d = new Date((n + EPOCH) * 86400000);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

function group(s, size = 6) {
  const parts = [];
  for (let i = 0; i < s.length; i += size) parts.push(s.slice(i, i + size));
  return parts.join('-');
}

/**
 * @param {object} state
 * @param {string[]} order ordered mission ids from the content registry
 */
export function exportCode(state, order) {
  const body = [];
  body.push(FMT);
  const xp = Math.max(0, Math.min(16777215, Math.round(state.xp || 0)));
  body.push((xp >> 16) & 255, (xp >> 8) & 255, xp & 255);
  body.push(Math.min(255, state.streak || 0));
  body.push(Math.min(255, state.bestStreak || 0));
  const dn = dayNum(state.lastDay);
  body.push((dn >> 8) & 255, dn & 255);
  body.push(Math.min(255, order.length));
  let bits = 0;
  let acc = 0;
  for (const id of order) {
    const rec = (state.missions || {})[id] || {};
    const hints = Math.min(3, rec.hints || 0);
    acc = (acc << 3) | ((rec.done ? 4 : 0) | hints);
    bits += 3;
    while (bits >= 8) {
      body.push((acc >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  if (bits > 0) body.push((acc << (8 - bits)) & 255);
  const sum = fnv16(body);
  body.push((sum >> 8) & 255, sum & 255);
  return `${PREFIX}-${group(toB32(Uint8Array.from(body)))}`;
}

/**
 * @returns {{ok: true, state: object, slots: number} | {ok: false, error: string}}
 */
export function importCode(text, order) {
  if (!text || typeof text !== 'string') return { ok: false, error: 'Paste a save code first.' };
  // Accept the prefix however it was typed, including a 1 written as I or l.
  const head = text.trim().match(/^RLAB[1IL]\s*-?\s*([\s\S]*)$/i);
  if (!head) {
    return { ok: false, error: `That doesn't look like an R Lab code — they start with "${PREFIX}-".` };
  }
  const s = normalise(head[1]);
  const bytes = fromB32(s);
  if (!bytes) return { ok: false, error: 'That code has characters that are not part of a save code. Try copying it again.' };
  if (bytes.length < 12) return { ok: false, error: 'That code is too short to be complete — it may have been cut off when copied.' };
  // The final character carries spare bits that the checksum cannot see, so
  // require the code to be in canonical form before trusting it.
  if (toB32(bytes) !== s) {
    return { ok: false, error: 'That code has a character that does not belong, so it is not a valid save code. Copy the whole code and try again.' };
  }

  const body = bytes.slice(0, bytes.length - 2);
  const want = (bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1];
  if (fnv16(body) !== want) {
    return { ok: false, error: 'That code failed its checksum, so a character is wrong or missing. Copy the whole code and try again.' };
  }
  if (body[0] !== FMT && body[0] !== 1) {
    return { ok: false, error: `That code is format v${body[0]}, which this version of R Lab does not know how to read.` };
  }

  const xp = (body[1] << 16) | (body[2] << 8) | body[3];
  const streak = body[4];
  const bestStreak = body[5];
  const lastDay = dayIso((body[6] << 8) | body[7]);
  const slots = body[8];
  const missions = {};
  const slotValue = body[0] === 1
    ? (i) => {
      const b = body[9 + i];
      return b === undefined ? undefined : ((b & 0x80 ? 4 : 0) | (b & 3));
    }
    : (i) => {
      const bit = i * 3;
      const byte = body[9 + (bit >> 3)];
      if (byte === undefined) return undefined;
      // A slot can straddle two bytes, so read 16 bits and shift the window.
      const next = body[9 + (bit >> 3) + 1] || 0;
      const window = (byte << 8) | next;
      return (window >>> (13 - (bit & 7))) & 7;
    };
  for (let i = 0; i < slots; i++) {
    const v = slotValue(i);
    if (v === undefined) break;
    const id = order[i];
    if (!id) continue;                 // code from a build with more missions
    const done = !!(v & 4);
    const hints = v & 3;
    if (done || hints) missions[id] = { done, hints, tries: done ? 1 : 0 };
  }
  return {
    ok: true, slots,
    state: { v: 1, xp, streak, bestStreak, lastDay, missions },
  };
}

/** Which save has more in it — used to refuse to silently overwrite. */
export function compareProgress(a, b) {
  const score = (s) => {
    const done = Object.values(s.missions || {}).filter((m) => m.done).length;
    return { done, xp: s.xp || 0 };
  };
  const A = score(a), B = score(b);
  let verdict = 'same';
  if (B.done > A.done || (B.done === A.done && B.xp > A.xp)) verdict = 'incoming-better';
  else if (A.done > B.done || (A.done === B.done && A.xp > B.xp)) verdict = 'local-better';
  return { verdict, local: A, incoming: B };
}

/** Best of both: union of passed missions, higher XP, longer streak. */
export function mergeProgress(local, incoming) {
  const missions = { ...(local.missions || {}) };
  for (const [id, rec] of Object.entries(incoming.missions || {})) {
    const cur = missions[id];
    if (!cur) missions[id] = rec;
    else {
      missions[id] = {
        done: cur.done || rec.done,
        hints: Math.min(cur.hints || 0, rec.hints || 0),
        tries: Math.max(cur.tries || 0, rec.tries || 0),
        at: cur.at || rec.at,
      };
    }
  }
  const newer = (a, b) => (!a ? b : !b ? a : a > b ? a : b);
  return {
    v: 1,
    xp: Math.max(local.xp || 0, incoming.xp || 0),
    streak: Math.max(local.streak || 0, incoming.streak || 0),
    bestStreak: Math.max(local.bestStreak || 0, incoming.bestStreak || 0),
    lastDay: newer(local.lastDay, incoming.lastDay),
    missions,
  };
}
