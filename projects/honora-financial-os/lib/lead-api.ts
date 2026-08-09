import { emailAddress, numberInRange, oneOf, optionalText, requiredText } from "./api";
import type { LeadUrgency } from "./client-to-cash";

const urgencies = ["7d", "30d", "90d", "exploring"] as const;

export function parseLeadInput(body: Record<string, unknown>) {
  return {
    fullName: requiredText(body.fullName, "Nombre", 100),
    email: emailAddress(body.email),
    phone: optionalText(body.phone, 40),
    business: optionalText(body.business, 100),
    service: requiredText(body.service, "Servicio", 120),
    challenge: requiredText(body.challenge, "Necesidad", 900),
    budget: numberInRange(body.budget, "Presupuesto", 0, 10_000_000),
    urgency: oneOf<LeadUrgency>(body.urgency, urgencies, "Urgencia"),
    source: optionalText(body.source, 80) || "manual",
  };
}
