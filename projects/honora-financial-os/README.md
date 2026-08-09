# Honora — Client-to-Cash OS

Honora une captación, CRM, pricing, cobros y cash flow para profesionales independientes. Su trabajo no es mostrar más gráficos: es asegurar que cada consulta tenga un siguiente paso hasta convertirse en dinero cobrado.

## Producto

- **Smart Intake:** formulario compartible conectado directamente al Lead Inbox.
- **Qualification Engine:** Fit Score explicable y next best action usando presupuesto, timing, claridad y contexto de contacto.
- **Client-to-Cash Pipeline:** estados `new`, `qualified`, `proposal`, `won` y `lost`.
- **One-click conversion:** un lead se convierte en cliente + protected quote sin volver a copiar datos.
- **Google Forms Bridge:** importación CSV desde Google Sheets con mapeo bilingüe y auto-score.
- **Honora Copilot:** asistente determinístico, basado en los datos del workspace y con evidencia visible.
- **Onboarding persistente:** el primer acceso crea y configura el workspace con una confirmación visible; ya no existe un CTA sin feedback.
- **Cuenta demo guiada:** login aislado para recorrer la experiencia completa sin tocar datos reales.
- **Connected Financial Core:** un Ledger alimenta Estado de resultados, Balance Sheet, Cash Flow, ratios y forecast.
- **Copilot Memory:** preguntas, respuestas, evidencia y next best action se guardan en D1 y pueden reabrirse.
- **Money Moves:** acciones semanales derivadas de overdue invoices, hot leads, draft quotes y revenue concentration.
- **Collection Radar, 13-week Cash Forecast y Client Economics.**
- **Cuenta segura con Sign in with ChatGPT** y datos persistentes separados por usuario en Cloudflare D1.

## Rutas

| Ruta | Función |
|---|---|
| `/` | Landing comercial Client-to-Cash |
| `/demo` | Demo interactiva y editable sin persistencia |
| `/demo/login` | Acceso con credenciales a la experiencia demo |
| `/login` | Puerta pública para crear una cuenta o volver al mismo workspace |
| `/app` | Workspace autenticado |
| `/api/onboarding` | Creación y configuración inicial de la cuenta |
| `/api/ledger` | Registro de ingresos y gastos conectados |
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

`npm test` compila el Worker, valida el artifact de Sites y ejecuta pruebas de modelos financieros, estados conectados, Fit Score, CSV Bridge, automations, memoria de Copilot, cuenta demo, render y billing fail-closed.

## Identidad y acceso

La cuenta de producción usa Sign in with ChatGPT y crea el usuario + workspace en D1 durante el primer acceso. Si el Site está en modo público, cualquier persona con una cuenta de ChatGPT puede registrarse desde `/login`; al volver con el mismo email recupera el mismo workspace. Honora no almacena contraseñas de producción. La cuenta demo es un entorno aislado y sin datos reales; sus credenciales existen únicamente para enseñar el recorrido del producto.

La prueba de integración ejecuta el Worker completo sobre una D1 efímera: confirma registro, aislamiento entre usuarios, persistencia, onboarding, Smart Intake público, leads, importación CSV, conversión, clientes, quotes, invoices, Ledger, estados financieros, Copilot y configuración.

## Modelo financiero conectado

- Un cobro marcado como pagado genera automáticamente su movimiento de ingreso en el Ledger.
- Un movimiento manual recalcula los tres estados, ratios, closing cash y forecast.
- El Balance Sheet verifica la identidad `Assets = Liabilities + Equity`.
- Los estados son una vista gerencial; no sustituyen estados preparados o auditados por un contador.

## Nota responsable

Honora es una herramienta de planificación operativa. No sustituye asesoría contable, tributaria, legal ni de inversión.

Creado por Gabriel Pérez Chávez · Perú · 2026
