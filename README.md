# SimplexAI · Calculadora Inteligente del Método Simplex

Calculadora moderna e interactiva del **Método Simplex Primal** y del **Método de las Dos Fases** (para restricciones $\ge$, $\le$ e $=$). Diseñada como una Single Page Application (SPA) para docencia, investigación de operaciones y aplicaciones profesionales en la industria.

---

## ✨ Características Principales

1. **Flujo de Calculadora sin scroll de diapositivas:**
   * **Vista 1 (Configuración & IA):** Ingreso ágil de función objetivo, variables personalizadas y restricciones con relaciones $\le, \ge, =$.
   * **Vista 2 (Iteraciones Paso a Paso):** Visualización de las matrices simplex iteración por iteración con botones de avance (`⏮ Inicio`, `◀ Anterior`, `Siguiente ▶`, `Fin ⏭`, `▶ Auto-play`).
   * **Vista 3 (Informe & Sensibilidad):** Reporte ejecutivo de resultados, precios sombra (duales), holguras y recomendaciones estratégicas de negocio. Imprimible directamente a PDF.

2. **Demostración Matemática Completa:**
   * **Resaltado de Elementos:** Columna de la variable entrante, fila de la variable saliente y celda pivote identificadas visualmente.
   * **Prueba del Cociente Mínimo ($\theta$):** Muestra el cociente solución/pivote y destaca el valor mínimo limitante.
   * **Operaciones Elementales de Fila (Gauss-Jordan):** Fórmulas algebraicas explícitas aplicadas a cada renglón ($R_p \leftarrow R_p / \text{pivote}$, $R_i \leftarrow R_i - k \cdot R_p$).
   * **Visualización en Fracciones o Decimales:** Alternancia en un clic entre fracciones exactas ($3/4, 125/2$) y decimales ($0,75$).
   * **Gráfico 2D Interactivo:** Polígono factible, curvas de nivel de $Z$ y trayectoria de vértices visitados en cada iteración.

3. **Inteligencia Artificial y Casos Reales:**
   * **Asistente de Lenguaje Natural:** Escribe un problema cotidiano o de examen en español y la IA extraerá las variables, el objetivo y las restricciones automáticamente.
   * **Tutor Didáctico en Vivo:** En cada iteración explica pedagógicamente la razón económica y geométrica del pivote.
   * **Biblioteca de Casos Reales:** Plantillas preconfiguradas para Manufactura de Muebles, Dieta de Stigler (Dos Fases), Despacho de Transporte/Logística, Portafolios Financieros y el Caso Base del Informe.

---

## 🚀 Cómo Correr el Proyecto

Requiere **Node.js 20** o superior.

```bash
cd metodo-simplex
npm install
npm run dev
```

Abre en tu navegador: [http://127.0.0.1:5173](http://127.0.0.1:5173)

### Pruebas Unitarias

El proyecto cuenta con suite completa de pruebas automáticas con Vitest:

```bash
npm test
```

### Compilación para Producción

```bash
npm run build
```
