import { formatNumber, type NumberDisplayMode } from "../simplex/fraction";
import type { Iteration } from "../simplex/types";

interface TableauProps {
  iteration: Iteration;
  displayMode: NumberDisplayMode;
}

export function Tableau({ iteration, displayMode }: TableauProps) {
  const phaseOne = iteration.phase === 1 && iteration.status !== "phase";
  const rowLabel = phaseOne ? "W" : "Z";
  const rowValue =
    phaseOne && iteration.phaseValue !== null ? -iteration.phaseValue : iteration.zValue;

  const isPivotStep = iteration.status === "pivot";

  return (
    <div className="tableau-container">
      <div className="tableau-badge-row">
        <span className={`phase-badge ${phaseOne ? "badge-phase1" : "badge-phase2"}`}>
          {phaseOne ? "Fase 1 (Minimizar W)" : "Fase 2 (Función Objetivo Z)"}
        </span>
        {isPivotStep && iteration.pivotInfo && (
          <span className="pivot-summary-badge">
            Pivote: <strong>{formatNumber(iteration.pivotInfo.value, displayMode)}</strong> (Fila{" "}
            <strong>{iteration.pivotInfo.leavingVar}</strong> × Columna{" "}
            <strong>{iteration.pivotInfo.enteringVar}</strong>)
          </span>
        )}
      </div>

      <div className="table-wrap">
        <table className="simplex-table">
          <thead>
            <tr>
              <th scope="col" className="th-basis">
                Base
              </th>
              {iteration.columns.map((column, index) => {
                const isEntering = index === iteration.entering;
                return (
                  <th
                    key={column}
                    scope="col"
                    className={`th-var ${isEntering ? "col-entering" : ""}`}
                    title={isEntering ? "Variable Entrante a la base" : undefined}
                  >
                    {column}
                    {isEntering && <span className="arrow-entering"> (Entra)</span>}
                  </th>
                );
              })}
              <th scope="col" className="th-rhs">
                Solución (b)
              </th>
              <th scope="col" className="th-ratio">
                Cociente (θ)
              </th>
            </tr>
          </thead>
          <tbody>
            {iteration.basis.map((basic, row) => {
              const isLeaving = row === iteration.leaving;
              const ratio = iteration.ratios[row];

              return (
                <tr
                  key={`${basic}-${row}`}
                  className={`row-matrix ${isLeaving ? "row-leaving" : ""}`}
                >
                  <th scope="row" className="td-basis">
                    {basic}
                    {isLeaving && <span className="tag-leaving"> (Sale)</span>}
                  </th>
                  {iteration.matrix[row].map((value, column) => {
                    const isPivotCell = isLeaving && column === iteration.entering;
                    const isColEntering = column === iteration.entering;

                    return (
                      <td
                        key={`${iteration.columns[column]}-${row}`}
                        className={`td-num ${isPivotCell ? "cell-pivot" : ""} ${
                          isColEntering && !isPivotCell ? "cell-entering-col" : ""
                        }`}
                      >
                        {formatNumber(value, displayMode)}
                      </td>
                    );
                  })}
                  <td className="td-num td-rhs">
                    <strong>{formatNumber(iteration.rhs[row], displayMode)}</strong>
                  </td>
                  <td className="td-num td-ratio">
                    {ratio === null ? (
                      <span className="ratio-dash">—</span>
                    ) : (
                      <span className={`ratio-val ${isLeaving ? "ratio-min" : ""}`}>
                        {formatNumber(ratio, displayMode)}
                        {isLeaving && <span className="ratio-badge">Mínimo</span>}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Fila Función Objetivo */}
            <tr className="row-objective">
              <th scope="row" className="td-basis td-obj-label">
                {rowLabel}
              </th>
              {iteration.zRow.map((value, column) => {
                const isEnteringCol = column === iteration.entering;
                return (
                  <td
                    key={`z-${iteration.columns[column]}`}
                    className={`td-num td-obj ${isEnteringCol ? "cell-entering-col" : ""}`}
                  >
                    {formatNumber(value, displayMode)}
                  </td>
                );
              })}
              <td className="td-num td-rhs td-obj-val">
                <strong>{formatNumber(rowValue, displayMode)}</strong>
              </td>
              <td className="td-num td-ratio-empty" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
