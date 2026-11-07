import { describe, expect, it } from "vitest";
import { informeModel, phaseDemoModel } from "./examples";
import { decisionPoint, solve } from "./engine";
import { drawFeasible } from "./geometry";
import type { LinearModel } from "./types";

function close(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThan(1e-6);
}

function valueOf(result: ReturnType<typeof solve>, name: string) {
  const found = result.variables.find((variable) => variable.name === name);
  expect(found, name).toBeDefined();
  return found!.value;
}

describe("método simplex", () => {
  it("resuelve el ejemplo del informe y corrige la holgura", () => {
    const result = solve(informeModel);
    expect(result.status).toBe("optimal");
    close(result.objective ?? NaN, 750);
    close(valueOf(result, "x1"), 0);
    close(valueOf(result, "x2"), 6);
    close(valueOf(result, "H1"), 0);
    close(valueOf(result, "H2"), 794);

    const first = result.iterations[0];
    expect(first.status).toBe("pivot");
    expect(first.columns[first.entering ?? -1]).toBe("x2");
    expect(first.basis[first.leaving ?? -1]).toBe("H1");
    expect(first.zRow.slice(0, 4).map((n) => Math.round(n))).toEqual([-100, -125, 0, 0]);
    close(first.zValue, 0);

    const last = result.iterations.at(-1)!;
    expect(last.status).toBe("optimal");
    expect(last.basis).toEqual(["x2", "H2"]);
    expect(last.matrix[0].map((n) => Math.round(n * 100) / 100)).toEqual([1.5, 1, 0.25, 0]);
    expect(last.matrix[1].map((n) => Math.round(n * 100) / 100)).toEqual([-0.5, 0, -0.25, 1]);
    close(last.rhs[1], 794);
    close(last.zValue, 750);
    expect(last.zRow.map((n) => Math.round(n * 100) / 100)).toEqual([87.5, 0, 31.25, 0]);
    expect(decisionPoint(first)).toEqual([0, 0]);
    expect(decisionPoint(last)?.[1]).toBeCloseTo(6);
  });

  it("minimiza con fase 1", () => {
    const result = solve(phaseDemoModel);
    expect(result.status).toBe("optimal");
    close(result.objective ?? NaN, 9);
    close(valueOf(result, "x1"), 3);
    close(valueOf(result, "x2"), 1);
    expect(result.iterations.some((step) => step.phase === 1 && step.status === "phase")).toBe(true);
  });

  it("reconoce un modelo no factible", () => {
    const model: LinearModel = {
      sense: "max",
      objective: [1],
      constraints: [
        { coef: [1], rel: ">=", rhs: 5 },
        { coef: [1], rel: "<=", rhs: 2 },
      ],
    };
    expect(solve(model).status).toBe("infeasible");
  });

  it("reconoce un modelo no acotado", () => {
    const model: LinearModel = {
      sense: "max",
      objective: [1],
      constraints: [{ coef: [-1], rel: "<=", rhs: 1 }],
    };
    expect(solve(model).status).toBe("unbounded");
  });

  it("dibuja el triángulo factible del informe", () => {
    const drawing = drawFeasible(informeModel);
    expect(drawing?.clipped).toBe(false);
    const vertices = drawing?.vertices ?? [];
    expect(vertices).toHaveLength(3);
    const has = (x: number, y: number) =>
      vertices.some(([px, py]) => Math.abs(px - x) < 1e-6 && Math.abs(py - y) < 1e-6);
    expect(has(0, 0)).toBe(true);
    expect(has(4, 0)).toBe(true);
    expect(has(0, 6)).toBe(true);
  });
});
