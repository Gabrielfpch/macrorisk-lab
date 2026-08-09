import { apiError, getApiIdentity, isoDate, json, numberInRange, oneOf, optionalText, readJson, requiredText, unauthorized } from "../../../lib/api";
import { createLedgerEntry, getDashboard } from "../../../lib/server-store";
import type { LedgerKind } from "../../../lib/financial-statements";

const kinds = ["income", "expense"] as const;

export async function POST(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    await createLedgerEntry(identity, {
      kind: oneOf<LedgerKind>(body.kind, kinds, "Tipo de movimiento"),
      category: requiredText(body.category, "Categoría", 80),
      description: requiredText(body.description, "Descripción", 180),
      amount: numberInRange(body.amount, "Monto", .01, 100_000_000),
      occurredOn: isoDate(body.occurredOn, "Fecha"),
      clientName: optionalText(body.clientName, 100),
    });
    return json(await getDashboard(identity), 201);
  } catch (error) {
    return apiError(error);
  }
}
