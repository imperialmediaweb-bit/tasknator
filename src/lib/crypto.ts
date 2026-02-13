import sodium from "libsodium-wrappers";

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await sodium.ready;
    initialized = true;
  }
}

function getKey(): Uint8Array {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return sodium.from_hex(hex);
}

export async function encrypt(plaintext: string): Promise<{ ciphertext: string; nonce: string }> {
  await ensureInit();
  const key = getKey();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const encrypted = sodium.crypto_secretbox_easy(
    sodium.from_string(plaintext),
    nonce,
    key
  );
  return {
    ciphertext: sodium.to_base64(encrypted),
    nonce: sodium.to_base64(nonce),
  };
}

export async function decrypt(ciphertext: string, nonce: string): Promise<string> {
  await ensureInit();
  const key = getKey();
  const decrypted = sodium.crypto_secretbox_open_easy(
    sodium.from_base64(ciphertext),
    sodium.from_base64(nonce),
    key
  );
  return sodium.to_string(decrypted);
}
