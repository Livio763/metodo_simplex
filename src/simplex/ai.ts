import { formatNumber, type NumberDisplayMode } from "./fraction";
import type { Iteration, LinearModel, Relation, SolveResult } from "./types";

export interface ParsedNLPResult {
  success: boolean;
  model?: LinearModel;
  summary?: string;
  error?: string;
}

/**
 * Extrae coeficientes asociados a variables x1, x2, etc. de una cadena.
 * Maneja formatos como "50x1 + 80x2", "100 x1 - 25 x2", "x1 + 2x2", etc.
 */
function extractCoefficients(text: string, count: number): number[] {
  const result: number[] = Array.from({ length: count }, () => 0);

  // Buscar patrones como "(signo/número) x(índice)"
  // Ej: "-50x1", "80 x2", "+ x1", "-x2"
  const regex = /([+-]?\s*\d*(?:[.,]\d+)?)\s*x(\d+)/gi;
  let match: RegExpExecArray | null;
  let matchedAny = false;

  while ((match = regex.exec(text)) !== null) {
    matchedAny = true;
    const rawCoef = match[1].replace(/\s+/g, "");
    const varIndex = parseInt(match[2], 10) - 1;

    let val = 1;
    if (rawCoef === "" || rawCoef === "+") {
      val = 1;
    } else if (rawCoef === "-") {
      val = -1;
    } else {
      val = parseFloat(rawCoef.replace(",", "."));
    }

    if (varIndex >= 0 && varIndex < count && Number.isFinite(val)) {
      result[varIndex] = val;
    }
  }

  if (matchedAny) {
    return result;
  }

  // Si no tenía formato con 'x', remover 'x1', 'x2', etc. y extraer números
  const sanitized = text.replace(/x\d+/gi, " ");
  const nums = sanitized.match(/-?\d+(?:[.,]\d+)?/g);
  if (nums) {
    for (let i = 0; i < Math.min(nums.length, count); i += 1) {
      result[i] = parseFloat(nums[i].replace(",", "."));
    }
  }

  return result;
}

/**
 * Parser en español para transformar enunciados de optimización lineal a modelo matemático.
 * Funciona 100% offline sin necesidad de APIs externas.
 */
