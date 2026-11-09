import type { LinearModel } from "./types";

export interface RealCase {
  id: string;
  title: string;
  category: "Manufactura" | "Nutrición" | "Finanzas" | "Logística" | "Académico";
  description: string;
  realWorldContext: string;
  model: LinearModel;
}

export const realCases: RealCase[] = [
  {
    id: "informe-mat205",
    title: "Caso Informe MAT 205-SC (Base)",
    category: "Académico",
    description: "Modelo original de las diapositivas y el informe de clase.",
    realWorldContext:
      "Problema del curso con dos productos y dos restricciones de capacidad. Sirve para contrastar directamente con las láminas del informe.",
    model: {
      sense: "max",
      variableNames: ["x1", "x2"],
      objective: [100, 125],
      constraints: [
        { name: "Capacidad de Maquinado", coef: [6, 4], rel: "<=", rhs: 24 },
        { name: "Almacenamiento Total", coef: [1, 1], rel: "<=", rhs: 800 },
      ],
    },
  },
  {
    id: "muebles-produccion",
    title: "Optimización de Fábrica de Muebles",
    category: "Manufactura",
    description: "Determinar cuántas mesas y sillas fabricar para maximizar las utilidades netas.",
    realWorldContext:
      "Una carpintería produce Mesas (ganancia: $80) y Sillas (ganancia: $50). Dispone de 120 horas de corte y ensamble, 80 horas de barnizado y acabado, y el mercado absorbe como máximo 60 sillas al mes.",
    model: {
      sense: "max",
      variableNames: ["Sillas (x1)", "Mesas (x2)"],
      objective: [50, 80],
      constraints: [
        { name: "Horas Corte y Ensamble", coef: [1, 2], rel: "<=", rhs: 120 },
        { name: "Horas Barnizado y Acabado", coef: [1, 1], rel: "<=", rhs: 80 },
        { name: "Demanda Máxima de Sillas", coef: [1, 0], rel: "<=", rhs: 60 },
      ],
    },
  },
  {
    id: "dieta-stigler",
    title: "Dieta Nutricional al Mínimo Costo",
    category: "Nutrición",
    description: "Cubrir requerimientos nutricionales mínimos al menor costo posible (Dos Fases).",
    realWorldContext:
      "Un hospital o criadero prepara raciones combinando Alimento A ($2/kg) y Alimento B ($3/kg). Se exige un mínimo de 18 unidades de proteínas, 24 de carbohidratos, y un tope máximo de 10 kg en grasas.",
    model: {
      sense: "min",
      variableNames: ["Alimento A (x1)", "Alimento B (x2)"],
      objective: [2, 3],
      constraints: [
        { name: "Requerimiento Mínimo de Proteínas", coef: [3, 2], rel: ">=", rhs: 18 },
        { name: "Requerimiento Mínimo de Carbohidratos", coef: [2, 4], rel: ">=", rhs: 24 },
        { name: "Límite Máximo de Grasas", coef: [1, 1], rel: "<=", rhs: 10 },
      ],
    },
  },
  {
    id: "logistica-transporte",
    title: "Despacho y Flota de Distribución",
    category: "Logística",
    description: "Maximizar volumen de carga transportada con flota de camiones limitada.",
    realWorldContext:
      "Una empresa de transporte dispone de Camiones Tipo 1 (capacidad 30 m³, costo combustible $20) y Camiones Tipo 2 (capacidad 50 m³, costo combustible $30). Tiene un presupuesto de $600 y un tope de 25 conductores.",
    model: {
      sense: "max",
      variableNames: ["Camión Peq (x1)", "Camión Gde (x2)"],
      objective: [30, 50],
      constraints: [
        { name: "Presupuesto de Combustible ($)", coef: [20, 30], rel: "<=", rhs: 600 },
        { name: "Disponibilidad de Conductores", coef: [1, 1], rel: "<=", rhs: 25 },
      ],
    },
  },
  {
    id: "finanzas-portafolio",
    title: "Asignación Óptima de Portafolio Financiero",
    category: "Finanzas",
    description: "Maximizar el rendimiento anual de una cartera con restricciones de diversificación.",
    realWorldContext:
      "Un inversionista dispone de $50,000 para invertir entre Bonos de Renta Fija (retorno 8%) y Acciones Tecnológicas (retorno 14%). Por política de riesgo, no puede invertir más de $20,000 en acciones y debe colocar al menos $15,000 en bonos.",
    model: {
      sense: "max",
      variableNames: ["Bonos (x1)", "Acciones (x2)"],
      objective: [0.08, 0.14],
      constraints: [
        { name: "Capital Total Disponible ($)", coef: [1, 1], rel: "<=", rhs: 50000 },
        { name: "Tope Máximo en Acciones (Riesgo)", coef: [0, 1], rel: "<=", rhs: 20000 },
        { name: "Inversión Mínima en Bonos", coef: [1, 0], rel: ">=", rhs: 15000 },
      ],
    },
  },
];

