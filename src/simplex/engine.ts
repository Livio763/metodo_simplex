import { formatNumber } from "./fraction";
import type {
  Constraint,
  Iteration,
  LinearModel,
  Relation,
  RowOperation,
  ShadowPrice,
  SolutionType,
  SolveResult,
} from "./types";

const EPS = 1e-8;
const MAX_STEPS = 40;

interface NormConstraint {
  name?: string;
  originalIndex: number;
  coef: number[];
  rel: Relation;
  rhs: number;
}

function normalize(constraint: Constraint, index: number): NormConstraint {
  const coef = constraint.coef.slice();
  let rel = constraint.rel;
  let rhs = constraint.rhs;
  if (rhs < -EPS) {
    for (let i = 0; i < coef.length; i += 1) coef[i] *= -1;
    rhs *= -1;
    if (rel === "<=") rel = ">=";
    else if (rel === ">=") rel = "<=";
  }
  return {
    name: constraint.name || `Restricción ${index + 1}`,
    originalIndex: index,
    coef,
    rel,
    rhs,
  };
}

function reducedCost(rows: number[][], basis: number[], cost: number[]): {
  coef: number[];
  value: number;
} {
  const width = cost.length;
  const coef = Array.from({ length: width }, () => 0);
  let value = 0;
  for (let column = 0; column < width; column += 1) {
    let dot = 0;
    for (let row = 0; row < rows.length; row += 1) {
      dot += cost[basis[row]] * rows[row][column];
    }
    coef[column] = dot - cost[column];
  }
  for (let row = 0; row < rows.length; row += 1) {
    value += cost[basis[row]] * rows[row][width];
  }
  return { coef, value };
}

function originalValue(
  rows: number[][],
  basis: number[],
  original: number[],
): number {
  let value = 0;
  const rhs = original.length;
  for (let row = 0; row < rows.length; row += 1) {
    value += original[basis[row]] * rows[row][rhs];
  }
  return value;
}

function pickEntering(coef: number[], forbidden: Set<number>): number | null {
  let chosen: number | null = null;
  for (let column = 0; column < coef.length; column += 1) {
    if (forbidden.has(column) || coef[column] >= -EPS) continue;
    if (
      chosen === null ||
      coef[column] < coef[chosen] - EPS ||
      (Math.abs(coef[column] - coef[chosen]) <= EPS && column < chosen)
    ) {
      chosen = column;
    }
  }
  return chosen;
}

function pickLeaving(rows: number[][], basis: number[], column: number): number | null {
  const rhsIndex = rows[0]?.length ? rows[0].length - 1 : 0;
  let chosen: number | null = null;
  let bestRatio = Infinity;
  let bestBasis = Infinity;
  for (let row = 0; row < rows.length; row += 1) {
    const pivot = rows[row][column];
    const rhs = rows[row][rhsIndex];
    if (pivot <= EPS || rhs < -EPS) continue;
    const ratio = rhs / pivot;
    const basisName = basis[row];
    if (
      ratio < bestRatio - EPS ||
      (Math.abs(ratio - bestRatio) <= EPS && basisName < bestBasis)
    ) {
      bestRatio = ratio;
      bestBasis = basisName;
      chosen = row;
    }
  }
  return chosen;
}

/**
 * Calcula las fórmulas de operaciones elementales de fila (Gauss-Jordan) para el pivote.
 */
function computeRowOperations(
  rows: number[][],
  basis: number[],
  names: string[],
  row: number,
  column: number,
  currentZCoef: number,
  rowLabel: string,
): RowOperation[] {
  const ops: RowOperation[] = [];
  const pivotVal = rows[row][column];
  const pivotRowName = `R${row + 1}`;
  const enteringVar = names[column];
  const leavingVar = names[basis[row]];

  // 1. Operación sobre la fila pivote
  const pivotFrac = formatNumber(pivotVal, "fraction");
  let pivotFormula: string;
  if (Math.abs(pivotVal - 1) < EPS) {
    pivotFormula = `${pivotRowName} (sin cambio, ya es 1)`;
  } else {
    pivotFormula = `${pivotRowName} ← ${pivotRowName} / (${pivotFrac})`;
  }

  ops.push({
    targetRow: pivotRowName,
    basisVar: enteringVar,
    formula: pivotFormula,
    description: `Dividir la fila ${row + 1} por el pivote ${pivotFrac} para convertir el elemento pivote en 1 (entra ${enteringVar}, sale ${leavingVar}).`,
  });

  // 2. Operaciones sobre las demás filas
  for (let other = 0; other < rows.length; other += 1) {
    if (other === row) continue;
    const otherRowName = `R${other + 1}`;
    const factor = rows[other][column];
    if (Math.abs(factor) <= EPS) {
      ops.push({
        targetRow: otherRowName,
        basisVar: names[basis[other]],
        formula: `${otherRowName} (sin cambio, coeficiente es 0)`,
        description: `El coeficiente en la columna entrante ya es 0.`,
      });
      continue;
    }

    const factorStr = formatNumber(Math.abs(factor), "fraction");
    const sign = factor > 0 ? "−" : "+";
    ops.push({
      targetRow: otherRowName,
      basisVar: names[basis[other]],
      formula: `${otherRowName} ← ${otherRowName} ${sign} (${factorStr}) · ${pivotRowName}`,
      description: `Eliminar el elemento de la fila ${other + 1} en la columna ${enteringVar} para dejarla en 0.`,
    });
  }

  // 3. Operación sobre la fila objetivo
  if (Math.abs(currentZCoef) > EPS) {
    const factorStr = formatNumber(Math.abs(currentZCoef), "fraction");
    const sign = currentZCoef > 0 ? "−" : "+";
    ops.push({
      targetRow: rowLabel,
      basisVar: rowLabel,
      formula: `${rowLabel} ← ${rowLabel} ${sign} (${factorStr}) · ${pivotRowName}`,
      description: `Actualizar la fila ${rowLabel} para llevar a 0 el costo reducido de la variable entrante ${enteringVar}.`,
    });
  }

  return ops;
}

