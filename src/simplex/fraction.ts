/**
 * Utilidades para manejo y formateo de números en forma fraccionaria o decimal.
 * Utiliza el método de fracciones continuas para aproximar con precisión flotantes a razones enteras.
 */

export interface Fraction {
  numerator: number;
  denominator: number;
}

/**
 * Calcula el Máximo Común Divisor usando el algoritmo de Euclides.
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y > 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * Convierte un número flotante a una fracción irreducible simplificada.
 * Tolera pequeñas imprecisiones de punto flotante de IEEE-754.
 */
export function toFraction(value: number, tolerance = 1e-6, maxDenominator = 10000): Fraction {
  if (!Number.isFinite(value)) {
    return { numerator: 0, denominator: 1 };
  }
  if (Math.abs(value) < tolerance) {
    return { numerator: 0, denominator: 1 };
  }

  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);

  // Si ya es prácticamente un entero
  if (Math.abs(x - Math.round(x)) < tolerance) {
    return { numerator: sign * Math.round(x), denominator: 1 };
  }

  // Algoritmo de fracciones continuas
  let h1 = 1, h2 = 0;
  let k1 = 0, k2 = 1;
  let b = x;

  do {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;

    if (k1 > maxDenominator) break;

    const currentDiff = Math.abs(x - h1 / k1);
    if (currentDiff < tolerance) break;

    const fracPart = b - a;
    if (fracPart < 1e-12) break;
    b = 1 / fracPart;
  } while (Math.abs(x - h1 / k1) > tolerance && k1 <= maxDenominator);

  const divisor = gcd(h1, k1);
  return {
    numerator: sign * Math.round(h1 / divisor),
    denominator: Math.round(k1 / divisor),
  };
}

export type NumberDisplayMode = "fraction" | "decimal";

/**
 * Formatea un número como fracción o como decimal según el modo especificado.
 */
export function formatNumber(
  value: number,
  mode: NumberDisplayMode = "fraction",
  decimalDigits = 3,
): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) < 1e-8) return "0";

  if (mode === "decimal") {
    const rounded = Math.round(value * Math.pow(10, decimalDigits)) / Math.pow(10, decimalDigits);
    const normalized = Object.is(rounded, -0) ? 0 : rounded;
    return String(normalized).replace(".", ",");
  }

  // Modo fracción
  const frac = toFraction(value);
  if (frac.denominator === 1) {
    return `${frac.numerator}`;
  }
  return `${frac.numerator}/${frac.denominator}`;
}

