import { describe, expect, it } from "vitest";
import { formatNumber, gcd, toFraction } from "./fraction";

describe("fraction utilities", () => {
  it("calcula el MCD correctamente", () => {
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(100, 25)).toBe(25);
    expect(gcd(7, 13)).toBe(1);
    expect(gcd(0, 5)).toBe(5);
  });

  it("convierte números flotantes a fracciones irreducibles", () => {
    expect(toFraction(0.5)).toEqual({ numerator: 1, denominator: 2 });
    expect(toFraction(0.75)).toEqual({ numerator: 3, denominator: 4 });
    expect(toFraction(0.25)).toEqual({ numerator: 1, denominator: 4 });
    expect(toFraction(1.5)).toEqual({ numerator: 3, denominator: 2 });
    expect(toFraction(-0.25)).toEqual({ numerator: -1, denominator: 4 });
    expect(toFraction(6)).toEqual({ numerator: 6, denominator: 1 });
    expect(toFraction(0)).toEqual({ numerator: 0, denominator: 1 });
  });

  it("formatea en modo fracción y modo decimal", () => {
    expect(formatNumber(0.5, "fraction")).toBe("1/2");
    expect(formatNumber(0.5, "decimal")).toBe("0,5");
    expect(formatNumber(4, "fraction")).toBe("4");
    expect(formatNumber(4, "decimal")).toBe("4");
    expect(formatNumber(87.5, "fraction")).toBe("175/2");
    expect(formatNumber(-31.25, "fraction")).toBe("-125/4");
  });
});

