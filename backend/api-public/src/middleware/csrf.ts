import {Context, Next} from "hono";
import {getCookie, setCookie} from "hono/cookie";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "X-CSRF-Token";
const MUTATING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {name: "HMAC", hash: "SHA-256"},
    false,
    ["sign", "verify"],
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSignedToken(secret: string): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = toHex(bytes.buffer);

  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));

  return `${raw}.${toHex(signature)}`;
}

async function verifySignedToken(token: string, secret: string): Promise<boolean> {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const raw = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);

  const key = await getHmacKey(secret);
  const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));

  return signature === toHex(expectedSig);
}

export async function csrfProtection(c: Context, next: Next) {
  const secret = c.env.CSRF_SECRET;
  const token = getCookie(c, CSRF_COOKIE);

  if (MUTATING_METHODS.has(c.req.method)) {
    const headerToken = c.req.header(CSRF_HEADER);

    if (!headerToken || !(await verifySignedToken(headerToken, secret))) {
      return c.json({error: "CSRF token invalid"}, 403);
    }
  }

  if (!token || !(await verifySignedToken(token, secret))) {
    setCookie(c, CSRF_COOKIE, await createSignedToken(secret), {
      httpOnly: false,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 43200,
    });
  }

  await next();
}