export function parseProblemFromNaturalText(text: string): ParsedNLPResult {
  if (!text || text.trim().length === 0) {
    return { success: false, error: "El texto está vacío." };
  }

  const clean = text.toLowerCase();
  const sense =
    clean.includes("minimizar") ||
    clean.includes("mínimo") ||
    clean.includes("minimo") ||
    clean.includes("costo") ||
    clean.includes("gasto") ||
    clean.includes("reducir")
      ? "min"
      : "max";

  // Detección de variables principales
  let varNames = ["x1", "x2"];
  if (clean.includes("silla") && clean.includes("mesa")) {
    varNames = ["Sillas (x1)", "Mesas (x2)"];
  } else if (clean.includes("bono") && clean.includes("accion")) {
    varNames = ["Bonos (x1)", "Acciones (x2)"];
  } else if (clean.includes("alimento a") && clean.includes("alimento b")) {
    varNames = ["Alimento A (x1)", "Alimento B (x2)"];
  }

  // Buscar coeficientes objetivo
  let objCoefs: number[] = [1, 1];

  // Análisis por líneas para función objetivo y restricciones
  const lines = text
    .split(/\n|;|\.\s+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const constraints: { name: string; coef: number[]; rel: Relation; rhs: number }[] = [];

  for (const line of lines) {
    const lLower = line.toLowerCase();

    // Detectar si es la línea de función objetivo
    if (
      lLower.includes("objetivo") ||
      lLower.includes("max") ||
      lLower.includes("min") ||
      lLower.startsWith("z =") ||
      lLower.startsWith("z=")
    ) {
      objCoefs = extractCoefficients(line, 2);
      continue;
    }

    // Detectar sentido de relación de forma estricta:
    // Primero <= y >= para evitar que el chequeo de '=' capture '<=' o '>='
    let rel: Relation = "<=";
    if (
      lLower.includes("<=") ||
      lLower.includes("≤") ||
      lLower.includes("a lo sumo") ||
      lLower.includes("máximo") ||
      lLower.includes("no más de") ||
      lLower.includes("tope")
    ) {
      rel = "<=";
    } else if (
      lLower.includes(">=") ||
      lLower.includes("≥") ||
      lLower.includes("al menos") ||
      lLower.includes("mínimo") ||
      lLower.includes("minimo de") ||
      lLower.includes("no menor a")
    ) {
      rel = ">=";
    } else if (
      lLower.includes("=") ||
      lLower.includes("exactamente") ||
      lLower.includes("igual a")
    ) {
      rel = "=";
    } else {
      rel = "<=";
    }

    // Separar lado izquierdo y lado derecho de la restricción
    let leftSide = line;
    let rightSide = "";

    const splitTokens = ["<=", ">=", "≤", "≥", "="];
    for (const token of splitTokens) {
      if (line.includes(token)) {
        const parts = line.split(token);
        leftSide = parts[0];
        rightSide = parts.slice(1).join(" ");
        break;
      }
    }

    // Extraer RHS del lado derecho
    const rhsNums = rightSide.match(/-?\d+(?:[.,]\d+)?/g);
    let rhs = 0;
    if (rhsNums && rhsNums.length > 0) {
      rhs = parseFloat(rhsNums[0].replace(",", "."));
    } else {
      // Fallback: tomar el último número de la línea completa
      const allNums = line.replace(/x\d+/gi, " ").match(/-?\d+(?:[.,]\d+)?/g);
      if (allNums && allNums.length > 0) {
        rhs = parseFloat(allNums[allNums.length - 1].replace(",", "."));
      }
    }

    const coefs = extractCoefficients(leftSide, 2);

    // Nombre limpio para la restricción
    const cleanName = line
      .replace(/-?\d+(?:[.,]\d+)?/g, "")
      .replace(/<=|>=|=|≤|≥|<|>|x1|x2/gi, "")
      .trim();

    constraints.push({
      name: cleanName.length > 3 ? cleanName.slice(0, 28) : `Restricción ${constraints.length + 1}`,
      coef: coefs,
      rel,
      rhs,
    });
  }

  if (constraints.length === 0) {
    return {
      success: false,
      error:
        "No se pudieron identificar las restricciones claramente. Intenta escribir una por línea (ej: '2x1 + 4x2 <= 80').",
    };
  }

  const model: LinearModel = {
    sense,
    variableNames: varNames,
    objective: objCoefs,
    constraints,
  };

  return {
    success: true,
    model,
    summary: `Modelo interpretado con éxito: ${sense === "max" ? "Maximizar" : "Minimizar"} Z con ${constraints.length} restricciones y 2 variables (${varNames.join(", ")}).`,
  };
}

/**
 * Genera una explicación didáctica enriquecida para el paso actual.
 */
export function generateStepExplanation(
  iteration: Iteration,
  model: LinearModel,
  displayMode: NumberDisplayMode = "fraction",
): string {
  const senseText = model.sense === "max" ? "maximización" : "minimización";

  if (iteration.status === "optimal") {
    return `**Criterio de Parada Alcanzado (Óptimo)**: En la fila objetivo ${iteration.phase === 1 ? "W" : "Z"}, todos los costos reducidos son mayores o iguales a cero (>= 0). Ningún vértice adyacente mejora el valor del objetivo. La solución actual es óptima con Z = **${formatNumber(iteration.zValue, displayMode)}**.`;
  }

  if (iteration.status === "unbounded") {
    return `**Problema No Acotado**: La variable entrante puede incrementarse sin límite debido a que no existe ninguna tasa restrictiva positiva en su columna (todos los coeficientes son menores o iguales a cero).`;
  }

  if (iteration.status === "infeasible") {
    return `**Problema Infactible**: Al finalizar la Fase 1, la función de variables artificiales W no pudo anularse (W > 0). El conjunto de restricciones es inconsistente.`;
  }

  if (iteration.status === "phase") {
    return `**Transición a Fase 2**: Todas las variables artificiales han salido de la base (W = 0). Se eliminan las columnas artificiales y se restablece la función objetivo original para optimizar Z.`;
  }

  if (iteration.pivotInfo) {
    const { enteringVar, leavingVar, value } = iteration.pivotInfo;
    const pivotValStr = formatNumber(value, displayMode);

    return `**Iteración ${iteration.stepIndex + 1}**:
1. **Variable Entrante**: **${enteringVar}**. Posee el coeficiente más negativo en la fila objetivo (mayor aporte marginal en ${senseText}).
2. **Variable Saliente**: **${leavingVar}**. Determina el recurso limitante según la prueba de la razón mínima (menor cociente positivo).
3. **Elemento Pivote**: **${pivotValStr}** (intersección entre fila ${leavingVar} y columna ${enteringVar}). Se aplica eliminación de Gauss-Jordan para normalizar el pivote a 1 y anular los demás elementos de la columna.`;
  }

  return iteration.explanation;
}

/**
 * Genera un informe ejecutivo del análisis de resultados y sensibilidad.
 */
export function generateExecutiveReport(
  result: SolveResult,
  model: LinearModel,
  displayMode: NumberDisplayMode = "fraction",
): {
  executiveSummary: string;
  solutionBreakdown: { variable: string; value: string; role: string }[];
  resourceAnalysis: {
    resource: string;
    status: "Agotado (Crítico)" | "Con Sobrante";
    slack: string;
    shadowPrice: string;
    advice: string;
  }[];
} {
  const zOpt = formatNumber(result.objective ?? 0, displayMode);
  const isMax = model.sense === "max";

  const executiveSummary =
    result.status === "optimal"
      ? `El plan óptimo de ${isMax ? "maximización de utilidades" : "minimización de costos"} alcanza un valor objetivo de Z = **${zOpt}**. ${
          result.solutionType === "multiple"
            ? "Nota: Existen soluciones alternativas con el mismo valor óptimo."
            : "Esta solución es única y garantiza la mejor utilización de los recursos disponibles."
        }`
      : `El algoritmo concluyó con estado: **${result.status}** (${result.message}).`;

  const solutionBreakdown = result.variables.map((v) => {
    const isSlack = v.name.startsWith("H");
    const isSurplus = v.name.startsWith("E");

    let role = "Variable de Decisión";
    if (isSlack) role = "Holgura (Recurso no utilizado)";
    if (isSurplus) role = "Exceso sobre requerimiento mínimo";

    return {
      variable: v.name,
      value: formatNumber(v.value, displayMode),
      role,
    };
  });

  const resourceAnalysis = (result.shadowPrices ?? []).map((sp) => {
    const isBinding = sp.isBinding;
    const spVal = formatNumber(sp.shadowPrice, displayMode);
    const slackVal = formatNumber(sp.slackOrSurplus, displayMode);

    return {
      resource: sp.name,
      status: isBinding ? ("Agotado (Crítico)" as const) : ("Con Sobrante" as const),
      slack: isBinding ? "0 (100% utilizado)" : `${slackVal} unidades libres`,
      shadowPrice: isBinding ? `+${spVal} por unidad extra` : "$0 (No limita)",
      advice: isBinding
        ? `Invertir en expandir este recurso aumentará directamente la ganancia Z a razón de ${spVal} por cada unidad nueva.`
        : `No se recomienda adquirir más de este recurso en el corto plazo; ya existen ${slackVal} unidades ociosas.`,
    };
  });

  return {
    executiveSummary,
    solutionBreakdown,
    resourceAnalysis,
  };
}
