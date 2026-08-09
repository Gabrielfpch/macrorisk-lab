import { apiError, getApiIdentity, json, readJson, unauthorized } from "../../../../lib/api";
import { parseLeadInput } from "../../../../lib/lead-api";
import { getDashboard, importLeads } from "../../../../lib/server-store";

export async function POST(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<{ leads?: unknown[] }>(request);
    if (!Array.isArray(body.leads) || !body.leads.length) {
      const error = new Error("El archivo no contiene leads válidos.");
      Object.assign(error, { status: 400, code: "EMPTY_IMPORT" });
      throw error;
    }
    const parsed = body.leads.slice(0, 100).map((lead) => parseLeadInput(lead as Record<string, unknown>));
    const imported = await importLeads(identity, parsed.map((lead) => ({ ...lead, source: "google_forms_csv" })));
    return json({ ...(await getDashboard(identity)), imported }, 201);
  } catch (error) { return apiError(error); }
}
