import type { Draft } from "../simplex/draft";
import type { Relation } from "../simplex/types";

interface LaboratoryProps {
  draft: Draft;
  onChange: (draft: Draft) => void;
  onInforme: () => void;
  onPhase: () => void;
}

const relations: Relation[] = ["<=", ">=", "="];

export function Laboratory({ draft, onChange, onInforme, onPhase }: LaboratoryProps) {
  const setObjective = (index: number, value: string) => {
    const objective = draft.objective.slice();
    objective[index] = value;
    onChange({ ...draft, objective });
  };
  const setCoef = (row: number, index: number, value: string) => {
    const rows = draft.rows.map((item, itemIndex) => {
      if (itemIndex !== row) return item;
      const coef = item.coef.slice();
      coef[index] = value;
      return { ...item, coef };
    });
    onChange({ ...draft, rows });
  };

  return (
    <form
      className="lab"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="sense">
        <span id="sense-label">Sentido</span>
        <div role="group" aria-labelledby="sense-label">
          <button
            type="button"
            className={draft.sense === "max" ? "is-on" : undefined}
            aria-pressed={draft.sense === "max"}
            onClick={() => onChange({ ...draft, sense: "max" })}
          >
            Maximizar
          </button>
          <button
            type="button"
            className={draft.sense === "min" ? "is-on" : undefined}
            aria-pressed={draft.sense === "min"}
            onClick={() => onChange({ ...draft, sense: "min" })}
          >
            Minimizar
          </button>
        </div>
      </div>

      <fieldset>
        <legend>Función objetivo</legend>
        <div className="coef-row">
          {draft.objective.map((coef, index) => (
            <label key={`z-${index}`}>
              <span>x{index + 1}</span>
              <input
                inputMode="decimal"
                value={coef}
                onChange={(event) => setObjective(index, event.target.value)}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Restricciones</legend>
        {draft.rows.map((row, rowIndex) => (
          <div className="constraint" key={`row-${rowIndex}`}>
            {row.coef.map((coef, index) => (
              <label key={`a-${rowIndex}-${index}`}>
                <span>x{index + 1}</span>
                <input
                  inputMode="decimal"
                  value={coef}
                  onChange={(event) => setCoef(rowIndex, index, event.target.value)}
                />
              </label>
            ))}
            <label>
              <span>Relación</span>
              <select
                value={row.rel}
                onChange={(event) => {
                  const rows = draft.rows.slice();
                  rows[rowIndex] = { ...row, rel: event.target.value as Relation };
                  onChange({ ...draft, rows });
                }}
              >
                {relations.map((relation) => (
                  <option key={relation} value={relation}>
                    {relation}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Lado derecho</span>
              <input
                inputMode="decimal"
                value={row.rhs}
                onChange={(event) => {
                  const rows = draft.rows.slice();
                  rows[rowIndex] = { ...row, rhs: event.target.value };
                  onChange({ ...draft, rows });
                }}
              />
            </label>
            <button
              type="button"
              className="text-button"
              onClick={() => onChange({ ...draft, rows: draft.rows.filter((_, index) => index !== rowIndex) })}
              disabled={draft.rows.length === 1}
            >
              Quitar fila
            </button>
          </div>
        ))}
      </fieldset>

      <div className="lab-actions">
        <button
          type="button"
          onClick={() => {
            if (draft.objective.length >= 6) return;
            onChange({
              sense: draft.sense,
              objective: [...draft.objective, "0"],
              rows: draft.rows.map((row) => ({ ...row, coef: [...row.coef, "0"] })),
            });
          }}
          disabled={draft.objective.length >= 6}
        >
          Agregar variable
        </button>
        <button
          type="button"
          onClick={() => {
            if (draft.objective.length <= 1) return;
            onChange({
              sense: draft.sense,
              objective: draft.objective.slice(0, -1),
              rows: draft.rows.map((row) => ({ ...row, coef: row.coef.slice(0, -1) })),
            });
          }}
          disabled={draft.objective.length <= 1}
        >
          Quitar variable
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...draft,
              rows: [
                ...draft.rows,
                { coef: draft.objective.map(() => "0"), rel: "<=", rhs: "0" },
              ],
            })
          }
          disabled={draft.rows.length >= 8}
        >
          Agregar restricción
        </button>
        <button type="button" onClick={onInforme}>
          Ejemplo del informe
        </button>
        <button type="button" onClick={onPhase}>
          Minimización con fase 1
        </button>
      </div>
    </form>
  );
}
