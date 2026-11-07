import { parseLoose } from "./format";
import type { LinearModel, Relation, Sense } from "./types";

export interface DraftRow {
  coef: string[];
  rel: Relation;
  rhs: string;
}

export interface Draft {
  sense: Sense;
  objective: string[];
  rows: DraftRow[];
}

export function draftFromModel(model: LinearModel): Draft {
  return {
    sense: model.sense,
    objective: model.objective.map((coef) => String(coef)),
    rows: model.constraints.map((constraint) => ({
      coef: constraint.coef.map((coef) => String(coef)),
      rel: constraint.rel,
      rhs: String(constraint.rhs),
    })),
  };
}

export function modelFromDraft(draft: Draft): { model: LinearModel } | { error: string } {
  const objective = draft.objective.map(parseLoose);
  if (objective.some((coef) => coef === null)) {
    return { error: "Hay un coeficiente vacío en la función objetivo." };
  }
  if (draft.rows.length === 0) {
    return { error: "Agrega al menos una restricción." };
  }
  const constraints = [];
  for (const row of draft.rows) {
    const coef = row.coef.map(parseLoose);
    const rhs = parseLoose(row.rhs);
    if (coef.some((value) => value === null) || rhs === null) {
      return { error: "Hay un número vacío en las restricciones." };
    }
    constraints.push({ coef: coef as number[], rel: row.rel, rhs });
  }
  return {
    model: {
      sense: draft.sense,
      objective: objective as number[],
      constraints,
    },
  };
}

export function sameModel(left: LinearModel, right: LinearModel): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
