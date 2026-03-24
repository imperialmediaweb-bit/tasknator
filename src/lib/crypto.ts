import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

export async function encrypt(
  plaintext: string
): Promise<{ ciphertext: string; nonce: string }> {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted + "." + tag.toString("base64"),
    nonce: iv.toString("base64"),
  };
}

export async function decrypt(
  ciphertext: string,
  nonce: string
): Promise<string> {
  const key = getKey();
  const iv = Buffer.from(nonce, "base64");
  const [encData, tagStr] = ciphertext.split(".");
  const tag = Buffer.from(tagStr, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encData, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
