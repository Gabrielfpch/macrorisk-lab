import { json, readJson } from "../../../../lib/api";
import { DEMO_COOKIE_NAME, DEMO_SESSION_TOKEN, verifyDemoCredentials } from "../../../../lib/demo-auth";

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await readJson(request);
  } catch {
    return json({ error: "Completa el usuario y la contraseña." }, 400);
  }
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!(await verifyDemoCredentials(username, password))) {
    return json({ error: "Usuario o contraseña incorrectos." }, 401);
  }
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return new Response(JSON.stringify({ ok: true, redirectTo: "/demo" }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "set-cookie": `${DEMO_COOKIE_NAME}=${DEMO_SESSION_TOKEN}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${secure}`,
    },
  });
}
