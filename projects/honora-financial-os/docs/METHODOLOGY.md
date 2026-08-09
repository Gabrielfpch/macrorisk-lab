# Honora Methodology — Client-to-Cash

## Principio

Cada número debe terminar en una decisión: cuánto cobrar, qué cuenta perseguir, cuánta caja queda y qué cliente concentra el riesgo. Honora usa fórmulas visibles y supuestos configurables.

## Lead Fit Score

El score prioriza señales operativas declaradas por el propio prospecto:

```text
Fit Score = presupuesto (34) + urgencia (24) + claridad (22) + contexto de contacto (20)
```

- `hot`: 78–100, responder hoy.
- `warm`: 58–77, validar alcance y presupuesto en 48 horas.
- `nurture`: 0–57, entregar valor y mantener seguimiento.

No usa edad, género, ubicación precisa, origen, salud, crédito ni otras categorías sensibles. El score recomienda prioridad; el profesional conserva la decisión final.

## Money Moves

La cola semanal combina cuatro señales, ordenadas por prioridad y valor:

1. invoices `overdue`;
2. leads nuevos con Fit Score ≥ 58;
3. quotes en `draft` por al menos dos días;
4. top-client share ≥ 40%.

## Honora Copilot

Copilot clasifica preguntas por intención —collections, pricing, pipeline, concentration, cash flow y weekly plan— y responde únicamente con métricas calculadas del workspace. Cada respuesta incluye evidencia y next best action. Es un asistente operativo determinístico, no un modelo de lenguaje ni asesoría profesional.

## Google Forms Bridge

El parser CSV reconoce encabezados en español e inglés, campos entre comillas y montos con separadores decimales o de miles. Solo importa filas con nombre y email; los campos faltantes reciben defaults explícitos para validación posterior.

## Protected hourly rate

```text
operating burn = fixed costs + variable costs + debt payments
protected share = 1 - reserve rate - target margin
required gross = operating burn / protected share
protected hourly rate = required gross / billable hours
```

La reserva es una preferencia de planificación, no una tasa tributaria inferida.

## Project Quote

```text
labor cost = estimated hours × hourly rate
direct cost = labor cost + external costs
contingency = direct cost × contingency rate
protected cost = direct cost + contingency
quote total = protected cost / (1 - target margin)
```

El target margin se limita a 85% para evitar una división inestable. Los valores negativos se normalizan a cero.

## Client concentration

```text
top client share = top client monthly revenue / total monthly revenue
```

Una participación superior a 40% se trata como señal de concentración alta. No es una predicción de pérdida; es una alerta de dependencia.

## Accounts receivable

Una cuenta pendiente cuya fecha de vencimiento es anterior al día actual se reclasifica como `overdue`. `Cash in transit` suma cuentas pending y overdue; una conciliación `paid` deja de formar parte del forecast.

## 13-week Cash Forecast

El modelo abre cada semana con la caja de cierre anterior, reconoce las cuentas no pagadas en la semana de su vencimiento y descuenta `monthly fixed costs / 4.33`.

```text
closing cash[w] = opening cash[w] + scheduled inflows[w] - weekly operating cost
opening cash[w+1] = closing cash[w]
```

Señales:

- `healthy`: closing cash cubre al menos dos semanas de operating cost.
- `watch`: closing cash es positiva, pero inferior a dos semanas.
- `critical`: closing cash es negativa.

Es un rolling forecast operativo, no un pronóstico estadístico ni una recomendación de inversión.

## Billing integrity

- Checkout alojado por Mercado Pago; Honora no toca datos de tarjeta.
- URL de checkout restringida a dominios HTTPS de Mercado Pago.
- Webhook validado con HMAC SHA-256 y comparación de tiempo constante.
- El estado Pro solo cambia después de consultar la suscripción al proveedor.
- Sin configuración de merchant, el endpoint devuelve 503 y no simula una compra.
