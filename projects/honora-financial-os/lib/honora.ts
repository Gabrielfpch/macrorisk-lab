export type FinancialInputs = {
  monthlyIncome: number;
  fixedCosts: number;
  variableCosts: number;
  debtPayments: number;
  cashReserve: number;
  billableHours: number;
  reserveRate: number;
  targetMargin: number;
};

export type RiskInputs = {
  revenueHistory: number[];
  topClientShare: number;
  averagePaymentDelay: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function calculateDiagnostics(inputs: FinancialInputs) {
  const burn = inputs.fixedCosts + inputs.variableCosts + inputs.debtPayments;
  const reserve = inputs.monthlyIncome * (inputs.reserveRate / 100);
  const freeCashFlow = inputs.monthlyIncome - reserve - burn;
  const margin = inputs.monthlyIncome > 0 ? freeCashFlow / inputs.monthlyIncome : 0;
  const runway = burn > 0 ? inputs.cashReserve / burn : 12;
  const currentRate = inputs.billableHours > 0 ? inputs.monthlyIncome / inputs.billableHours : 0;
  const protectedShare = 1 - (inputs.reserveRate + inputs.targetMargin) / 100;
  const requiredGross = protectedShare > 0 ? burn / protectedShare : burn;
  const recommendedRate = inputs.billableHours > 0 ? requiredGross / inputs.billableHours : 0;
  const marginScore = clamp(((margin + 0.05) / 0.4) * 100, 0, 100);
  const runwayScore = clamp((runway / 6) * 100, 0, 100);
  const pricingScore = recommendedRate > 0 ? clamp((currentRate / recommendedRate) * 85, 0, 100) : 0;
  const coreScore = Math.round(marginScore * 0.42 + runwayScore * 0.33 + pricingScore * 0.25);

  return {
    burn,
    reserve,
    freeCashFlow,
    margin,
    runway,
    currentRate,
    recommendedRate,
    coreScore,
  };
}

export function calculateRevenueRisk(inputs: RiskInputs, monthlyIncome: number) {
  const cleanHistory = inputs.revenueHistory.map((value) => Math.max(0, value));
  const average = cleanHistory.reduce((sum, value) => sum + value, 0) / Math.max(cleanHistory.length, 1);
  const variance = cleanHistory.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(cleanHistory.length, 1);
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = average > 0 ? standardDeviation / average : 0;
  const volatilityScore = 100 - clamp((coefficientOfVariation / 0.45) * 100, 0, 100);
  const concentrationScore = 100 - clamp(((inputs.topClientShare - 15) / 55) * 100, 0, 100);
  const collectionScore = 100 - clamp((inputs.averagePaymentDelay / 60) * 100, 0, 100);
  const stabilityScore = Math.round(volatilityScore * 0.42 + concentrationScore * 0.36 + collectionScore * 0.22);
  const cashInTransit = Math.max(0, monthlyIncome) * (inputs.averagePaymentDelay / 30);

  return {
    average,
    standardDeviation,
    coefficientOfVariation,
    stabilityScore,
    cashInTransit,
    concentrationLevel: inputs.topClientShare >= 50 ? "Crítica" : inputs.topClientShare >= 35 ? "Alta" : "Controlada",
    collectionLevel: inputs.averagePaymentDelay >= 45 ? "Lenta" : inputs.averagePaymentDelay >= 20 ? "Mejorable" : "Ágil",
  };
}

export function calculateHonoraScore(coreScore: number, stabilityScore: number) {
  return Math.round(clamp(coreScore * 0.62 + stabilityScore * 0.38, 0, 100));
}

export function calculateScenario(inputs: FinancialInputs, revenueShock: number) {
  const stressedIncome = Math.max(0, inputs.monthlyIncome * (1 + revenueShock));
  const reserve = stressedIncome * (inputs.reserveRate / 100);
  const burn = inputs.fixedCosts + inputs.variableCosts + inputs.debtPayments;
  const stressedFreeCashFlow = stressedIncome - reserve - burn;
  const monthlyGap = Math.max(0, -stressedFreeCashFlow);
  const survivalMonths = monthlyGap > 0 ? inputs.cashReserve / monthlyGap : Infinity;
  return { stressedIncome, stressedFreeCashFlow, monthlyGap, survivalMonths };
}

export function generateActionPlan(
  inputs: FinancialInputs,
  diagnostics: ReturnType<typeof calculateDiagnostics>,
  riskInputs: RiskInputs,
  revenueRisk: ReturnType<typeof calculateRevenueRisk>,
) {
  const actions: { horizon: string; title: string; detail: string; impact: string }[] = [];

  if (diagnostics.currentRate < diagnostics.recommendedRate) {
    const gap = Math.ceil(diagnostics.recommendedRate - diagnostics.currentRate);
    actions.push({ horizon: "DÍA 01–15", title: "Corrige tu price floor", detail: `Sube al menos S/ ${gap} por hora o reduce el alcance de tus propuestas nuevas.`, impact: "Protege margen" });
  } else {
    actions.push({ horizon: "DÍA 01–15", title: "Defiende tu tarifa", detail: "Tu pricing cubre la estructura actual. Documenta el valor entregado antes de ofrecer descuentos.", impact: "Evita erosión" });
  }

  if (diagnostics.runway < 3) {
    actions.push({ horizon: "DÍA 16–30", title: "Construye caja defensiva", detail: `Prioriza llegar a 3 meses de operating burn: faltan aproximadamente S/ ${Math.max(0, diagnostics.burn * 3 - inputs.cashReserve).toFixed(0)}.`, impact: "Reduce fragilidad" });
  } else {
    actions.push({ horizon: "DÍA 16–30", title: "Separa reservas", detail: "Divide caja operativa, reserva configurable y excedente para que cada sol tenga una función.", impact: "Visibilidad" });
  }

  if (riskInputs.topClientShare >= 35) {
    actions.push({ horizon: "DÍA 31–60", title: "Reduce client concentration", detail: `Tu principal cliente representa ${riskInputs.topClientShare}%. Busca que ningún cliente supere 35% de revenue.`, impact: "Menor dependencia" });
  } else if (revenueRisk.coefficientOfVariation > 0.22) {
    actions.push({ horizon: "DÍA 31–60", title: "Crea recurring revenue", detail: "Convierte una entrega puntual en retainer mensual para suavizar la volatilidad de ingresos.", impact: "Mayor estabilidad" });
  } else {
    actions.push({ horizon: "DÍA 31–60", title: "Asegura recurrencia", detail: "Renueva por adelantado a los clientes más rentables y protege tu calendario del próximo mes.", impact: "Revenue visible" });
  }

  actions.push({
    horizon: "DÍA 61–90",
    title: riskInputs.averagePaymentDelay > 20 ? "Acorta payment terms" : "Escala sin perder margen",
    detail: riskInputs.averagePaymentDelay > 20
      ? "Solicita adelanto, hitos de cobro y penalidades claras para reducir días de caja inmovilizada."
      : "Reserva capacidad para los servicios con mayor contribution margin y estandariza el resto.",
    impact: riskInputs.averagePaymentDelay > 20 ? "Libera cash" : "Más rentabilidad",
  });

  return actions.slice(0, 4);
}
