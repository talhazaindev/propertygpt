/**
 * Hybrid message encryption: AES-256-GCM with a shared support key.
 * Metadata/routing stay plaintext; only message bodies (and previews) are encrypted at rest.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function getKey(): Buffer {
  const secret =
    process.env.MESSAGE_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "dev-only-message-key-change-me";
  return createHash("sha256").update(secret).digest();
}

export function encryptText(plaintext: string): { ciphertext: string; iv: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([encrypted, tag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptText(ciphertext: string, iv: string): string {
  const data = Buffer.from(ciphertext, "base64");
  const tag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function previewText(plaintext: string, maxLen = 120): string {
  const trimmed = plaintext.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}
