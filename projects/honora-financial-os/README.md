# Honora — Financial OS

Honora convierte clientes, pricing, cuentas por cobrar y caja en decisiones semanales para profesionales independientes. La versión 2 deja de ser una landing/calculadora aislada y funciona como un SaaS con cuenta, datos persistentes, límites de plan y billing preparado.

## Producto

- Cuenta segura mediante Sign in with ChatGPT; Honora no administra contraseñas.
- Workspace privado por usuario sobre Cloudflare D1.
- Executive overview con revenue, accounts receivable, client concentration y Honora Score.
- Collection Radar con vencimientos, overdue y conciliación de cobros.
- Project Quote Builder con labor, external costs, contingency y target margin.
- Rolling 13-week Cash Forecast.
- Configuración financiera persistente.
- Plan Free con límites aplicados en servidor y Honora Pro a S/ 29.90/mes para los primeros 100 clientes.

## Rutas

| Ruta | Función |
|---|---|
| `/` | Landing comercial |
| `/demo` | Demo interactiva sin persistencia |
| `/app` | Workspace autenticado |
| `/api/dashboard` | Estado y configuración financiera |
| `/api/clients` | Alta de clientes |
| `/api/invoices` | Cuentas por cobrar y conciliación |
| `/api/quotes` | Cotizaciones protegidas |
| `/api/billing/checkout` | Redirección al checkout alojado |
| `/api/billing/webhook` | Sincronización segura de suscripción |

## Seguridad de pagos

El diseño usa Mercado Pago Subscriptions con checkout alojado. Honora nunca recibe ni almacena PAN, CVV o fecha de expiración. El webhook valida HMAC SHA-256 antes de consultar la suscripción por API y actualizar el plan.

Variables de producción, siempre como secretos del entorno y nunca en Git:

```bash
HONORA_CHECKOUT_URL=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
```

Sin estas variables, el billing falla de forma segura con `BILLING_NOT_CONFIGURED`; no se muestra un pago ficticio.

## Desarrollo y verificación

```bash
npm run db:generate
npm test
npm run lint
```

`npm test` compila el Worker, valida el artifact de Sites y ejecuta pruebas financieras, de render y del cierre seguro del checkout.

## Límites Free

- 2 clientes
- 5 accounts receivable
- 1 project quote

Los límites se comprueban en el servidor. Cambiar el estado visual del cliente no los evita.

## Nota responsable

Honora es una herramienta educativa de planificación financiera. No sustituye asesoría contable, tributaria, legal ni de inversión.

Creado por Gabriel Pérez Chávez · Perú · 2026
