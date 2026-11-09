import { generateExecutiveReport } from "../simplex/ai";
import { formatNumber, type NumberDisplayMode } from "../simplex/fraction";
import type { LinearModel, SolveResult } from "../simplex/types";

interface ReportViewerProps {
  model: LinearModel;
  result: SolveResult;
  displayMode: NumberDisplayMode;
  onBackToIterations: () => void;
  onBackToEdit: () => void;
}

export function ReportViewer({
  model,
  result,
  displayMode,
  onBackToIterations,
  onBackToEdit,
}: ReportViewerProps) {
  const report = generateExecutiveReport(result, model, displayMode);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-container">
      {/* Barra Superior del Reporte */}
      <div className="report-top-bar no-print">
        <div className="report-nav-btns">
          <button type="button" className="btn-back-edit" onClick={onBackToIterations}>
            ← Volver a iteraciones
          </button>
          <button type="button" className="btn-back-edit" onClick={onBackToEdit}>
            Modificar modelo
          </button>
        </div>
        <button type="button" className="btn-print" onClick={handlePrint}>
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Contenido Imprimible */}
      <div className="report-sheet">
        <div className="report-header">
          <div className="report-badge">Reporte de Optimización Lineal</div>
          <h2>Informe de Resultados y Análisis de Sensibilidad</h2>
          <p className="report-meta">
            Método Simplex • Modo:{" "}
            <strong>{model.sense === "max" ? "Maximización" : "Minimización"}</strong> •
            Formato: <strong>{displayMode === "fraction" ? "Fracciones Exactas" : "Decimales"}</strong>
          </p>
        </div>

        {/* Resumen Ejecutivo */}
        <div className="report-section summary-box">
          <h3>Dictamen de la Solución</h3>
          <p>{report.executiveSummary}</p>
          <div className="summary-z-callout">
            <span>Valor Óptimo de la Función Objetivo:</span>
            <strong>Z* = {formatNumber(result.objective ?? 0, displayMode)}</strong>
          </div>
        </div>

        {/* Desglose de Variables de Decisión */}
        <div className="report-section">
          <h3>Valores de las Variables en el Óptimo</h3>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Rol en el Modelo</th>
                  <th>Valor Óptimo</th>
                </tr>
              </thead>
              <tbody>
                {report.solutionBreakdown.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{item.variable}</strong>
                    </td>
                    <td>{item.role}</td>
                    <td className="font-mono font-bold text-accent">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Análisis de Recursos y Precios Sombra */}
        <div className="report-section">
          <h3>Análisis de Recursos y Precios Sombra (Sensibilidad)</h3>
          <p className="section-note">
            El <strong>precio sombra</strong> (variable dual) indica en cuánto se incrementaría la
            utilidad Z si se consiguiera una unidad adicional del recurso.
          </p>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Recurso / Restricción</th>
                  <th>Estado</th>
                  <th>Holgura / Excedente</th>
                  <th>Precio Sombra (Dual)</th>
                  <th>Recomendación de Decisión</th>
                </tr>
              </thead>
              <tbody>
                {report.resourceAnalysis.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{item.resource}</strong>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          item.status.includes("Agotado") ? "pill-critical" : "pill-surplus"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="font-mono">{item.slack}</td>
                    <td className="font-mono font-bold text-accent">{item.shadowPrice}</td>
                    <td className="text-sm">{item.advice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota Teórica / Pie */}
        <div className="report-footer">
          <p>
            Generado por <strong>SimplexAI</strong> • Sistema de resolución y análisis didáctico del
            Método Simplex y Dos Fases.
          </p>
        </div>
      </div>
    </div>
  );
}

