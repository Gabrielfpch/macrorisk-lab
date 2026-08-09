import { apiError, getApiIdentity, json, numberInRange, oneOf, readJson, requiredText, unauthorized } from "../../../lib/api";
import { completeOnboarding, getDashboard } from "../../../lib/server-store";

const businessTypes = ["Consultoría", "Creativo / diseño", "Tecnología", "Marketing", "Servicios profesionales", "Otro"] as const;

export async function POST(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    await completeOnboarding(identity, {
      displayName: requiredText(body.displayName, "Nombre", 100),
      businessName: requiredText(body.businessName, "Nombre del negocio", 100),
      businessType: oneOf(body.businessType, businessTypes, "Tipo de negocio"),
      primaryService: requiredText(body.primaryService, "Servicio principal", 120),
      revenueGoal: numberInRange(body.revenueGoal, "Meta de revenue", 0, 100_000_000),
      monthlyFixedCosts: numberInRange(body.monthlyFixedCosts, "Costos mensuales", 0, 10_000_000),
      cashReserve: numberInRange(body.cashReserve, "Caja inicial", 0, 100_000_000),
      billableHours: numberInRange(body.billableHours, "Horas facturables", 1, 744),
      targetMargin: numberInRange(body.targetMargin, "Target margin", 0, 80),
      reserveRate: numberInRange(body.reserveRate, "Reserva tributaria", 0, 60),
      sampleData: body.sampleData === true,
    });
    return json(await getDashboard(identity), 201);
  } catch (error) {
    return apiError(error);
  }
}
