import { apiError, getApiIdentity, json, readJson, requiredText, unauthorized } from "../../../lib/api";
import { askCopilot } from "../../../lib/server-store";

export async function POST(request: Request) {
  const identity = getApiIdentity(request);
  if (!identity) return unauthorized();
  try {
    const body = await readJson<Record<string, unknown>>(request);
    return json(await askCopilot(identity, requiredText(body.question, "Pregunta", 500)));
  } catch (error) { return apiError(error); }
}
