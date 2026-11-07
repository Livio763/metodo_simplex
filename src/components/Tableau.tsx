import { fmt } from "../simplex/format";
import type { Iteration } from "../simplex/types";

function cellClass(value: number, marked: boolean): string {
  const names = ["num"];
  if (value < -1e-8) names.push("neg");
  if (marked) names.push("pivot");
  return names.join(" ");
}

export function Tableau({ iteration }: { iteration: Iteration }) {
  const phaseOne = iteration.phase === 1 && iteration.status !== "phase";
  const rowLabel = phaseOne ? "W" : "Z";
  const rowValue = phaseOne && iteration.phaseValue !== null ? -iteration.phaseValue : iteration.zValue;

  return (
    <div className="table-wrap">
      <table>
        <caption>
          {phaseOne
            ? "Fase 1. W vale cero cuando las artificiales salen de la base."
            : "Fila objetivo con la convención de las diapositivas: entra el coeficiente más negativo."}
        </caption>
        <thead>
          <tr>
            <th scope="col">Base</th>
            {iteration.columns.map((column, index) => (
              <th key={column} scope="col" className={index === iteration.entering ? "entering" : undefined}>
                {column}
              </th>
            ))}
            <th scope="col">Solución</th>
            <th scope="col">Cociente</th>
          </tr>
        </thead>
        <tbody>
          {iteration.basis.map((basic, row) => (
            <tr key={`${basic}-${row}`} className={row === iteration.leaving ? "leaving" : undefined}>
              <th scope="row">{basic}</th>
              {iteration.matrix[row].map((value, column) => (
                <td
                  key={iteration.columns[column]}
                  className={cellClass(
                    value,
                    row === iteration.leaving && column === iteration.entering,
                  )}
                >
                  {fmt(value)}
                </td>
              ))}
              <td className="num">{fmt(iteration.rhs[row])}</td>
              <td className="num">
                {iteration.ratios[row] === null ? "—" : fmt(iteration.ratios[row])}
              </td>
            </tr>
          ))}
          <tr className="objective">
            <th scope="row">{rowLabel}</th>
            {iteration.zRow.map((value, column) => (
              <td key={iteration.columns[column]} className={cellClass(value, column === iteration.entering)}>
                {fmt(value)}
              </td>
            ))}
            <td className="num">{fmt(rowValue)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
