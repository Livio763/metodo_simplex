import type { RowOperation } from "../simplex/types";

interface RowOperationsPanelProps {
  operations?: RowOperation[];
}

export function RowOperationsPanel({ operations }: RowOperationsPanelProps) {
  if (!operations || operations.length === 0) {
    return null;
  }

  return (
    <div className="operations-panel">
      <div className="operations-header">
        <h4>Operaciones elementales de fila (Gauss-Jordan) para el siguiente paso:</h4>
      </div>
      <div className="operations-grid">
        {operations.map((op, idx) => (
          <div key={idx} className="op-card">
            <div className="op-target">
              <span className="op-pill">{op.targetRow}</span>
              <code className="op-formula">{op.formula}</code>
            </div>
            <p className="op-desc">{op.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

