import { env } from "cloudflare:workers";
import { getApiIdentity, json, unauthorized } from "../../../../lib/api";

function safeCheckoutUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !(host === "mercadopago.com" || host.endsWith(".mercadopago.com") || host === "mercadopago.com.pe" || host.endsWith(".mercadopago.com.pe"))) return null;
    return url.toString();
  } catch { return null; }
}

export async function POST(request: Request) {
  if (!getApiIdentity(request)) return unauthorized();
  const checkoutUrl = safeCheckoutUrl((env as unknown as Record<string, string | undefined>).HONORA_CHECKOUT_URL);
  if (!checkoutUrl) {
    return json({
      error: "El checkout de Honora Pro aún no está activado. Tu cuenta y tus datos siguen disponibles.",
      code: "BILLING_NOT_CONFIGURED",
    }, 503);
  }
  return json({ url: checkoutUrl, provider: "Mercado Pago", price: 29.9, currency: "PEN" });
}