function pivot(rows: number[][], basis: number[], row: number, column: number): void {
  const pivotValue = rows[row][column];
  for (let index = 0; index < rows[row].length; index += 1) {
    rows[row][index] /= pivotValue;
  }
  for (let other = 0; other < rows.length; other += 1) {
    if (other === row) continue;
    const factor = rows[other][column];
    if (Math.abs(factor) <= EPS) continue;
    for (let index = 0; index < rows[other].length; index += 1) {
      rows[other][index] -= factor * rows[row][index];
    }
  }
  basis[row] = column;
}

function ratiosFor(rows: number[][], column: number | null): (number | null)[] {
  return rows.map((row) => {
    if (column === null) return null;
    const pivotValue = row[column];
    const rhs = row[row.length - 1];
    if (pivotValue <= EPS || rhs < -EPS) return null;
    return rhs / pivotValue;
  });
}

function variableValues(
  names: string[],
  basis: number[],
  rows: number[][],
): { name: string; value: number }[] {
  const rhsIndex = names.length;
  return names.map((name, index) => {
    const row = basis.indexOf(index);
    return { name, value: row === -1 ? 0 : rows[row][rhsIndex] };
  });
}

export function decisionPoint(iteration: Iteration): [number, number] | null {
  if (!iteration.columns.includes("x1") || !iteration.columns.includes("x2")) return null;
  let x1 = 0;
  let x2 = 0;
  iteration.basis.forEach((name, row) => {
    if (name === "x1") x1 = iteration.rhs[row];
    if (name === "x2") x2 = iteration.rhs[row];
  });
  return [x1, x2];
}

function invalid(message: string): SolveResult {
  return {
    iterations: [],
    status: "invalid",
    solutionType: "infeasible",
    message,
    variables: [],
    objective: null,
  };
}

