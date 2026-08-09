import { apiError, getApiIdentity, json, numberInRange, optionalText, readJson, requiredText, unauthorized } from "../../../lib/api";
import { createClient, getDashboard } from "../../../lib/server-store";

export async function POST(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    await createClient(identity, {
      name: requiredText(body.name, "Nombre del cliente", 100),
      email: optionalText(body.email, 160),
      monthlyRevenue: numberInRange(body.monthlyRevenue, "Ingreso mensual", 0, 10_000_000),
      paymentTermsDays: numberInRange(body.paymentTermsDays, "Días de pago", 0, 180),
    });
    return json(await getDashboard(identity), 201);
  } catch (error) { return apiError(error); }
}
