import type { AccountIdentity } from "./server-store";

const EMAIL_HEADER = "oai-authenticated-user-email";
const NAME_HEADER = "oai-authenticated-user-full-name";
const NAME_ENCODING_HEADER = "oai-authenticated-user-full-name-encoding";

export function getApiIdentity(request: Request): AccountIdentity | null {
  const email = request.headers.get(EMAIL_HEADER)?.trim();
  if (!email) return null;
  let name = email;
  const encodedName = request.headers.get(NAME_HEADER);
  if (encodedName && request.headers.get(NAME_ENCODING_HEADER) === "percent-encoded-utf-8") {
    try { name = decodeURIComponent(encodedName); } catch { name = email; }
  }
  return { email, name };
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

export function unauthorized() {
  return json({ error: "Inicia sesión para continuar.", code: "UNAUTHORIZED" }, 401);
}

export function apiError(error: unknown) {
  const known = error as { message?: string; status?: number; code?: string };
  const status = Number.isInteger(known?.status) ? known.status! : 500;
  return json({
    error: status >= 500 ? "No pudimos completar la operación. Intenta otra vez." : known.message,
    code: known.code ?? (status >= 500 ? "SERVER_ERROR" : "BAD_REQUEST"),
  }, status);
}

export async function readJson<T>(request: Request): Promise<T> {
  try { return await request.json() as T; }
  catch {
    const error = new Error("El cuerpo de la solicitud no es JSON válido.");
    Object.assign(error, { status: 400, code: "INVALID_JSON" });
    throw error;
  }
}

export function requiredText(value: unknown, label: string, max = 120) {
  if (typeof value !== "string" || !value.trim()) throw validation(`${label} es obligatorio.`);
  return value.trim().slice(0, max);
}

export function optionalText(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function emailAddress(value: unknown, label = "Email") {
  const email = requiredText(value, label, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw validation(`${label} no es válido.`);
  return email;
}

export function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw validation(`${label} no es válido.`);
  return value as T;
}

export function numberInRange(value: unknown, label: string, minimum: number, maximum: number) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw validation(`${label} debe estar entre ${minimum} y ${maximum}.`);
  }
  return number;
}

export function isoDate(value: unknown, label = "Fecha") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw validation(`${label} no es válida.`);
  }
  return value;
}

function validation(message: string) {
  const error = new Error(message);
  Object.assign(error, { status: 400, code: "VALIDATION_ERROR" });
  return error;
}
