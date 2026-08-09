import { apiError, getApiIdentity, json, numberInRange, readJson, requiredText, unauthorized } from "../../../lib/api";
import { calculateProjectQuote } from "../../../lib/honora";
import { createQuote, getDashboard } from "../../../lib/server-store";

export async function POST(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    const input = {
      clientName: requiredText(body.clientName, "Cliente", 100),
      projectName: requiredText(body.projectName, "Proyecto", 120),
      hours: numberInRange(body.hours, "Horas", .5, 10_000),
      hourlyRate: numberInRange(body.hourlyRate, "Tarifa", .01, 1_000_000),
      externalCosts: numberInRange(body.externalCosts, "Costos externos", 0, 10_000_000),
      contingencyRate: numberInRange(body.contingencyRate, "Contingencia", 0, 100),
      targetMargin: numberInRange(body.targetMargin, "Margen", 0, 85),
    };
    const calculated = calculateProjectQuote(input);
    await createQuote(identity, { ...input, total: calculated.total });
    return json(await getDashboard(identity), 201);
  } catch (error) { return apiError(error); }
}
