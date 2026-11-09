import { useEffect, useMemo, useState } from "react";
import { HeaderNav } from "./components/HeaderNav";
import { IterationViewer } from "./components/IterationViewer";
import { ModelEditor } from "./components/ModelEditor";
import { ReportViewer } from "./components/ReportViewer";
import { draftFromModel, modelFromDraft, type Draft } from "./simplex/draft";
import { solve } from "./simplex/engine";
import { informeModel } from "./simplex/examples";
import type { NumberDisplayMode } from "./simplex/fraction";

export function App() {
  const [view, setView] = useState<"config" | "iterations" | "report">("config");
  const [draft, setDraft] = useState<Draft>(() => draftFromModel(informeModel));
  const [step, setStep] = useState(0);
  const [displayMode, setDisplayMode] = useState<NumberDisplayMode>("fraction");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Tema: Claro (Light) u Oscuro (Dark)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("simplex_theme");
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("simplex_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Parsear el borrador a un modelo matemático lineal válido
  const parsed = useMemo(() => modelFromDraft(draft), [draft]);

  // Resolver el modelo con el motor Simplex
  const result = useMemo(() => {
    if ("model" in parsed) {
      return solve(parsed.model);
    }
    return null;
  }, [parsed]);

  // Manejador para el botón principal "Resolver y Ver Iteraciones"
  const handleSolve = () => {
    if ("error" in parsed) {
      setValidationError(parsed.error);
      return;
    }
    setValidationError(null);
    setStep(0);
    setView("iterations");
  };

  // Alternar formato entre Fracciones y Decimales
  const toggleDisplayMode = () => {
    setDisplayMode((prev) => (prev === "fraction" ? "decimal" : "fraction"));
  };

  const hasValidResult = result !== null && result.iterations.length > 0;

  return (
    <div className="simplex-app">
      {/* Barra de Navegación Superior */}
      <HeaderNav
        currentView={view}
        onViewChange={(v) => {
          setValidationError(null);
          setView(v);
        }}
        displayMode={displayMode}
        onToggleDisplayMode={toggleDisplayMode}
        theme={theme}
        onToggleTheme={toggleTheme}
        canViewIterations={hasValidResult}
        canViewReport={hasValidResult && result?.status === "optimal"}
      />

      {/* Contenido Principal según la vista seleccionada */}
      <main className="app-main-content">
        {/* VISTA 1: CONFIGURACIÓN, IA, CASOS REALES Y AJUSTES */}
        {view === "config" && (
          <div className="view-panel config-view">
            <div className="view-intro-banner">
              <h2>Configuración del Modelo</h2>
              <p>
                Define la función objetivo y las restricciones, o carga plantillas de la industria
                y el asistente de texto estructurado.
              </p>
            </div>

            <ModelEditor
              draft={draft}
              onChange={(nextDraft) => {
                setDraft(nextDraft);
                setValidationError(null);
              }}
              onSolve={handleSolve}
              error={validationError}
            />
          </div>
        )}

        {/* VISTA 2: ITERACIONES PASO A PASO DE LAS MATRICES */}
        {view === "iterations" && hasValidResult && "model" in parsed && (
          <div className="view-panel iterations-view">
            <IterationViewer
              model={parsed.model}
              result={result}
              step={step}
              onStepChange={setStep}
              onBackToEdit={() => setView("config")}
              onGoToReport={() => setView("report")}
              displayMode={displayMode}
            />
          </div>
        )}

        {/* VISTA 3: INFORME EJECUTIVO & ANÁLISIS DE SENSIBILIDAD */}
        {view === "report" && hasValidResult && "model" in parsed && (
          <div className="view-panel report-view">
            <ReportViewer
              model={parsed.model}
              result={result}
              displayMode={displayMode}
              onBackToIterations={() => setView("iterations")}
              onBackToEdit={() => setView("config")}
            />
          </div>
        )}
      </main>
    </div>
  );
}
