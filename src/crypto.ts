const encoder = new TextEncoder();

export async function verifyLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): Promise<boolean> {
  if (!body || !signature || !channelSecret) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = bytesToBase64(new Uint8Array(digest));
  return constantTimeEqual(expected, signature);
}

export async function hashToUint32(input: string): Promise<number> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  const view = new DataView(digest);
  return view.getUint32(0, false);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
