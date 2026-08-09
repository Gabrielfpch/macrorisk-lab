# Metodología cuantitativa

## Core diagnostics

Sea:

- `R`: monthly revenue;
- `F`: fixed costs;
- `V`: variable costs;
- `D`: debt payments;
- `r`: configurable reserve rate;
- `m`: target margin;
- `H`: billable hours;
- `C`: available cash.

Entonces:

```text
Operating burn = F + V + D
Reserve = R × r
Free cash flow = R − Reserve − Operating burn
Operating margin = Free cash flow / R
Cash runway = C / Operating burn
Current hourly rate = R / H
Protected gross revenue = Operating burn / (1 − r − m)
Recommended hourly rate = Protected gross revenue / H
```

Cuando `r + m` alcanza o supera 100%, el motor evita dividir entre cero y utiliza el operating burn como base conservadora.

## Revenue risk

La volatilidad utiliza seis observaciones mensuales:

```text
Revenue volatility = standard deviation / average revenue
```

El `Revenue Stability Score` combina:

- 42% estabilidad de ingresos;
- 36% client concentration;
- 22% payment delay.

Las funciones de score están acotadas entre 0 y 100. Los umbrales son supuestos de producto transparentes, no benchmarks regulatorios.

## Honora Score

```text
Honora Score = 62% Core Health + 38% Revenue Stability
```

`Core Health` considera margin, runway y suficiencia de pricing. El score sirve para priorizar conversaciones; no representa probabilidad de default ni calificación crediticia.

## Cash stress test

Para un shock de revenue `s`:

```text
Stressed revenue = R × (1 + s)
Stressed reserve = Stressed revenue × r
Stressed free cash flow = Stressed revenue − Stressed reserve − Operating burn
```

Si el resultado es negativo:

```text
Defensive runway = Available cash / |Stressed free cash flow|
```

El test asume que costos y deuda permanecen constantes durante el shock. No es un forecast.
