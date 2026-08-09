const DEMO_CREDENTIAL_HASH = "2e679325b48180fdb9eea55d604c059d44c7452d0960d7e0768fa9524dfba33d";

export const DEMO_COOKIE_NAME = "honora_demo_session";
export const DEMO_SESSION_TOKEN = "fe745e9ac0326ddb557913387220a0180b143e1f3b5c9ca1df69fcb347b705c3";

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyDemoCredentials(username: string, password: string) {
  const candidate = await sha256(`${username.trim().toLowerCase()}:${password}`);
  if (candidate.length !== DEMO_CREDENTIAL_HASH.length) return false;
  let different = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    different |= candidate.charCodeAt(index) ^ DEMO_CREDENTIAL_HASH.charCodeAt(index);
  }
  return different === 0;
}
