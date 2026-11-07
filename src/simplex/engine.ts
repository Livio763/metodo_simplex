import { fmt } from "./format";
import type {
  Constraint,
  Iteration,
  LinearModel,
  Relation,
  SolveResult,
} from "./types";

const EPS = 1e-8;
const MAX_STEPS = 40;

interface NormConstraint {
  coef: number[];
  rel: Relation;
  rhs: number;
}

function normalize(constraint: Constraint): NormConstraint {
  const coef = constraint.coef.slice();
  let rel = constraint.rel;
  let rhs = constraint.rhs;
  if (rhs < -EPS) {
    for (let i = 0; i < coef.length; i += 1) coef[i] *= -1;
    rhs *= -1;
    if (rel === "<=") rel = ">=";
    else if (rel === ">=") rel = "<=";
  }
  return { coef, rel, rhs };
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
    message,
    variables: [],
    objective: null,
  };
}

export function solve(model: LinearModel): SolveResult {
  const count = model.objective.length;
  if (count < 1) return invalid("El modelo no tiene variables.");
  if (model.objective.some((coef) => !Number.isFinite(coef))) {
    return invalid("La función objetivo tiene un coeficiente que no es un número.");
  }
  for (const constraint of model.constraints) {
    if (constraint.coef.length !== count) {
      return invalid("Hay una restricción con otra cantidad de coeficientes que la función objetivo.");
    }
    if (
      constraint.coef.some((coef) => !Number.isFinite(coef)) ||
      !Number.isFinite(constraint.rhs)
    ) {
      return invalid("Hay una restricción con un número vacío o inválido.");
    }
  }

  const constraints = model.constraints.map(normalize);
  const names: string[] = [];
  const original: number[] = [];
  const phaseCost: number[] = [];
  const realCost: number[] = [];
  for (let index = 0; index < count; index += 1) {
    names.push(`x${index + 1}`);
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
  ) => {
    const objectiveRow = reducedCost(rows, basis, realCost);
    const phaseReduced = phase === 1 ? reducedCost(rows, basis, phaseCost) : null;
    const shown = phase === 1 && status !== "phase" ? phaseReduced! : objectiveRow;
    iterations.push({
      phase,
      columns: names.slice(),
      basis: basis.map((index) => names[index]),
      matrix: rows.map((row) => row.slice(0, names.length)),
      rhs: rows.map((row) => row[names.length]),
      zRow: shown.coef.slice(),
      zValue: originalValue(rows, basis, original),
      phaseRow: phaseReduced ? phaseReduced.coef.slice() : null,
      phaseValue: phaseReduced ? -phaseReduced.value : null,
      ratios: ratiosFor(rows, entering),
      entering,
      leaving,
      status,
      explanation,
    });
  };

  if (rows.length === 0) {
    const improving = realCost.findIndex((coef) => coef > EPS);
    if (improving !== -1) {
      push(
        "unbounded",
        `Sin restricciones, ${names[improving]} puede crecer y el objetivo no tiene límite.`,
        improving,
        null,
      );
      return finish(iterations, "unbounded", iterations[0].explanation, []);
    }
    push("optimal", "Sin restricciones y con objetivo que no mejora al crecer, el óptimo está en el origen.", null, null);
    return finish(iterations, "optimal", iterations[0].explanation, variableValues(names, basis, rows), 0);
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
            `La fase 1 termina y todavía queda ${fmt(amount)} en las variables artificiales. El modelo no tiene solución factible.`,
            null,
            null,
          );
          return finish(iterations, "infeasible", iterations.at(-1)!.explanation, []);
        }
        push(
          "phase",
          "Las artificiales quedaron en cero. Termina la fase 1 y la fila objetivo pasa a ser la del modelo.",
          null,
          null,
        );
        phase = 2;
        cost = realCost;
        continue;
      }
      const value = originalValue(rows, basis, original);
      push(
        "optimal",
        `No queda un coeficiente negativo en la fila objetivo. El óptimo es Z = ${fmt(value)}. Las variables que no están en la base valen cero.`,
        null,
        null,
      );
      return finish(
        iterations,
        "optimal",
        iterations.at(-1)!.explanation,
        variableValues(names, basis, rows),
        value,
      );
    }

    const leaving = pickLeaving(rows, basis, entering);
    if (leaving === null) {
      push(
        "unbounded",
        `La columna ${names[entering]} mejora el objetivo y ninguna fila la frena con un cociente positivo. El problema no está acotado.`,
        entering,
        null,
      );
      return finish(iterations, "unbounded", iterations.at(-1)!.explanation, []);
    }

    const pivotValue = rows[leaving][entering];
    const ratio = rows[leaving][names.length] / pivotValue;
    const senseWord = model.sense === "max" ? "maximizar" : "minimizar";
    push(
      "pivot",
      `Para ${senseWord}, entra ${names[entering]}: su coeficiente ${fmt(rowCosts.coef[entering])} es el más negativo de la fila objetivo. Sale ${names[basis[leaving]]} porque ${fmt(rows[leaving][names.length])} / ${fmt(pivotValue)} = ${fmt(ratio)} es el menor cociente positivo. Ese encuentro es el pivote.`,
      entering,
      leaving,
    );
    pivot(rows, basis, leaving, entering);
  }

  push(
    "limit",
    "El procedimiento se detuvo después de muchas iteraciones para no entrar en un ciclo.",
    null,
    null,
  );
  return finish(iterations, "limit", iterations.at(-1)!.explanation, []);
}

function finish(
  iterations: Iteration[],
  status: SolveResult["status"],
  message: string,
  variables: { name: string; value: number }[],
  objective: number | null = null,
): SolveResult {
  const structural = variables.filter((variable) => !variable.name.startsWith("A"));
  return {
    iterations,
    status,
    message,
    variables: status === "optimal" ? structural : [],
    objective,
  };
}
