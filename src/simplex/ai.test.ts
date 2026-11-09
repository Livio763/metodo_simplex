import { describe, expect, it } from "vitest";
import { parseProblemFromNaturalText, generateStepExplanation, generateExecutiveReport } from "./ai";
import { solve } from "./engine";
import { realCases } from "./realCases";

describe("asistente IA y lenguaje natural", () => {
  it("interpreta correctamente un problema de maximización desde texto", () => {
    const text = `
      Maximizar Z = 50x1 + 80x2
      1x1 + 2x2 <= 120 (Carpinteria)
      1x1 + 1x2 <= 80 (Acabado)
    `;
    const result = parseProblemFromNaturalText(text);
    expect(result.success).toBe(true);
    expect(result.model).toBeDefined();
    expect(result.model!.sense).toBe("max");
    expect(result.model!.objective).toEqual([50, 80]);
    expect(result.model!.constraints).toHaveLength(2);
    expect(result.model!.constraints[0].rhs).toBe(120);
    expect(result.model!.constraints[1].rhs).toBe(80);
  });

  it("interpreta correctamente un problema de minimización con restricciones >=", () => {
    const text = `
      Minimizar costo Z = 2x1 + 3x2
      3x1 + 2x2 >= 18 (Proteina)
      2x1 + 4x2 >= 24 (Carbohidratos)
      1x1 + 1x2 <= 10 (Grasa)
    `;
    const result = parseProblemFromNaturalText(text);
    expect(result.success).toBe(true);
    expect(result.model!.sense).toBe("min");
    expect(result.model!.constraints[0].rel).toBe(">=");
    expect(result.model!.constraints[2].rel).toBe("<=");
  });

  it("resuelve todos los casos reales sin errores", () => {
    for (const rc of realCases) {
      const res = solve(rc.model);
      expect(res.status).toBe("optimal");
      expect(res.objective).toBeGreaterThan(0);
      expect(res.iterations.length).toBeGreaterThan(0);

      // Verificar que el informe ejecutivo se genere sin excepciones
      const report = generateExecutiveReport(res, rc.model, "fraction");
      expect(report.executiveSummary).toBeDefined();
      expect(report.solutionBreakdown.length).toBeGreaterThan(0);
      expect(report.resourceAnalysis.length).toBe(rc.model.constraints.length);
    }
  });

  it("genera explicaciones didácticas en cada iteración", () => {
    const caseInforme = realCases[0];
    const res = solve(caseInforme.model);
    for (const iter of res.iterations) {
      const explanation = generateStepExplanation(iter, caseInforme.model, "fraction");
      expect(explanation).toBeTruthy();
    }
  });
});

