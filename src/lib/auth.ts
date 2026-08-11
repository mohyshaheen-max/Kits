// Pure crypto primitives — no I/O, safe to import from server code, route
// handlers, or one-off scripts (e.g. the seed script) alike.

const PBKDF2_ITERATIONS = 210_000;

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return `${PBKDF2_ITERATIONS}:${toHex(salt)}:${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [iterationsStr, saltHex, hashHex] = stored.split(":");
  const iterations = Number(iterationsStr);
  if (!iterations || !saltHex || !hashHex) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex) as BufferSource, iterations, hash: "SHA-256" },
    key,
    256
  );
  const computed = toHex(bits);
  if (computed.length !== hashHex.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Signed session cookie — no KV, boring on purpose.
// Payload: "<adminId>.<expiryEpochSeconds>", signature = HMAC-SHA256(secret, payload)
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = "kits_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSession(adminId: number, secret: string): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${adminId}.${expiry}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifySession(cookieValue: string, secret: string): Promise<{ adminId: number } | null> {
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;
  const [adminIdStr, expiryStr, sigHex] = parts;
  const payload = `${adminIdStr}.${expiryStr}`;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, fromHex(sigHex) as BufferSource, new TextEncoder().encode(payload));
  if (!valid) return null;
  const expiry = Number(expiryStr);
  if (!expiry || expiry < Math.floor(Date.now() / 1000)) return null;
  const adminId = Number(adminIdStr);
  if (!adminId) return null;
  return { adminId };
}
