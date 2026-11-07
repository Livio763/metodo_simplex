import { useMemo, useState } from "react";
import { FeasiblePlot } from "./components/FeasiblePlot";
import { Laboratory } from "./components/Laboratory";
import { Stage } from "./components/Stage";
import { Tableau } from "./components/Tableau";
import { credits } from "./credits";
import { draftFromModel, modelFromDraft, sameModel, type Draft } from "./simplex/draft";
import { informeModel, phaseDemoModel } from "./simplex/examples";
import { solve } from "./simplex/engine";
import { fmt } from "./simplex/format";

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
      <a className="skip" href="#modelo">
        Saltar a la explicación
      </a>
      <header className="nav">
        <p>{credits.course}</p>
        <nav aria-label="Secciones">
          <a href="#modelo">Modelo</a>
          <a href="#laboratorio">Laboratorio</a>
          <a href="#guion">Guion</a>
        </nav>
      </header>
      <main>
        <Stage />

        <section id="modelo" className="sheet">
          <h2>El modelo del informe</h2>
          <p>
            Hay que decidir cuánto vale cada incógnita. Las restricciones dicen qué no se puede
            pasar. La función objetivo dice si se buscan más beneficios o menos costos. George
            Dantzig presentó el algoritmo en 1947.
          </p>
          <div className="equations" aria-label="Modelo lineal del informe">
            <p>max Z = 100 x<sub>1</sub> + 125 x<sub>2</sub></p>
            <p>6 x<sub>1</sub> + 4 x<sub>2</sub> ≤ 24</p>
            <p>x<sub>1</sub> + x<sub>2</sub> ≤ 800</p>
            <p>x<sub>1</sub>, x<sub>2</sub> ≥ 0</p>
          </div>
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
        </section>

        <section id="laboratorio" className="sheet lab-sheet">
          <h2>El recorrido, pivote a pivote</h2>
          <p>
            {isInforme
              ? "Está cargado el ejemplo del informe. Avanza un pivote cuando lo expliques."
              : "El dibujo y la tabla responden al modelo que está escrito abajo."}
          </p>
          {"error" in parsed && (
            <p className="alert" role="alert">
              {parsed.error}
            </p>
          )}
          {result && "model" in parsed && (
            <>
              <FeasiblePlot model={parsed.model} iterations={result.iterations} step={safeStep} />
              <div className="stepper">
                <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={safeStep === 0}>
                  Pivote anterior
                </button>
                <p>
                  Paso {safeStep + 1} de {result.iterations.length}
                  {iteration ? ` · Z = ${fmt(iteration.zValue)}` : ""}
                  {result.status === "optimal" && safeStep === result.iterations.length - 1
                    ? " · óptimo"
                    : ""}
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

          <h2 className="lab-title">Cambiar el modelo en vivo</h2>
          <Laboratory
            draft={draft}
            onChange={changeDraft}
            onInforme={() => changeDraft(draftFromModel(informeModel))}
            onPhase={() => changeDraft(draftFromModel(phaseDemoModel))}
          />
        </section>

        <section id="guion" className="sheet">
          <h2>Cómo contarlo en la defensa</h2>
          <ol className="script">
            <li>
              Deja el tetraedro quieto un momento. Di que el método toma el nombre de esa figura,
              y que Dantzig lo presentó en 1947 para modelos lineales que ya estaban escritos y
              no se podían resolver a mano.
            </li>
            <li>
              Haz scroll. Separa el sólido de tres dimensiones del ejemplo: dos variables, región
              en el plano. El tetraedro no es el dibujo de esas dos restricciones.
            </li>
            <li>
              Lee el modelo: x1 y x2 son las decisiones, 24 y 800 son los recursos, Z es lo que se
              quiere agrandar.
            </li>
            <li>
              En el polígono, señala el origen y el salto hasta (0, 6). La recta que corta es
              6x1 + 4x2 = 24. La de 800 queda lejos y no toca ese triángulo.
            </li>
            <li>
              Avanza un pivote. Entra x2, sale H1, el pivote vale 4. Llegas a Z = 750. Si preguntan
              por el 806 del informe, muestra la resta 800 − 6.
            </li>
            <li>
              Cambia un coeficiente, o abre la minimización. Esa segunda carga sí usa fase 1,
              porque hay desigualdades ≥ y variables artificiales. No es el ejemplo de los muebles.
            </li>
            <li>
              Cierra con el uso: producción, inventario y costo, cuando el problema de verdad es
              lineal y las restricciones están completas.
            </li>
          </ol>
        </section>
      </main>
      <footer>
        <p>{credits.university}</p>
        <p>{credits.faculty}</p>
        <p>
          {credits.course}. Docente: {credits.teacher}.
        </p>
        <ul>
          {credits.members.map((member) => (
            <li key={member}>{member}</li>
          ))}
        </ul>
        <p>Los nombres se editan en src/credits.ts.</p>
      </footer>
    </>
  );
}
