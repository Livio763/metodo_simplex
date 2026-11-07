import type { LinearModel } from "./types";

const EPS = 1e-7;

export interface FeasibleDrawing {
  vertices: [number, number][];
  clipped: boolean;
  bounds: { max: number };
}

function feasibleAt(model: LinearModel, x: number, y: number, limit: number | null): boolean {
  if (x < -EPS || y < -EPS) return false;
  if (limit !== null && (x > limit + EPS || y > limit + EPS)) return false;
  for (const constraint of model.constraints) {
    const value = constraint.coef[0] * x + constraint.coef[1] * y;
    if (constraint.rel === "<=" && value > constraint.rhs + EPS) return false;
    if (constraint.rel === ">=" && value < constraint.rhs - EPS) return false;
    if (constraint.rel === "=" && Math.abs(value - constraint.rhs) > 1e-5) return false;
  }
  return true;
}

function intersect(
  a1: number,
  b1: number,
  c1: number,
  a2: number,
  b2: number,
  c2: number,
): [number, number] | null {
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < EPS) return null;
  return [(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det];
}

function hull(points: [number, number][]): [number, number][] {
  const unique: [number, number][] = [];
  for (const point of points) {
    if (!unique.some(([x, y]) => Math.abs(x - point[0]) < 1e-6 && Math.abs(y - point[1]) < 1e-6)) {
      unique.push(point);
    }
  }
  unique.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (unique.length < 3) return unique;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper: [number, number][] = [];
  for (let index = unique.length - 1; index >= 0; index -= 1) {
    const point = unique[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function drawFeasible(model: LinearModel): FeasibleDrawing | null {
  if (model.objective.length !== 2) return null;
  if (model.constraints.some((constraint) => constraint.coef.length !== 2)) return null;

  const lines: [number, number, number][] = [
    [1, 0, 0],
    [0, 1, 0],
  ];
  for (const constraint of model.constraints) {
    lines.push([constraint.coef[0], constraint.coef[1], constraint.rhs]);
  }

  const collect = (limit: number | null) => {
    const points: [number, number][] = [];
    for (let i = 0; i < lines.length; i += 1) {
      for (let j = i + 1; j < lines.length; j += 1) {
        const hit = intersect(...lines[i], ...lines[j]);
        if (hit && feasibleAt(model, hit[0], hit[1], limit)) points.push(hit);
      }
    }
    return hull(points);
  };

  const open = collect(null);
  const span = open.reduce((max, [x, y]) => Math.max(max, x, y), 0);
  const unbounded =
    open.length < 3 ||
    feasibleAt(model, span + 20, 0, null) ||
    feasibleAt(model, 0, span + 20, null) ||
    feasibleAt(model, span + 20, span + 20, null);
  if (!unbounded) return { vertices: open, clipped: false, bounds: { max: Math.max(span, 1) } };

  const limit = Math.max(8, span * 1.6, 1);
  lines.push([1, 0, limit], [0, 1, limit]);
  const closed = collect(limit);
  return { vertices: closed, clipped: true, bounds: { max: limit } };
}
