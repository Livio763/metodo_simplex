import { parseLoose } from "./format";
import type { Constraint, LinearModel, Relation, Sense } from "./types";

export interface DraftRow {
  name: string;
  coef: string[];
  rel: Relation;
  rhs: string;
}

export interface Draft {
  sense: Sense;
  variableNames: string[];
  objective: string[];
  rows: DraftRow[];
}

export function draftFromModel(model: LinearModel): Draft {
  const varCount = model.objective.length;
  const variableNames =
    model.variableNames && model.variableNames.length === varCount
      ? model.variableNames.slice()
      : Array.from({ length: varCount }, (_, i) => `x${i + 1}`);

  return {
    sense: model.sense,
    variableNames,
    objective: model.objective.map((coef) => String(coef)),
    rows: model.constraints.map((constraint, i) => ({
      name: constraint.name || `Restricción ${i + 1}`,
      coef: constraint.coef.map((coef) => String(coef)),
      rel: constraint.rel,
      rhs: String(constraint.rhs),
    })),
  };
}

export function modelFromDraft(draft: Draft): { model: LinearModel } | { error: string } {
  const objective = draft.objective.map(parseLoose);
  if (objective.some((coef) => coef === null)) {
    return { error: "Hay un coeficiente vacío o no numérico en la función objetivo." };
  }
  if (draft.rows.length === 0) {
    return { error: "Agrega al menos una restricción para resolver." };
  }
  const constraints: Constraint[] = [];
  for (let idx = 0; idx < draft.rows.length; idx += 1) {
    const row = draft.rows[idx];
    const coef = row.coef.map(parseLoose);
    const rhs = parseLoose(row.rhs);
    if (coef.some((value) => value === null) || rhs === null) {
      return { error: `Hay un número vacío en la restricción ${idx + 1} (${row.name}).` };
    }
    constraints.push({
      name: row.name || `Restricción ${idx + 1}`,
      coef: coef as number[],
      rel: row.rel,
      rhs,
    });
  }
  return {
    model: {
      sense: draft.sense,
      variableNames: draft.variableNames.slice(),
      objective: objective as number[],
      constraints,
    },
  };
}

export function sameModel(left: LinearModel, right: LinearModel): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
