# Honora Methodology

## Principio

Cada número debe terminar en una decisión: cuánto cobrar, qué cuenta perseguir, cuánta caja queda y qué cliente concentra el riesgo. Honora usa fórmulas visibles y supuestos configurables.

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
