# Honora — Financial OS

> **Tu talento factura. Tu caja decide.**

Honora es un micro‑SaaS local-first para profesionales independientes. Convierte ingresos irregulares, costos, horas facturables y riesgo de clientes en una tarifa protegida, cash runway, stress tests y un plan financiero de 90 días.

[![Product access](https://img.shields.io/badge/access-private-c8ff62?style=flat-square&labelColor=111612)](#privacidad)
[![Model checks](https://github.com/Gabrielfpch/honora-financial-os/actions/workflows/ci.yml/badge.svg)](https://github.com/Gabrielfpch/honora-financial-os/actions/workflows/ci.yml)
[![Privacy](https://img.shields.io/badge/privacy-local--first-1d704f?style=flat-square&labelColor=111612)](#privacidad)

## El problema

Muchos independientes saben cuánto facturan, pero no cuánto necesitan cobrar para cubrir costos, separar una reserva, proteger margen y absorber un mes débil. Honora convierte esas variables en una decisión clara sin exigir una cuenta, una tarjeta ni datos bancarios.

## Producto

- `Pricing Intelligence`: calcula tarifa implícita, price floor y pricing gap.
- `Cash Runway`: mide cuántos meses cubre la caja disponible.
- `Revenue Risk`: analiza seis meses de ingresos, volatilidad y client concentration.
- `Payment Drag`: estima cash in transit por demora de cobranza.
- `Cash Stress Test`: simula Growth, Base, Slow month y Client loss.
- `Honora Score`: combina salud operativa y estabilidad del revenue.
- `90-Day Action Plan`: prioriza cuatro decisiones basadas en los números ingresados.
- Persistencia local: los datos permanecen en el navegador del usuario.

## Modelo de ingresos

| Oferta | Precio | Función comercial |
|---|---:|---|
| Diagnóstico | S/ 0 | Adquisición y demostración de valor |
| Decision Report | S/ 9.90 único | Primera conversión de bajo riesgo |
| Honora Pro | S/ 19.90/mes | Recurring revenue |
| Partner marketplace | Comisión acordada | Revenue por referidos relevantes |

El plan completo, unit economics y métricas de validación están en [`docs/BUSINESS_PLAN.md`](docs/BUSINESS_PLAN.md).

## Metodología

El motor está aislado en [`lib/honora.ts`](lib/honora.ts) y documentado en [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md). Ningún resultado utiliza una tasa tributaria impuesta por el producto: `reserve rate` y `target margin` son parámetros configurables.

## Ejecutar localmente

```bash
npm ci
npm run dev
```

Validar:

```bash
npm test
npm run lint
```

## Stack

- React 19 + TypeScript
- Next.js/Vinext
- Cloudflare-compatible Worker output
- Node Test Runner
- CSS responsive sin librerías visuales
- Cero APIs externas en el motor financiero

## Privacidad

El MVP no tiene autenticación ni base de datos. Guarda el perfil financiero únicamente en `localStorage`. Los enlaces de early access llevan a una plantilla pública de GitHub que advierte no publicar información financiera ni datos de contacto privados.

## Alcance

Honora es una herramienta educativa de planificación. No constituye asesoría financiera, tributaria, contable ni legal.

---

Producto diseñado y desarrollado por **Gabriel Pérez Chávez**.

Copyright © 2026. All rights reserved.
