import type { NumberDisplayMode } from "../simplex/fraction";

interface HeaderNavProps {
  currentView: "config" | "iterations" | "report";
  onViewChange: (view: "config" | "iterations" | "report") => void;
  displayMode: NumberDisplayMode;
  onToggleDisplayMode: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  canViewIterations: boolean;
  canViewReport: boolean;
}

export function HeaderNav({
  currentView,
  onViewChange,
  displayMode,
  onToggleDisplayMode,
  theme,
  onToggleTheme,
  canViewIterations,
  canViewReport,
}: HeaderNavProps) {
  return (
    <header className="app-header">
      <div className="header-brand" onClick={() => onViewChange("config")}>
        <div className="brand-logo-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 4 20 4 12 12 20 20 4 20" />
          </svg>
        </div>
        <div className="brand-text">
          <h1>SimplexAI</h1>
          <span className="brand-subtitle">Calculadora Lineal Simplex</span>
        </div>
      </div>

      <nav className="header-nav-tabs">
        <button
          type="button"
          className={`nav-tab-btn ${currentView === "config" ? "active" : ""}`}
          onClick={() => onViewChange("config")}
        >
          1. Modelo y Ajustes
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${currentView === "iterations" ? "active" : ""}`}
          onClick={() => onViewChange("iterations")}
          disabled={!canViewIterations}
          title={!canViewIterations ? "Primero debes configurar y resolver un modelo" : ""}
        >
          2. Iteraciones
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${currentView === "report" ? "active" : ""}`}
          onClick={() => onViewChange("report")}
          disabled={!canViewReport}
          title={!canViewReport ? "Disponible tras resolver el modelo" : ""}
        >
          3. Informe de Sensibilidad
        </button>
      </nav>

      <div className="header-settings">
        {/* Toggle Formato Numérico */}
        <button
          type="button"
          className="btn-toolbar"
          onClick={onToggleDisplayMode}
          title="Alternar formato entre fracciones exactas y decimales"
        >
          <span className="toolbar-label">Formato:</span>
          <strong className="toolbar-val">
            {displayMode === "fraction" ? "Fracciones" : "Decimales"}
          </strong>
        </button>

        {/* Toggle Tema Claro / Oscuro */}
        <button
          type="button"
          className="btn-toolbar btn-theme-toggle"
          onClick={onToggleTheme}
          title="Cambiar entre modo claro y modo oscuro"
        >
          <span className="toolbar-label">Tema:</span>
          <strong className="toolbar-val">
            {theme === "light" ? "Claro" : "Oscuro"}
          </strong>
        </button>
      </div>
    </header>
  );
}
