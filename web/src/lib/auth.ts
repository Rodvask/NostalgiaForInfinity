export const AUTH_COOKIE = "nfi_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const base64 =
      value.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (value.length % 4)) % 4);
    const binary = atob(base64);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSession(
  maxAge: number,
  secret: string,
): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + maxAge;
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(String(expires)),
  );
  return `${expires}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySession(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token) return false;

  const separator = token.indexOf(".");
  if (separator <= 0) return false;

  const expires = token.slice(0, separator);
  const expiresAt = Number(expires);
  if (!Number.isInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const signature = decodeBase64Url(token.slice(separator + 1));
  if (!signature) return false;

  const key = await importKey(secret);
  const signatureBuffer = signature.buffer.slice(
    signature.byteOffset,
    signature.byteOffset + signature.byteLength,
  ) as ArrayBuffer;
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBuffer,
    encoder.encode(expires),
  );
}

export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\") || /%5c/i.test(value)) return "/";
  if (/[\u0000-\u001f\u007f]/.test(value)) return "/";

  try {
    const url = new URL(value, "https://nfi.invalid");
    if (url.origin !== "https://nfi.invalid") return "/";
    const destination = `${url.pathname}${url.search}${url.hash}`;
    if (!destination.startsWith("/") || destination.startsWith("//")) {
      return "/";
    }
    return destination;
  } catch {
    return "/";
  }
}
