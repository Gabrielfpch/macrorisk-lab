import { env } from "cloudflare:workers";
import { json } from "../../../../lib/api";
import { updateSubscriptionByEmail } from "../../../../lib/server-store";

function parseSignature(value: string | null) {
  const entries = (value ?? "").split(",").map((part) => part.trim().split("="));
  return Object.fromEntries(entries.filter((part) => part.length === 2)) as Record<string, string>;
}

async function hmacHex(secret: string, message: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function POST(request: Request) {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const secret = runtimeEnv.MERCADOPAGO_WEBHOOK_SECRET;
  const token = runtimeEnv.MERCADOPAGO_ACCESS_TOKEN;
  if (!secret || !token) return json({ error: "Billing no configurado." }, 503);

  const body = await request.json().catch(() => ({})) as { data?: { id?: string }; type?: string };
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? body.data?.id ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const signature = parseSignature(request.headers.get("x-signature"));
  if (!dataId || !requestId || !signature.ts || !signature.v1) return json({ error: "Firma incompleta." }, 401);

  const expected = await hmacHex(secret, `id:${dataId};request-id:${requestId};ts:${signature.ts};`);
  if (!timingSafeEqual(expected, signature.v1)) return json({ error: "Firma inválida." }, 401);
  if (body.type && body.type !== "subscription_preapproval") return json({ received: true, ignored: true });

  const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(dataId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return json({ error: "No se pudo verificar la suscripción." }, 502);
  const subscription = await response.json() as { id?: string; status?: string; payer_email?: string };
  if (!subscription.id || !subscription.status || !subscription.payer_email) return json({ error: "Suscripción incompleta." }, 422);
  const updated = await updateSubscriptionByEmail(subscription.payer_email, subscription.status, subscription.id);
  return json({ received: true, updated });
}
