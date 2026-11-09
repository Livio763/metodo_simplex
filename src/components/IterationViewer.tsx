import { useEffect, useState } from "react";
import { generateStepExplanation } from "../simplex/ai";
import { formatNumber, type NumberDisplayMode } from "../simplex/fraction";
import type { Iteration, LinearModel, SolveResult } from "../simplex/types";
import { FeasiblePlot } from "./FeasiblePlot";
import { RowOperationsPanel } from "./RowOperationsPanel";
import { Tableau } from "./Tableau";

interface IterationViewerProps {
  model: LinearModel;
  result: SolveResult;
  step: number;
  onStepChange: (step: number) => void;
  onBackToEdit: () => void;
  onGoToReport: () => void;
  displayMode: NumberDisplayMode;
}

export function IterationViewer({
  model,
  result,
  step,
  onStepChange,
  onBackToEdit,
  onGoToReport,
  displayMode,
}: IterationViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const totalSteps = result.iterations.length;
  const safeStep = Math.min(Math.max(0, step), totalSteps - 1);
  const currentIteration: Iteration | undefined = result.iterations[safeStep];

  // Auto-play de iteraciones
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        onStepChange(safeStep < totalSteps - 1 ? safeStep + 1 : 0);
      }, 2200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, safeStep, totalSteps, onStepChange]);

  if (!currentIteration) {
    return (
      <div className="viewer-error">
        <p>No hay iteraciones disponibles para este modelo.</p>
        <button type="button" className="btn-primary" onClick={onBackToEdit}>
          Volver a configurar
        </button>
      </div>
    );
  }

  const isFirst = safeStep === 0;
  const isLast = safeStep === totalSteps - 1;
  const isOptimal = result.status === "optimal" && isLast;

  const stepStatusLabel = () => {
    if (currentIteration.status === "optimal") return "Solución Óptima";
    if (currentIteration.status === "unbounded") return "No Acotado";
    if (currentIteration.status === "infeasible") return "Infactible";
    if (currentIteration.status === "phase") return "Fin Fase 1";
    if (safeStep === 0) return "Tabla Inicial (Paso 0)";
    return `Iteración ${safeStep}`;
  };

  const explanation = generateStepExplanation(currentIteration, model, displayMode);

  return (
    <div className="iteration-viewer-root">
      {/* Barra de Control de Navegación de Iteraciones */}
      <div className="viewer-nav-bar">
        <div className="viewer-nav-left">
          <button type="button" className="btn-back-edit" onClick={onBackToEdit}>
            ← Modificar modelo
          </button>
          <span className="step-badge-status">{stepStatusLabel()}</span>
        </div>

        <div className="stepper-controls">
          <button
            type="button"
            className="btn-step"
            onClick={() => {
              setIsPlaying(false);
              onStepChange(0);
            }}
            disabled={isFirst}
            title="Ir a la tabla inicial"
          >
            Inicio
          </button>

          <button
            type="button"
            className="btn-step"
            onClick={() => {
              setIsPlaying(false);
              onStepChange(safeStep - 1);
            }}
            disabled={isFirst}
            title="Iteración anterior"
          >
            Anterior
          </button>

          <div className="step-counter-box">
            <span className="step-current">Paso {safeStep + 1}</span>
            <span className="step-total">de {totalSteps}</span>
          </div>

          <button
            type="button"
            className="btn-step"
            onClick={() => {
              setIsPlaying(false);
              onStepChange(safeStep + 1);
            }}
            disabled={isLast}
            title="Siguiente iteración"
          >
            Siguiente
          </button>

          <button
            type="button"
            className="btn-step"
            onClick={() => {
              setIsPlaying(false);
              onStepChange(totalSteps - 1);
            }}
            disabled={isLast}
            title="Ir a la solución final"
          >
            Fin
          </button>

          <button
            type="button"
            className={`btn-step btn-play ${isPlaying ? "playing" : ""}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pausar avance automático" : "Reproducir pasos automáticamente"}
          >
            {isPlaying ? "Pausa" : "Auto"}
          </button>
        </div>

        <div className="viewer-nav-right">
          <button type="button" className="btn-report-action" onClick={onGoToReport}>
            Ver informe de sensibilidad →
          </button>
        </div>
      </div>

      {/* Contenido Principal: Dos Columnas Compactas */}
      <div className="viewer-grid-layout">
        {/* Columna Izquierda: Matriz Simplex y Operaciones de Fila */}
        <div className="viewer-col-matrix">
          <div className="matrix-card">
            <div className="matrix-card-header">
              <h3>Matriz Simplex — {stepStatusLabel()}</h3>
              <div className="matrix-obj-summary">
                <span>
                  Valor actual de <strong>Z = {formatNumber(currentIteration.zValue, displayMode)}</strong>
                </span>
              </div>
            </div>

            <Tableau iteration={currentIteration} displayMode={displayMode} />

            {/* Demostración de Operaciones de Fila Gauss-Jordan */}
            <RowOperationsPanel operations={currentIteration.rowOperations} />
          </div>
        </div>

        {/* Columna Derecha: Tutor Didáctico + Gráfico 2D Factible */}
        <div className="viewer-col-sidebar">
          {/* Tarjeta de Explicación Didáctica */}
          <div className="tutor-card">
            <div className="tutor-card-header">
              <h4>Explicación del paso</h4>
            </div>
            <div className="tutor-body">
              <p className="tutor-text">{explanation}</p>
            </div>
          </div>

          {/* Gráfico 2D sincronizado cuando el modelo tiene 2 variables */}
          {model.objective.length === 2 && (
            <div className="plot-card">
              <div className="plot-card-header">
                <h4>Región factible y vértice actual</h4>
              </div>
              <div className="plot-canvas-wrapper">
                <FeasiblePlot model={model} iterations={result.iterations} step={safeStep} />
              </div>
              <p className="plot-legend">
                Punto destacado: vértice visitado en esta iteración. La línea representa la curva de nivel de Z.
              </p>
            </div>
          )}

          {/* Si estamos en el paso final óptimo, mostrar resumen rápido de solución */}
          {isOptimal && (
            <div className="optimal-summary-card">
              <h4>Solución óptima:</h4>
              <ul className="optimal-var-list">
                {result.variables.map((v) => (
                  <li key={v.name}>
                    <span className="var-name">{v.name}:</span>
                    <strong className="var-val">{formatNumber(v.value, displayMode)}</strong>
                  </li>
                ))}
              </ul>
              <div className="optimal-z-box">
                <span>Z Óptimo = </span>
                <strong>{formatNumber(result.objective ?? 0, displayMode)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
