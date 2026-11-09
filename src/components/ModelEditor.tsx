import { useState } from "react";
import { parseProblemFromNaturalText } from "../simplex/ai";
import type { Draft } from "../simplex/draft";
import { realCases, type RealCase } from "../simplex/realCases";
import type { Relation } from "../simplex/types";

interface ModelEditorProps {
  draft: Draft;
  onChange: (draft: Draft) => void;
  onSolve: () => void;
  error?: string | null;
}

const relationOptions: Relation[] = ["<=", ">=", "="];

export function ModelEditor({ draft, onChange, onSolve, error }: ModelEditorProps) {
  const [activeTab, setActiveTab] = useState<"matrix" | "cases" | "ai">("matrix");
  const [aiText, setAiText] = useState("");
  const [aiMessage, setAiMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  // Modificar función objetivo
  const updateObjectiveCoef = (colIndex: number, val: string) => {
    const nextObjective = draft.objective.slice();
    nextObjective[colIndex] = val;
    onChange({ ...draft, objective: nextObjective });
  };

  // Modificar nombre de variable
  const updateVariableName = (colIndex: number, name: string) => {
    const nextNames = draft.variableNames.slice();
    nextNames[colIndex] = name;
    onChange({ ...draft, variableNames: nextNames });
  };

  // Modificar coeficientes de fila
  const updateConstraintCoef = (rowIndex: number, colIndex: number, val: string) => {
    const nextRows = draft.rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      const nextCoef = row.coef.slice();
      nextCoef[colIndex] = val;
      return { ...row, coef: nextCoef };
    });
    onChange({ ...draft, rows: nextRows });
  };

  // Modificar relación
  const updateConstraintRel = (rowIndex: number, rel: Relation) => {
    const nextRows = draft.rows.map((row, rIdx) => (rIdx === rowIndex ? { ...row, rel } : row));
    onChange({ ...draft, rows: nextRows });
  };

  // Modificar RHS
  const updateConstraintRHS = (rowIndex: number, rhs: string) => {
    const nextRows = draft.rows.map((row, rIdx) => (rIdx === rowIndex ? { ...row, rhs } : row));
    onChange({ ...draft, rows: nextRows });
  };

  // Modificar nombre de restricción
  const updateConstraintName = (rowIndex: number, name: string) => {
    const nextRows = draft.rows.map((row, rIdx) => (rIdx === rowIndex ? { ...row, name } : row));
    onChange({ ...draft, rows: nextRows });
  };

  // Agregar variable
  const addVariable = () => {
    if (draft.objective.length >= 8) return;
    const newIndex = draft.objective.length + 1;
    onChange({
      ...draft,
      variableNames: [...draft.variableNames, `x${newIndex}`],
      objective: [...draft.objective, "0"],
      rows: draft.rows.map((row) => ({ ...row, coef: [...row.coef, "0"] })),
    });
  };

  // Quitar variable
  const removeVariable = () => {
    if (draft.objective.length <= 2) return;
    onChange({
      ...draft,
      variableNames: draft.variableNames.slice(0, -1),
      objective: draft.objective.slice(0, -1),
      rows: draft.rows.map((row) => ({ ...row, coef: row.coef.slice(0, -1) })),
    });
  };

  // Agregar restricción
  const addConstraint = () => {
    if (draft.rows.length >= 10) return;
    const newIndex = draft.rows.length + 1;
    onChange({
      ...draft,
      rows: [
        ...draft.rows,
        {
          name: `Restricción ${newIndex}`,
          coef: draft.objective.map(() => "0"),
          rel: "<=",
          rhs: "0",
        },
      ],
    });
  };

  // Quitar restricción
  const removeConstraint = (idx: number) => {
    if (draft.rows.length <= 1) return;
    onChange({
      ...draft,
      rows: draft.rows.filter((_, rIdx) => rIdx !== idx),
    });
  };

  // Cargar caso real
  const handleLoadCase = (realCase: RealCase) => {
    const model = realCase.model;
    const varCount = model.objective.length;
    onChange({
      sense: model.sense,
      variableNames:
        model.variableNames && model.variableNames.length === varCount
          ? model.variableNames.slice()
          : Array.from({ length: varCount }, (_, i) => `x${i + 1}`),
      objective: model.objective.map(String),
      rows: model.constraints.map((c, i) => ({
        name: c.name || `Restricción ${i + 1}`,
        coef: c.coef.map(String),
        rel: c.rel,
        rhs: String(c.rhs),
      })),
    });
    setActiveTab("matrix");
    setAiMessage({
      type: "success",
      text: `Se cargó el caso: "${realCase.title}". ¡Listo para resolver!`,
    });
  };

  // Procesar con IA
  const handleProcessAI = () => {
    const result = parseProblemFromNaturalText(aiText);
    if (!result.success || !result.model) {
      setAiMessage({
        type: "error",
        text: result.error || "No se pudo interpretar el problema.",
      });
      return;
    }

    const m = result.model;
    const varCount = m.objective.length;
    onChange({
      sense: m.sense,
      variableNames: m.variableNames || Array.from({ length: varCount }, (_, i) => `x${i + 1}`),
      objective: m.objective.map(String),
      rows: m.constraints.map((c, i) => ({
        name: c.name || `Restricción ${i + 1}`,
        coef: c.coef.map(String),
        rel: c.rel,
        rhs: String(c.rhs),
      })),
    });

    setAiMessage({
      type: "success",
      text: result.summary || "¡Problema interpretado correctamente por la IA!",
    });
    setActiveTab("matrix");
  };

  return (
    <div className="editor-container">
      {/* Selector de Pestañas de Configuración */}
      <div className="editor-tabs">
        <button
          type="button"
          className={`editor-tab-btn ${activeTab === "matrix" ? "active" : ""}`}
          onClick={() => setActiveTab("matrix")}
        >
          Editor Manual
        </button>
        <button
          type="button"
          className={`editor-tab-btn ${activeTab === "cases" ? "active" : ""}`}
          onClick={() => setActiveTab("cases")}
        >
          Casos de Aplicación
        </button>
        <button
          type="button"
          className={`editor-tab-btn ${activeTab === "ai" ? "active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          Asistente de Texto (IA)
        </button>
      </div>

      {aiMessage && (
        <div className={`ai-alert ${aiMessage.type === "success" ? "alert-success" : "alert-error"}`}>
          {aiMessage.text}
          <button type="button" className="close-btn" onClick={() => setAiMessage(null)}>
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="ai-alert alert-error">
          Aviso: {error}
        </div>
      )}

      {/* PESTAÑA 1: CASOS REALES */}
      {activeTab === "cases" && (
        <div className="cases-grid">
          {realCases.map((rc) => (
            <div key={rc.id} className="case-card">
              <div className="case-header">
                <span className="case-cat-pill">{rc.category}</span>
                <h4>{rc.title}</h4>
              </div>
              <p className="case-desc">{rc.description}</p>
              <p className="case-context">
                <strong>Contexto Real:</strong> {rc.realWorldContext}
              </p>
              <div className="case-math-preview">
                <code>
                  {rc.model.sense.toUpperCase()} Z ={" "}
                  {rc.model.objective.map((coef, i) => `${coef}·x${i + 1}`).join(" + ")}
                </code>
              </div>
              <button
                type="button"
                className="btn-load-case"
                onClick={() => handleLoadCase(rc)}
              >
                Cargar este caso en la calculadora
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PESTAÑA 2: ASISTENTE IA */}
      {activeTab === "ai" && (
        <div className="ai-assistant-card">
          <div className="ai-header">
            <h3>Asistente de Modelado Lineal</h3>
            <p>
              Escribe o pega el enunciado de cualquier problema de optimización en español.
              El sistema identificará variables, sentido (Max/Min) y restricciones.
            </p>
          </div>
          <textarea
            className="ai-textarea"
            rows={5}
            placeholder="Ejemplo: Una fábrica elabora mesas y sillas. Cada mesa deja una utilidad de $80 y cada silla de $50. Se dispone de 120 horas de carpintería y 80 horas de pintura..."
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
          />
          <div className="ai-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleProcessAI}
              disabled={aiText.trim().length === 0}
            >
              Interpretar y formular modelo
            </button>
            <div className="ai-quick-examples">
              <span>Cargar ejemplo:</span>
              <button
                type="button"
                className="btn-chip"
                onClick={() =>
                  setAiText(
                    "Maximizar utilidades Z = 100 x1 + 125 x2 sujeto a:\n6 x1 + 4 x2 <= 24 (Horas máquina)\nx1 + x2 <= 800 (Almacén)",
                  )
                }
              >
                Ejemplo Informe
              </button>
              <button
                type="button"
                className="btn-chip"
                onClick={() =>
                  setAiText(
                    "Minimizar costos de nutrición Z = 2 x1 + 3 x2 sujeto a:\n3 x1 + 2 x2 >= 18 (Proteínas mínimas)\n2 x1 + 4 x2 >= 24 (Carbohidratos mínimos)\nx1 + x2 <= 10 (Límite grasas)",
                  )
                }
              >
                Dieta Stigler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: EDITOR MANUAL Y MATRICIAL */}
      {activeTab === "matrix" && (
        <div className="manual-matrix-card">
          {/* Fila de Controles Superiores: Sentido y Contadores */}
          <div className="matrix-top-bar">
            <div className="sense-toggle-group">
              <span className="bar-label">Objetivo:</span>
              <button
                type="button"
                className={`btn-toggle ${draft.sense === "max" ? "toggle-active" : ""}`}
                onClick={() => onChange({ ...draft, sense: "max" })}
              >
                Maximizar (Max)
              </button>
              <button
                type="button"
                className={`btn-toggle ${draft.sense === "min" ? "toggle-active" : ""}`}
                onClick={() => onChange({ ...draft, sense: "min" })}
              >
                Minimizar (Min)
              </button>
            </div>

            <div className="dimension-buttons">
              <span className="bar-label">Variables ({draft.objective.length}):</span>
              <button
                type="button"
                className="btn-dim"
                onClick={addVariable}
                disabled={draft.objective.length >= 8}
              >
                + Variable
              </button>
              <button
                type="button"
                className="btn-dim"
                onClick={removeVariable}
                disabled={draft.objective.length <= 2}
              >
                - Variable
              </button>

              <span className="bar-label" style={{ marginLeft: "1rem" }}>
                Restricciones ({draft.rows.length}):
              </span>
              <button
                type="button"
                className="btn-dim"
                onClick={addConstraint}
                disabled={draft.rows.length >= 10}
              >
                + Restricción
              </button>
            </div>
          </div>

          {/* Tabla de Matriz de Entrada */}
          <div className="matrix-table-wrap">
            <table className="matrix-input-table">
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>Nombre / Tipo</th>
                  {draft.variableNames.map((name, colIdx) => (
                    <th key={`head-${colIdx}`}>
                      <input
                        className="var-name-input"
                        value={name}
                        title="Puedes renombrar la variable"
                        onChange={(e) => updateVariableName(colIdx, e.target.value)}
                      />
                    </th>
                  ))}
                  <th style={{ width: "12%" }}>Relación</th>
                  <th style={{ width: "16%" }}>Lado Der. (b)</th>
                  <th style={{ width: "8%" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {/* Función Objetivo Z */}
                <tr className="matrix-row-obj">
                  <td className="row-title-obj">
                    <strong>Función Objetivo Z</strong>
                  </td>
                  {draft.objective.map((coef, colIdx) => (
                    <td key={`obj-${colIdx}`}>
                      <div className="input-coef-wrap">
                        <input
                          className="coef-input"
                          inputMode="decimal"
                          value={coef}
                          onChange={(e) => updateObjectiveCoef(colIdx, e.target.value)}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="text-center font-mono">→ {draft.sense.toUpperCase()}</td>
                  <td className="text-center text-muted">—</td>
                  <td />
                </tr>

                {/* Filas de Restricciones */}
                {draft.rows.map((row, rowIdx) => (
                  <tr key={`row-${rowIdx}`}>
                    <td>
                      <input
                        className="constraint-name-input"
                        value={row.name}
                        placeholder={`Restricción ${rowIdx + 1}`}
                        onChange={(e) => updateConstraintName(rowIdx, e.target.value)}
                      />
                    </td>
                    {row.coef.map((coef, colIdx) => (
                      <td key={`c-${rowIdx}-${colIdx}`}>
                        <input
                          className="coef-input"
                          inputMode="decimal"
                          value={coef}
                          onChange={(e) => updateConstraintCoef(rowIdx, colIdx, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <select
                        className="select-rel"
                        value={row.rel}
                        onChange={(e) => updateConstraintRel(rowIdx, e.target.value as Relation)}
                      >
                        {relationOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="coef-input rhs-input"
                        inputMode="decimal"
                        value={row.rhs}
                        onChange={(e) => updateConstraintRHS(rowIdx, e.target.value)}
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn-del-row"
                        title="Eliminar esta restricción"
                        onClick={() => removeConstraint(rowIdx)}
                        disabled={draft.rows.length <= 1}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista previa matemática compacta */}
          <div className="math-formulation-preview">
            <span className="preview-label">Formulación Matemática:</span>
            <div className="preview-content">
              <strong>{draft.sense.toUpperCase()} Z</strong> ={" "}
              {draft.objective.map((coef, i) => `${coef}·${draft.variableNames[i]}`).join(" + ")}
              <br />
              <strong>Sujeto a:</strong>
              {draft.rows.map((r, i) => (
                <div key={i} className="preview-row">
                  {r.coef.map((coef, j) => `${coef}·${draft.variableNames[j]}`).join(" + ")}{" "}
                  {r.rel} {r.rhs}
                  <span className="preview-row-note"> ({r.name})</span>
                </div>
              ))}
              <div className="preview-nonneg">
                {draft.variableNames.join(", ")} ≥ 0 (No negatividad)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón Principal para Resolver y pasar a las Iteraciones */}
      <div className="editor-footer">
        <button type="button" className="btn-resolve-main" onClick={onSolve}>
          Resolver y ver iteraciones
        </button>
      </div>
    </div>
  );
}

