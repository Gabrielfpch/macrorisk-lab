const virtualModule = "data:text/javascript,export const env = globalThis.__HONORA_TEST_ENV__ ?? {};";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") return { url: virtualModule, shortCircuit: true };
  return nextResolve(specifier, context);
}
