import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("todos los IDs usados por la aplicación existen una sola vez", () => {
  const htmlIds = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  const appReferences = [...app.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]);
  const duplicatedIds = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
  const missingIds = [...new Set(appReferences)].filter((id) => !htmlIds.includes(id));

  assert.deepEqual(duplicatedIds, []);
  assert.deepEqual(missingIds, []);
});

test("la interfaz declara español, transparencia y autoría", () => {
  assert.match(html, /<html lang="es">/);
  assert.match(html, /Sin black box\./);
  assert.match(html, /Gabriel Pérez/);
  assert.match(html, /100% long-only/);
});
