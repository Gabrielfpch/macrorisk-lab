# Honora — Client-to-Cash OS

Honora une captación, CRM, pricing, cobros y cash flow para profesionales independientes. Su trabajo no es mostrar más gráficos: es asegurar que cada consulta tenga un siguiente paso hasta convertirse en dinero cobrado.

## Producto

- **Smart Intake:** formulario compartible conectado directamente al Lead Inbox.
- **Qualification Engine:** Fit Score explicable y next best action usando presupuesto, timing, claridad y contexto de contacto.
- **Client-to-Cash Pipeline:** estados `new`, `qualified`, `proposal`, `won` y `lost`.
- **One-click conversion:** un lead se convierte en cliente + protected quote sin volver a copiar datos.
- **Google Forms Bridge:** importación CSV desde Google Sheets con mapeo bilingüe y auto-score.
- **Honora Copilot:** asistente determinístico, basado en los datos del workspace y con evidencia visible.
- **Money Moves:** acciones semanales derivadas de overdue invoices, hot leads, draft quotes y revenue concentration.
- **Collection Radar, 13-week Cash Forecast y Client Economics.**
- **Cuenta segura con Sign in with ChatGPT** y datos persistentes separados por usuario en Cloudflare D1.

## Rutas

| Ruta | Función |
|---|---|
| `/` | Landing comercial Client-to-Cash |
| `/demo` | Demo interactiva y editable sin persistencia |
| `/app` | Workspace autenticado |
| `/intake/[slug]` | Smart Intake compartible |
| `/api/leads` | Alta y avance de leads |
| `/api/leads/convert` | Conversión a cliente + quote |
| `/api/leads/import` | Google Forms / Sheets CSV Bridge |
| `/api/copilot` | Respuestas contextuales con evidencia |
| `/api/dashboard` | Command Center y configuración |
| `/api/clients` | Client Economics |
| `/api/invoices` | Collection Radar |
| `/api/quotes` | Protected Quotes |
| `/api/billing/*` | Checkout alojado y webhook de suscripción |

## Planes y límites

Free permite 10 leads activos, 2 clientes, 5 accounts receivable, 1 quote y 5 preguntas Copilot por mes. Pro desbloquea records, Google Forms Bridge y Copilot sin límites. Los límites se comprueban en el servidor.

## Seguridad

- Cada consulta autenticada se limita al `workspace_id` del usuario.
- El Smart Intake valida tamaño, campos, honeypot y envíos duplicados recientes.
- Honora no usa datos demográficos o sensibles para calificar leads.
- Mercado Pago procesa el checkout alojado; Honora no recibe PAN, CVV ni fecha de expiración.
- El webhook valida HMAC SHA-256 antes de consultar la suscripción y cambiar el plan.
- Sin credenciales de merchant, billing falla de forma segura con `BILLING_NOT_CONFIGURED`.

Variables de billing, siempre como secretos del entorno:

```bash
HONORA_CHECKOUT_URL=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
```

## Desarrollo y verificación

```bash
npm run db:generate
npx tsc --noEmit
npm run lint
npm test
```

`npm test` compila el Worker, valida el artifact de Sites y ejecuta pruebas de modelos financieros, Fit Score, CSV Bridge, automations, Copilot, render y billing fail-closed.

## Nota responsable

Honora es una herramienta de planificación operativa. No sustituye asesoría contable, tributaria, legal ni de inversión.

Creado por Gabriel Pérez Chávez · Perú · 2026
