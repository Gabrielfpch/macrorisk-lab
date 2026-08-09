import { apiError, json, readJson } from "../../../../lib/api";
import { parseLeadInput } from "../../../../lib/lead-api";
import { createLeadFromIntake, getPublicIntake } from "../../../../lib/server-store";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { slug } = await context.params;
    const intake = await getPublicIntake(slug);
    return intake ? json(intake) : json({ error: "Formulario no encontrado." }, 404);
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 20_000) {
      const error = new Error("Solicitud demasiado grande.");
      Object.assign(error, { status: 413, code: "PAYLOAD_TOO_LARGE" });
      throw error;
    }
    const body = await readJson<Record<string, unknown>>(request);
    if (typeof body.website === "string" && body.website.trim()) return json({ ok: true }, 202);
    const { slug } = await context.params;
    await createLeadFromIntake(slug, parseLeadInput({ ...body, source: "honora_form" }));
    return json({ ok: true }, 201);
  } catch (error) { return apiError(error); }
}
