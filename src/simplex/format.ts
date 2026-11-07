export function fmt(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10000) / 10000;
  const normal = Object.is(rounded, -0) ? 0 : rounded;
  return String(normal).replace(".", ",");
}

export function parseLoose(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (text === "" || text === "-" || text === "." || text === "-.") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}
