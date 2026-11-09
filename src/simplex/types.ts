export type Relation = "<=" | ">=" | "=";
export type Sense = "max" | "min";

export interface Constraint {
  name?: string;
  coef: number[];
  rel: Relation;
  rhs: number;
}

export interface LinearModel {
  sense: Sense;
  variableNames?: string[];
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

export interface RowOperation {
  targetRow: string;       // Ej: "R1", "R2", "Z"
  basisVar: string;        // Nombre de la variable en la base para esa fila
  formula: string;         // Ej: "R1 ← R1 / 4" o "R2 ← R2 - (1.5) · R1"
  description: string;     // Explicación textual sencilla
}

export interface PivotInfo {
  row: number;
  column: number;
  value: number;
  enteringVar: string;
  leavingVar: string;
}

export interface Iteration {
  stepIndex: number;
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
  pivotInfo?: PivotInfo | null;
  rowOperations?: RowOperation[];
}

export interface ShadowPrice {
  constraintIndex: number;
  name: string;
  rel: Relation;
  rhs: number;
  slackOrSurplus: number;
  shadowPrice: number;
  isBinding: boolean;       // Si el recurso se agotó (slack = 0)
  interpretation: string;  // Interpretación económica
}

export type SolutionType =
  | "unique"
  | "multiple"
  | "unbounded"
  | "infeasible"
  | "limit";

export interface SolveResult {
  iterations: Iteration[];
  status: "optimal" | "unbounded" | "infeasible" | "invalid" | "limit";
  solutionType: SolutionType;
  message: string;
  variables: { name: string; value: number }[];
  objective: number | null;
  shadowPrices?: ShadowPrice[];
}
