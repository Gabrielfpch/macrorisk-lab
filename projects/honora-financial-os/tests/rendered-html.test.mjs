import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

async function listJavaScriptFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listJavaScriptFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(relative(projectRoot, path));
  }
  return files;
}

async function listBundledWorkerModules(directory) {
  const files = await listJavaScriptFiles(directory);
  const entrypoint = "dist/server/index.js";
  return [entrypoint, ...files.filter((path) => path !== entrypoint).sort()].map((path) => ({ type: "ESModule", path }));
}

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /Iniciar sesión/);
  assert.match(html, /href=["']\/login["']/);
});

test("el acceso público separa inicio de sesión, registro y demo", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("login-page-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const environment = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };

  const gateway = await worker.fetch(new Request("http://localhost/login", { headers: { accept: "text/html" } }), environment, context);
  assert.equal(gateway.status, 200);
  const html = await gateway.text();
  assert.match(html, /Inicia sesión o crea tu cuenta/);
  assert.match(html, /\/signin-with-chatgpt\?return_to=%2Fapp/);
  assert.match(html, /href=["']\/demo\/login["']/);

  const protectedPage = await worker.fetch(new Request("http://localhost/app", { headers: { accept: "text/html" }, redirect: "manual" }), environment, context);
  assert.ok([303, 307, 308].includes(protectedPage.status));
  assert.match(protectedPage.headers.get("location") ?? "", /\/signin-with-chatgpt\?return_to=%2Fapp$/);
});

test("una cuenta nueva persiste, queda aislada y completa los flujos principales", async () => {
  const mf = new Miniflare({
    rootPath: projectRoot,
    modules: await listBundledWorkerModules(join(projectRoot, "dist/server")),
    compatibilityDate: "2026-05-15",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: `honora-account-${process.pid}-${Date.now()}` },
    serviceBindings: { ASSETS: async () => new Response("Not found", { status: 404 }) },
  });
  const database = await mf.getD1Database("DB");
  try {
    for (const migration of ["0000_low_pixie.sql", "0001_spooky_the_call.sql", "0002_careless_vulture.sql", "0003_cool_baron_zemo.sql"]) {
      const sql = await readFile(new URL(`../drizzle/${migration}`, import.meta.url), "utf8");
      for (const statement of sql.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) {
        await database.prepare(statement).run();
      }
    }

    const identityHeaders = {
      "oai-authenticated-user-email": "nueva.cuenta@example.com",
      "oai-authenticated-user-full-name": encodeURIComponent("Nueva Cuenta"),
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    };

    const signedInGateway = await mf.dispatchFetch("http://localhost/login", { headers: { ...identityHeaders, accept: "text/html" } });
    assert.equal(signedInGateway.status, 200);
    const signedInHtml = await signedInGateway.text();
    assert.match(signedInHtml, /Tu sesión ya está activa/);
    assert.match(signedInHtml, /href=["']\/app["']/);

    const protectedWorkspace = await mf.dispatchFetch("http://localhost/app", { headers: { ...identityHeaders, accept: "text/html" } });
    assert.equal(protectedWorkspace.status, 200);

    const first = await mf.dispatchFetch("http://localhost/api/dashboard", { headers: identityHeaders });
    const firstBody = await first.text();
    assert.equal(first.status, 200, firstBody);
    const firstAccount = JSON.parse(firstBody);
    assert.equal(firstAccount.user.email, "nueva.cuenta@example.com");
    assert.equal(firstAccount.workspace.onboardingCompleted, false);

    const onboarded = await mf.dispatchFetch("http://localhost/api/onboarding", {
      method: "POST",
      headers: { ...identityHeaders, "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Nueva Cuenta", businessName: "Estudio QA", businessType: "Consultoría", primaryService: "Finanzas", revenueGoal: 12000, monthlyFixedCosts: 2000, cashReserve: 5000, billableHours: 80, targetMargin: 25, reserveRate: 8, sampleData: true }),
    });
    assert.equal(onboarded.status, 201);
    const completed = await onboarded.json();
    assert.equal(completed.workspace.onboardingCompleted, true);
    assert.equal(completed.workspace.businessName, "Estudio QA");
    assert.ok(completed.ledgerEntries.length > 0);
    assert.equal(completed.financials.balanceSheet.balanced, true);

    const repeated = await mf.dispatchFetch("http://localhost/api/dashboard", { headers: identityHeaders });
    assert.equal(repeated.status, 200);
    const sameAccount = await repeated.json();
    assert.equal(sameAccount.user.id, firstAccount.user.id);
    assert.equal(sameAccount.workspace.id, firstAccount.workspace.id);
    assert.equal(sameAccount.workspace.onboardingCompleted, true);

    const other = await mf.dispatchFetch("http://localhost/api/dashboard", { headers: { "oai-authenticated-user-email": "otra@example.com" } });
    assert.equal(other.status, 200);
    const otherAccount = await other.json();
    assert.notEqual(otherAccount.user.id, firstAccount.user.id);
    assert.notEqual(otherAccount.workspace.id, firstAccount.workspace.id);

    const userCount = await database.prepare("SELECT count(*) AS total FROM users").first();
    const workspaceCount = await database.prepare("SELECT count(*) AS total FROM workspaces").first();
    assert.equal(userCount.total, 2);
    assert.equal(workspaceCount.total, 2);

    await database.prepare("UPDATE workspaces SET plan = 'pro' WHERE id = ?").bind(firstAccount.workspace.id).run();
    const jsonRequest = (path, body, method = "POST", headers = identityHeaders) => mf.dispatchFetch(`http://localhost${path}`, {
      method,
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const publicIntake = await mf.dispatchFetch(`http://localhost/api/intake/${completed.workspace.intakeSlug}`);
    assert.equal(publicIntake.status, 200);
    const intakeInfo = await publicIntake.json();
    assert.equal(intakeInfo.businessName, "Estudio QA");

    const intakeSubmission = await jsonRequest(`/api/intake/${completed.workspace.intakeSlug}`, { fullName: "Lead Público", email: "publico@example.com", phone: "999111222", business: "Empresa Pública", service: "Finanzas", challenge: "Necesitamos ordenar el proceso financiero y proyectar caja para los próximos meses.", budget: 4500, urgency: "30d" }, "POST", {});
    assert.equal(intakeSubmission.status, 201);

    const createdLeadResponse = await jsonRequest("/api/leads", { fullName: "Lead Integración", email: "lead@example.com", phone: "999222333", business: "Integración SAC", service: "Finanzas", challenge: "Necesitamos mejorar pricing, cobranza y visibilidad del flujo de caja del negocio.", budget: 6200, urgency: "7d", source: "manual" });
    assert.equal(createdLeadResponse.status, 201);
    const afterLead = await createdLeadResponse.json();
    const createdLead = afterLead.leads.find((lead) => lead.email === "lead@example.com");
    assert.ok(createdLead);

    const qualifiedResponse = await jsonRequest("/api/leads", { leadId: createdLead.id, status: "qualified" }, "PATCH");
    assert.equal(qualifiedResponse.status, 200);
    assert.equal((await qualifiedResponse.json()).leads.find((lead) => lead.id === createdLead.id).status, "qualified");

    const convertedResponse = await jsonRequest("/api/leads/convert", { leadId: createdLead.id });
    assert.equal(convertedResponse.status, 201);
    const afterConversion = await convertedResponse.json();
    assert.ok(afterConversion.clients.some((client) => client.email === "lead@example.com"));
    assert.ok(afterConversion.quotes.some((quote) => quote.clientName === "Lead Integración"));

    const importedResponse = await jsonRequest("/api/leads/import", { leads: [{ fullName: "Lead CSV", email: "csv@example.com", service: "Consultoría", challenge: "Buscamos automatizar el seguimiento comercial y medir cada oportunidad del pipeline.", budget: 2800, urgency: "30d" }] });
    assert.equal(importedResponse.status, 201);
    const importedData = await importedResponse.json();
    assert.equal(importedData.imported, 1);
    assert.ok(importedData.leads.some((lead) => lead.email === "csv@example.com" && lead.source === "google_forms_csv"));

    const clientResponse = await jsonRequest("/api/clients", { name: "Cliente Integración", email: "cliente@example.com", monthlyRevenue: 3200, paymentTermsDays: 15 });
    assert.equal(clientResponse.status, 201);
    assert.ok((await clientResponse.json()).clients.some((client) => client.email === "cliente@example.com"));

    const quoteResponse = await jsonRequest("/api/quotes", { clientName: "Cliente Integración", projectName: "Financial Sprint", hours: 20, hourlyRate: 120, externalCosts: 200, contingencyRate: 10, targetMargin: 25 });
    assert.equal(quoteResponse.status, 201);
    assert.ok((await quoteResponse.json()).quotes.some((quote) => quote.projectName === "Financial Sprint" && quote.total > 0));

    const invoiceResponse = await jsonRequest("/api/invoices", { clientName: "Cliente Integración", description: "Implementación QA", amount: 1500, dueDate: "2026-09-30" });
    assert.equal(invoiceResponse.status, 201);
    const invoiceData = await invoiceResponse.json();
    const createdInvoice = invoiceData.invoices.find((invoice) => invoice.description === "Implementación QA");
    assert.ok(createdInvoice);
    const paidResponse = await jsonRequest("/api/invoices", { invoiceId: createdInvoice.id }, "PATCH");
    assert.equal(paidResponse.status, 200);
    const paidData = await paidResponse.json();
    assert.equal(paidData.invoices.find((invoice) => invoice.id === createdInvoice.id).status, "paid");
    assert.equal(paidData.ledgerEntries.filter((entry) => entry.invoiceId === createdInvoice.id).length, 1);

    const ledgerResponse = await jsonRequest("/api/ledger", { kind: "expense", category: "Software", description: "Herramienta QA", amount: 180, occurredOn: "2026-08-09", clientName: "" });
    assert.equal(ledgerResponse.status, 201);
    const ledgerData = await ledgerResponse.json();
    assert.ok(ledgerData.ledgerEntries.some((entry) => entry.description === "Herramienta QA"));
    assert.equal(ledgerData.financials.balanceSheet.balanced, true);

    const copilotResponse = await jsonRequest("/api/copilot", { question: "¿Cómo está mi estado de resultados?" });
    assert.equal(copilotResponse.status, 200);
    const copilotAnswer = await copilotResponse.json();
    assert.equal(copilotAnswer.intent, "profitability");
    assert.ok(copilotAnswer.answer);

    const settingsResponse = await jsonRequest("/api/dashboard", { businessName: "Estudio QA Pro", businessType: "Consultoría", primaryService: "Finanzas", revenueGoal: 15000, monthlyFixedCosts: 2200, reserveRate: 9, targetMargin: 28, cashReserve: 6000, billableHours: 85 }, "PATCH");
    assert.equal(settingsResponse.status, 200);
    const settingsData = await settingsResponse.json();
    assert.equal(settingsData.workspace.businessName, "Estudio QA Pro");
    assert.ok(settingsData.copilotHistory.some((conversation) => conversation.question === "¿Cómo está mi estado de resultados?"));

    const finalDashboard = await mf.dispatchFetch("http://localhost/api/dashboard", { headers: identityHeaders });
    assert.equal(finalDashboard.status, 200);
    const finalData = await finalDashboard.json();
    assert.equal(finalData.workspace.businessName, "Estudio QA Pro");
    assert.equal(finalData.financials.balanceSheet.balanced, true);
  } finally {
    await mf.dispose();
  }
});

test("billing checkout requires an account and fails closed without merchant config", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("billing-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const environment = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };

  const anonymous = await worker.fetch(new Request("http://localhost/api/billing/checkout", { method: "POST" }), environment, context);
  assert.equal(anonymous.status, 401);

  const authenticated = await worker.fetch(new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    headers: { "oai-authenticated-user-email": "qa@example.com" },
  }), environment, context);
  assert.equal(authenticated.status, 503);
  assert.equal((await authenticated.json()).code, "BILLING_NOT_CONFIGURED");
});

test("la cuenta demo exige credenciales y crea una sesión aislada", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("demo-auth-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const environment = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };

  const rejected = await worker.fetch(new Request("http://localhost/api/demo/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "gabriel", password: "incorrecta" }) }), environment, context);
  assert.equal(rejected.status, 401);

  const accepted = await worker.fetch(new Request("http://localhost/api/demo/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "gabriel", password: "honora2026" }) }), environment, context);
  assert.equal(accepted.status, 200);
  assert.match(accepted.headers.get("set-cookie") ?? "", /honora_demo_session=/);
  assert.equal((await accepted.json()).redirectTo, "/demo");

  const secure = await worker.fetch(new Request("https://localhost/api/demo/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "gabriel", password: "honora2026" }) }), environment, context);
  assert.equal(secure.status, 200);
  assert.match(secure.headers.get("set-cookie") ?? "", /; Secure$/);
});
