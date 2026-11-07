import { decisionPoint } from "../simplex/engine";
import { drawFeasible } from "../simplex/geometry";
import type { Iteration, LinearModel } from "../simplex/types";

interface FeasiblePlotProps {
  model: LinearModel;
  iterations: Iteration[];
  step: number;
}

function clipSegment(
  a: number,
  b: number,
  c: number,
  max: number,
): [[number, number], [number, number]] | null {
  const hits: [number, number][] = [];
  const push = (x: number, y: number) => {
    if (x < -1e-6 || y < -1e-6 || x > max + 1e-6 || y > max + 1e-6) return;
    const point: [number, number] = [Math.min(max, Math.max(0, x)), Math.min(max, Math.max(0, y))];
    if (!hits.some(([px, py]) => Math.hypot(px - point[0], py - point[1]) < 1e-5)) hits.push(point);
  };
  if (Math.abs(b) > 1e-8) {
    push(0, c / b);
    push(max, (c - a * max) / b);
  }
  if (Math.abs(a) > 1e-8) {
    push(c / a, 0);
    push((c - b * max) / a, max);
  }
  if (hits.length < 2) return null;
  return [hits[0], hits[1]];
}

export function FeasiblePlot({ model, iterations, step }: FeasiblePlotProps) {
  if (model.objective.length !== 2) {
    return (
      <p className="plot-note">
        El dibujo del polígono es para dos variables. Con más incógnitas el recorrido sigue en la tabla.
      </p>
    );
  }
  const drawing = drawFeasible(model);
  if (!drawing || drawing.vertices.length === 0) {
    return <p className="plot-note">Con estos números no aparece una región factible en el primer cuadrante.</p>;
  }

  const max = drawing.bounds.max;
  const pad = 10;
  const xOf = (value: number) => pad + (value / max) * (100 - pad * 2);
  const yOf = (value: number) => 100 - pad - (value / max) * (100 - pad * 2);
  const ticks: number[] = [];
  const stepSize = max <= 8 ? 1 : max <= 16 ? 2 : Math.ceil(max / 4);
  for (let mark = 0; mark <= max + 1e-6; mark += stepSize) ticks.push(mark);

  const current = iterations[step] ? decisionPoint(iterations[step]) : null;
  const trail = iterations
    .slice(0, step + 1)
    .map((iteration) => decisionPoint(iteration))
    .filter((point): point is [number, number] => point !== null);
  const objective = iterations[step];
  const contour =
    objective && (Math.abs(model.objective[0]) > 1e-9 || Math.abs(model.objective[1]) > 1e-9)
      ? clipSegment(model.objective[0], model.objective[1], objective.zValue, max)
      : null;

  return (
    <figure className="plot">
      <svg viewBox="0 0 100 100" role="img" aria-label="Región factible en el plano x1 x2">
        {ticks.map((mark) => (
          <g key={mark}>
            <line className="grid" x1={xOf(mark)} y1={yOf(0)} x2={xOf(mark)} y2={yOf(max)} />
            <line className="grid" x1={xOf(0)} y1={yOf(mark)} x2={xOf(max)} y2={yOf(mark)} />
          </g>
        ))}
        {model.constraints.map((constraint, index) => {
          const segment = clipSegment(constraint.coef[0], constraint.coef[1], constraint.rhs, max);
          if (!segment) return null;
          return (
            <line
              key={`${constraint.rel}-${index}`}
              className="constraint"
              x1={xOf(segment[0][0])}
              y1={yOf(segment[0][1])}
              x2={xOf(segment[1][0])}
              y2={yOf(segment[1][1])}
            />
          );
        })}
        {drawing.vertices.length >= 3 && (
          <polygon
            className="region"
            points={drawing.vertices.map(([x, y]) => `${xOf(x)},${yOf(y)}`).join(" ")}
          />
        )}
        {trail.length > 1 && (
          <polyline
            className="trail"
            points={trail.map(([x, y]) => `${xOf(x)},${yOf(y)}`).join(" ")}
          />
        )}
        {contour && (
          <line
            className="contour"
            x1={xOf(contour[0][0])}
            y1={yOf(contour[0][1])}
            x2={xOf(contour[1][0])}
            y2={yOf(contour[1][1])}
          />
        )}
        {drawing.vertices.map(([x, y]) => (
          <circle key={`${x}-${y}`} className="vertex" cx={xOf(x)} cy={yOf(y)} r="0.9" />
        ))}
        {current && <circle className="current" cx={xOf(current[0])} cy={yOf(current[1])} r="1.5" />}
        <text className="axis" x={96} y={yOf(0) - 1.2}>x1</text>
        <text className="axis" x={xOf(0) + 1.4} y="6">x2</text>
      </svg>
      <figcaption>
        El relleno es la región factible. La línea de latón es la curva de nivel de Z en este paso.
        El punto de latón es el vértice de la tabla.
        {drawing.clipped ? " El recuadro corta una región que sigue más allá." : ""}
      </figcaption>
    </figure>
  );
}