export function solve(model: LinearModel): SolveResult {
  const count = model.objective.length;
  if (count < 1) return invalid("El modelo no tiene variables de decisión.");
  if (model.objective.some((coef) => !Number.isFinite(coef))) {
    return invalid("La función objetivo tiene un coeficiente que no es un número válido.");
  }
  for (const constraint of model.constraints) {
    if (constraint.coef.length !== count) {
      return invalid("Hay una restricción con diferente cantidad de coeficientes que la función objetivo.");
    }
    if (
      constraint.coef.some((coef) => !Number.isFinite(coef)) ||
      !Number.isFinite(constraint.rhs)
    ) {
      return invalid("Hay una restricción con un valor vacío o inválido.");
    }
  }

  const constraints = model.constraints.map(normalize);

  const names: string[] = [];
  const original: number[] = [];
  const phaseCost: number[] = [];
  const realCost: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const varName = model.variableNames && model.variableNames[index] ? model.variableNames[index] : `x${index + 1}`;
    names.push(varName);
    original.push(model.objective[index]);
    phaseCost.push(0);
    realCost.push(model.sense === "max" ? model.objective[index] : -model.objective[index]);
  }

  const slackCol = new Map<number, number>();
  const surplusCol = new Map<number, number>();
  const artificialCol = new Map<number, number>();

  constraints.forEach((constraint, index) => {
    if (constraint.rel === "<=") {
      slackCol.set(index, names.length);
      names.push(`H${index + 1}`);
      original.push(0);
      phaseCost.push(0);
      realCost.push(0);
    }
  });
  constraints.forEach((constraint, index) => {
    if (constraint.rel === ">=") {
      surplusCol.set(index, names.length);
      names.push(`E${index + 1}`);
      original.push(0);
      phaseCost.push(0);
      realCost.push(0);
    }
  });
  constraints.forEach((constraint, index) => {
    if (constraint.rel === ">=" || constraint.rel === "=") {
      artificialCol.set(index, names.length);
      names.push(`A${index + 1}`);
      original.push(0);
      phaseCost.push(-1);
      realCost.push(0);
    }
  });

  const rows: number[][] = [];
  const basis: number[] = [];
  constraints.forEach((constraint, index) => {
    const row = Array.from({ length: names.length + 1 }, () => 0);
    for (let column = 0; column < count; column += 1) row[column] = constraint.coef[column];
    row[names.length] = constraint.rhs;
    if (constraint.rel === "<=") {
      const column = slackCol.get(index)!;
      row[column] = 1;
      basis.push(column);
    } else if (constraint.rel === ">=") {
      row[surplusCol.get(index)!] = -1;
      const artificial = artificialCol.get(index)!;
      row[artificial] = 1;
      basis.push(artificial);
    } else {
      const artificial = artificialCol.get(index)!;
      row[artificial] = 1;
      basis.push(artificial);
    }
    rows.push(row);
  });

  const artificials = new Set(artificialCol.values());
  let phase: 1 | 2 = artificials.size > 0 ? 1 : 2;
  let cost = phase === 1 ? phaseCost : realCost;
  const iterations: Iteration[] = [];

  const push = (
    status: Iteration["status"],
    explanation: string,
    entering: number | null,
    leaving: number | null,
    rowOperations?: RowOperation[],
  ) => {
    const objectiveRow = reducedCost(rows, basis, realCost);
    const phaseReduced = phase === 1 ? reducedCost(rows, basis, phaseCost) : null;
    const shown = phase === 1 && status !== "phase" ? phaseReduced! : objectiveRow;

    const pivotInfo =
      entering !== null && leaving !== null
        ? {
            row: leaving,
            column: entering,
            value: rows[leaving][entering],
            enteringVar: names[entering],
            leavingVar: names[basis[leaving]],
          }
        : null;

    iterations.push({
      stepIndex: iterations.length,
      phase,
      columns: names.slice(),
      basis: basis.map((idx) => names[idx]),
      matrix: rows.map((r) => r.slice(0, names.length)),
      rhs: rows.map((r) => r[names.length]),
      zRow: shown.coef.slice(),
      zValue: originalValue(rows, basis, original),
      phaseRow: phaseReduced ? phaseReduced.coef.slice() : null,
      phaseValue: phaseReduced ? -phaseReduced.value : null,
      ratios: ratiosFor(rows, entering),
      entering,
      leaving,
      status,
      explanation,
      pivotInfo,
      rowOperations,
    });
  };

  if (rows.length === 0) {
    const improving = realCost.findIndex((coef) => coef > EPS);
    if (improving !== -1) {
      push(
        "unbounded",
        `Sin restricciones, ${names[improving]} puede crecer indefinidamente y el objetivo no tiene límite.`,
        improving,
        null,
      );
      return finish(iterations, "unbounded", iterations[0].explanation, [], null, "unbounded");
    }
    push("optimal", "Sin restricciones y con función objetivo acotada, el óptimo está en el origen.", null, null);
    return finish(iterations, "optimal", iterations[0].explanation, variableValues(names, basis, rows), 0, "unique");
  }

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const rowCosts = reducedCost(rows, basis, cost);
    const entering = pickEntering(rowCosts.coef, artificials);

    if (entering === null) {
      if (phase === 1) {
        if (rowCosts.value < -EPS) {
          const amount = -rowCosts.value;
          push(
            "infeasible",
            `La Fase 1 concluye con una suma de variables artificiales de ${formatNumber(amount, "fraction")}. El modelo no tiene solución factible.`,
            null,
            null,
          );
          return finish(iterations, "infeasible", iterations.at(-1)!.explanation, [], null, "infeasible");
        }
        push(
          "phase",
          "Todas las variables artificiales se redujeron a cero. La Fase 1 concluyó con éxito; pasamos a la Fase 2 con los costos reales.",
          null,
          null,
        );
        phase = 2;
        cost = realCost;
        continue;
      }

      // Comprobación de óptimo y de soluciones múltiples / alternativas
      const value = originalValue(rows, basis, original);
      const nonBasicZeroCosts = names
        .slice(0, count)
        .filter((_, idx) => !basis.includes(idx) && Math.abs(rowCosts.coef[idx]) < EPS);

      const hasMultiple = nonBasicZeroCosts.length > 0;
      const solutionType: SolutionType = hasMultiple ? "multiple" : "unique";

      const optimalText = hasMultiple
        ? `¡Solución óptima múltiple alcanzada! Z = ${formatNumber(value, "fraction")}. La variable no básica ${nonBasicZeroCosts.join(", ")} tiene costo reducido cero, lo que indica que existen infinitas soluciones a lo largo del segmento óptimo.`
        : `¡Solución óptima encontrada! Z = ${formatNumber(value, "fraction")}. Todos los costos reducidos son mayores o iguales a cero; ningún vértice vecino puede mejorar la función objetivo.`;

      push("optimal", optimalText, null, null);

      // Calcular precios sombra (análisis de sensibilidad)
      const shadowPrices: ShadowPrice[] = [];
      const finalZCosts = reducedCost(rows, basis, realCost).coef;

      constraints.forEach((constraint, idx) => {
        let slackOrSurplus = 0;
        let shadowPrice = 0;

        if (constraint.rel === "<=") {
          const col = slackCol.get(idx)!;
          const basicRow = basis.indexOf(col);
          slackOrSurplus = basicRow !== -1 ? rows[basicRow][names.length] : 0;
          // El precio dual para <= es el costo reducido de la holgura
          shadowPrice = finalZCosts[col];
        } else if (constraint.rel === ">=") {
          const col = surplusCol.get(idx)!;
          const basicRow = basis.indexOf(col);
          slackOrSurplus = basicRow !== -1 ? rows[basicRow][names.length] : 0;
          shadowPrice = -finalZCosts[col];
        } else {
          // Para igualdad '='
          const col = artificialCol.get(idx);
          if (col !== undefined) {
            shadowPrice = finalZCosts[col];
          }
        }

        const isBinding = Math.abs(slackOrSurplus) < 1e-5;
        const spFormatted = formatNumber(shadowPrice, "fraction");
        const interpretation = isBinding
          ? `Recurso crítico/activo (agotado al 100%). Cada unidad adicional aumentaría el objetivo Z en ${spFormatted}.`
          : `Recurso con holgura/sobrante (${formatNumber(slackOrSurplus, "fraction")} unidades sin utilizar). Su precio sombra es 0 ya que no limita la producción actual.`;

        shadowPrices.push({
          constraintIndex: idx,
          name: constraint.name || `Restricción ${idx + 1}`,
          rel: constraint.rel,
          rhs: constraint.rhs,
          slackOrSurplus,
          shadowPrice,
          isBinding,
          interpretation,
        });
      });

      return finish(
        iterations,
        "optimal",
        iterations.at(-1)!.explanation,
        variableValues(names, basis, rows),
        value,
        solutionType,
        shadowPrices,
      );
    }

    const leaving = pickLeaving(rows, basis, entering);
    if (leaving === null) {
      push(
        "unbounded",
        `La variable ${names[entering]} puede ingresar a la base e incrementarse sin límite porque ningún coeficiente en su columna es positivo. El problema no está acotado.`,
        entering,
        null,
      );
      return finish(iterations, "unbounded", iterations.at(-1)!.explanation, [], null, "unbounded");
    }

    const pivotValue = rows[leaving][entering];
    const ratio = rows[leaving][names.length] / pivotValue;
    const senseWord = model.sense === "max" ? "maximizar" : "minimizar";
    const rowLabel = phase === 1 ? "W" : "Z";

    // Calcular las operaciones elementales de fila antes de modificar la matriz
    const rowOps = computeRowOperations(
      rows,
      basis,
      names,
      leaving,
      entering,
      rowCosts.coef[entering],
      rowLabel,
    );

    push(
      "pivot",
      `Criterio del Simplex (${senseWord}): entra ${names[entering]} por tener el costo reducido más negativo (${formatNumber(rowCosts.coef[entering], "fraction")}). Sale ${names[basis[leaving]]} por tener el menor cociente positivo (${formatNumber(rows[leaving][names.length], "fraction")} / ${formatNumber(pivotValue, "fraction")} = ${formatNumber(ratio, "fraction")}). El cruce es el pivote = ${formatNumber(pivotValue, "fraction")}.`,
      entering,
      leaving,
      rowOps,
    );

    pivot(rows, basis, leaving, entering);
  }

  push(
    "limit",
    "Se alcanzó el número máximo de iteraciones sin converger. Podría existir degeneración o ciclo.",
    null,
    null,
  );
  return finish(iterations, "limit", iterations.at(-1)!.explanation, [], null, "limit");
}

function finish(
  iterations: Iteration[],
  status: SolveResult["status"],
  message: string,
  variables: { name: string; value: number }[],
  objective: number | null = null,
  solutionType: SolutionType = "unique",
  shadowPrices?: ShadowPrice[],
): SolveResult {
  const structural = variables.filter((variable) => !variable.name.startsWith("A"));
  return {
    iterations,
    status,
    solutionType,
    message,
    variables: status === "optimal" ? structural : [],
    objective,
    shadowPrices,
  };
}
