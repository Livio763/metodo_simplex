export type Relation = "<=" | ">=" | "=";
export type Sense = "max" | "min";

export interface Constraint {
  coef: number[];
  rel: Relation;
  rhs: number;
}

export interface LinearModel {
  sense: Sense;
  objective: number[];
  constraints: Constraint[];
}

export type IterationStatus =
  | "pivot"
  | "optimal"
  | "unbounded"
  | "infeasible"
  | "phase"
  | "limit";

export interface Iteration {
  phase: 1 | 2;
  columns: string[];
  basis: string[];
  matrix: number[][];
  rhs: number[];
  zRow: number[];
  zValue: number;
  phaseRow: number[] | null;
  phaseValue: number | null;
  ratios: (number | null)[];
  entering: number | null;
  leaving: number | null;
  status: IterationStatus;
  explanation: string;
}

export interface SolveResult {
  iterations: Iteration[];
  status: "optimal" | "unbounded" | "infeasible" | "invalid" | "limit";
  message: string;
  variables: { name: string; value: number }[];
  objective: number | null;
}
