import { apiError, getApiIdentity, json, numberInRange, readJson, requiredText, unauthorized } from "../../../lib/api";
import { getDashboard, updateWorkspace } from "../../../lib/server-store";

export async function GET(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try { return json(await getDashboard(identity)); }
  catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    await updateWorkspace(identity, {
      businessName: requiredText(body.businessName, "Nombre del negocio", 100),
      monthlyFixedCosts: numberInRange(body.monthlyFixedCosts, "Costos fijos", 0, 10_000_000),
      reserveRate: numberInRange(body.reserveRate, "Reserva", 0, 60),
      targetMargin: numberInRange(body.targetMargin, "Margen", 0, 80),
      cashReserve: numberInRange(body.cashReserve, "Caja", 0, 100_000_000),
      billableHours: numberInRange(body.billableHours, "Horas facturables", 1, 744),
    });
    return json(await getDashboard(identity));
  } catch (error) { return apiError(error); }
}
