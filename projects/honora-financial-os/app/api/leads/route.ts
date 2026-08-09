import { apiError, getApiIdentity, json, oneOf, readJson, requiredText, unauthorized } from "../../../lib/api";
import type { LeadStatus } from "../../../lib/client-to-cash";
import { parseLeadInput } from "../../../lib/lead-api";
import { createLead, getDashboard, updateLeadStatus } from "../../../lib/server-store";

const statuses = ["new", "qualified", "proposal", "won", "lost"] as const;

export async function POST(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    await createLead(identity, parseLeadInput(body));
    return json(await getDashboard(identity), 201);
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    await updateLeadStatus(
      identity,
      requiredText(body.leadId, "Lead", 80),
      oneOf<LeadStatus>(body.status, statuses, "Estado"),
    );
    return json(await getDashboard(identity));
  } catch (error) { return apiError(error); }
}
