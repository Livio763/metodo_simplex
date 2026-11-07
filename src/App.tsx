import { useEffect, useMemo, useState } from "react";
import { FeasiblePlot } from "./components/FeasiblePlot";
import { Laboratory } from "./components/Laboratory";
import { Stage } from "./components/Stage";
import { Tableau } from "./components/Tableau";
import { credits } from "./credits";
import { draftFromModel, modelFromDraft, sameModel, type Draft } from "./simplex/draft";
import { informeModel, phaseDemoModel } from "./simplex/examples";
import { solve } from "./simplex/engine";
import { fmt } from "./simplex/format";

function statusLabel(status: string) {
  if (status === "optimal") return "óptimo";
  if (status === "unbounded") return "no acotado";
  if (status === "infeasible") return "infactible";
  if (status === "limit") return "se detuvo";
  return "no se pudo armar";
}

function Grain() {
  const [tile, setTile] = useState("");
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(size, size);
    for (let index = 0; index < image.data.length; index += 4) {
      const value = 150 + Math.random() * 105;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    setTile(canvas.toDataURL());
  }, []);
  if (!tile) return null;
  return <div className="grain" style={{ backgroundImage: `url(${tile})` }} aria-hidden="true" />;
}

export function App() {
  const [draft, setDraft] = useState<Draft>(() => draftFromModel(informeModel));
  const [step, setStep] = useState(0);
  const parsed = useMemo(() => modelFromDraft(draft), [draft]);
  const result = useMemo(
    () => ("model" in parsed ? solve(parsed.model) : null),
    [parsed],
  );
  const safeStep = result && result.iterations.length > 0 ? Math.min(step, result.iterations.length - 1) : 0;
  const iteration = result?.iterations[safeStep];
  const isInforme = "model" in parsed && sameModel(parsed.model, informeModel);

  const changeDraft = (next: Draft) => {
    setDraft(next);
    setStep(0);
  };

  return (
    <>
      <Grain />
      <a className="skip" href="#modelo">
        Saltar a la explicación
      </a>
      <header className="nav">
        <p>{credits.course}</p>
        <nav aria-label="Secciones">
          <a href="#modelo">Modelo</a>
          <a href="#laboratorio">Laboratorio</a>
        </nav>
      </header>
      <main>
        <Stage />

        <section id="modelo" className="sheet split">
          <div className="main">
            <h2>El modelo del informe</h2>
            <p>
              Hay que decidir cuánto vale cada incógnita. Las restricciones dicen qué no se puede
              pasar. La función objetivo dice si se buscan más beneficios o menos costos. George
              Dantzig presentó el algoritmo en 1947.
            </p>
            <p>
              Una desigualdad ≤ se vuelve igualdad con una holgura. En las diapositivas la función
              cambia de signo para armar la fila inicial, −100 y −125. El programa usa esa fila y
              deja el valor de Z en la columna solución.
            </p>
            <p>
              El otro caso del informe es una fábrica de mesas, sillas, camas y bibliotecas. El plan
              que publican es 3, 4, 6 y 4, con utilidad 340000. Cada mueble deja 20000, y 17 por
              20000 da esa cifra. El informe no dice cuántas piezas hay en existencia, así que ese
              caso no se carga como modelo: faltarían las restricciones.
            </p>
          </div>
          <div className="side" aria-label="Modelo lineal del informe">
            <div className="equations">
              <p>max Z = 100 x<sub>1</sub> + 125 x<sub>2</sub></p>
              <p>6 x<sub>1</sub> + 4 x<sub>2</sub> ≤ 24</p>
              <p>x<sub>1</sub> + x<sub>2</sub> ≤ 800</p>
              <p>x<sub>1</sub>, x<sub>2</sub> ≥ 0</p>
            </div>
          </div>
        </section>

        <section id="laboratorio" className="sheet lab-sheet split">
          <div className="main">
            <h2>El recorrido, pivote a pivote</h2>
            <p>
              {isInforme
                ? "Está cargado el ejemplo del informe. Cada botón avanza un pivote."
                : "La región y la tabla siguen el modelo escrito abajo."}
            </p>
            {"error" in parsed && (
              <p className="alert" role="alert">
                {parsed.error}
              </p>
            )}
          </div>
          <div className="side">
            {result && "model" in parsed && (
              <FeasiblePlot model={parsed.model} iterations={result.iterations} step={safeStep} />
            )}
          </div>
          <div className="main">
          {result && "model" in parsed && (
            <>
              <div className="stepper">
                <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={safeStep === 0}>
                  Pivote anterior
                </button>
                <p>
                  Paso {safeStep + 1} de {result.iterations.length}
                  {iteration ? ` · Z = ${fmt(iteration.zValue)}` : ""}
                  {safeStep === result.iterations.length - 1 ? ` · ${statusLabel(result.status)}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setStep((current) => Math.min(result.iterations.length - 1, current + 1))
                  }
                  disabled={safeStep >= result.iterations.length - 1}
                >
                  Pivote siguiente
                </button>
              </div>
              {iteration && (
                <>
                  <p className="explain" aria-live="polite">
                    {iteration.explanation}
                  </p>
                  <Tableau iteration={iteration} />
                </>
              )}
              {result.status === "optimal" && safeStep === result.iterations.length - 1 && (
                <>
                  <ul className="answer">
                    {result.variables
                      .filter((variable) => variable.name.startsWith("x") || Math.abs(variable.value) > 1e-8)
                      .map((variable) => (
                        <li key={variable.name}>
                          {variable.name} = {fmt(variable.value)}
                        </li>
                      ))}
                  </ul>
                  {isInforme && (
                    <p className="correction">
                      El informe anota H2 = 806. Al limpiar la columna, la segunda fila resta el
                      renglón pivote: 800 − 6 = 794. x1 = 0, x2 = 6 y Z = 750 quedan igual.
                    </p>
                  )}
                </>
              )}
            </>
          )}

          <h2 className="lab-title">Otro modelo</h2>
          <p>
            Sirve cualquier modelo lineal con variables no negativas: maximizar o minimizar, y
            restricciones ≤, ≥ o =. Con dos incógnitas se dibuja la región. Con más, queda la tabla.
          </p>
          <Laboratory
            draft={draft}
            onChange={changeDraft}
            onInforme={() => changeDraft(draftFromModel(informeModel))}
            onPhase={() => changeDraft(draftFromModel(phaseDemoModel))}
          />
          </div>
        </section>

      </main>
      <footer>
        <p>{credits.university}</p>
        <p>{credits.faculty}</p>
        <p>
          {credits.course}. Docente: {credits.teacher}.
        </p>
      </footer>
    </>
  );
}
