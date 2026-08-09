import { apiError, getApiIdentity, json, readJson, requiredText, unauthorized } from "../../../../lib/api";
import { convertLead, getDashboard } from "../../../../lib/server-store";

export async function POST(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    await convertLead(identity, requiredText(body.leadId, "Lead", 80));
    return json(await getDashboard(identity), 201);
  } catch (error) { return apiError(error); }
}
