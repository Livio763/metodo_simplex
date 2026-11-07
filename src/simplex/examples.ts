import type { LinearModel } from "./types";

/** Fully specified model from the course report and the slides. */
export const informeModel: LinearModel = {
  sense: "max",
  objective: [100, 125],
  constraints: [
    { coef: [6, 4], rel: "<=", rhs: 24 },
    { coef: [1, 1], rel: "<=", rhs: 800 },
  ],
};

/**
 * Small minimization that needs a surplus and an artificial variable.
 * It is a classroom demonstration, not the furniture story in the report.
 */
export const phaseDemoModel: LinearModel = {
  sense: "min",
  objective: [2, 3],
  constraints: [
    { coef: [1, 1], rel: ">=", rhs: 4 },
    { coef: [1, 3], rel: ">=", rhs: 6 },
  ],
};
