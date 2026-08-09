import { apiError, getApiIdentity, isoDate, json, numberInRange, optionalText, readJson, requiredText, unauthorized } from "../../../lib/api";
import { createInvoice, getDashboard, markInvoicePaid } from "../../../lib/server-store";

export async function POST(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    await createInvoice(identity, {
      clientId: optionalText(body.clientId, 80),
      clientName: requiredText(body.clientName, "Cliente", 100),
      description: requiredText(body.description, "Concepto", 180),
      amount: numberInRange(body.amount, "Monto", .01, 10_000_000),
      dueDate: isoDate(body.dueDate, "Fecha de vencimiento"),
    });
    return json(await getDashboard(identity), 201);
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    await markInvoicePaid(identity, requiredText(body.invoiceId, "Cuenta por cobrar", 80));
    return json(await getDashboard(identity));
  } catch (error) { return apiError(error); }
}
