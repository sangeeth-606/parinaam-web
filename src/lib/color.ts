/**
 * Mathematical CIE L*a*b* to sRGB Hex converter.
 * Invariant Rule 4: Transparent colourimetry with standard math, zero external ML.
 */

export function labToHex(l: number, a: number, b: number): string {
  // 1. Lab to XYZ (Standard D65 reference illuminant)
  const y = (l + 16) / 116;
  const x = a / 500 + y;
  const z = y - b / 200;

  const x3 = x * x * x;
  const y3 = y * y * y;
  const z3 = z * z * z;

  const xVal = (x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787) * 95.047;
  const yVal = (y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787) * 100.0;
  const zVal = (z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787) * 108.883;

  // 2. XYZ to linear sRGB
  const rLinear = (xVal * 3.2406 + yVal * -1.5372 + zVal * -0.4986) / 100;
  const gLinear = (xVal * -0.9689 + yVal * 1.8758 + zVal * 0.0415) / 100;
  const bLinear = (xVal * 0.0557 + yVal * -0.2040 + zVal * 1.0570) / 100;

  // 3. Gamma companding
  const compand = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const r = Math.round(compand(rLinear) * 255);
  const g = Math.round(compand(gLinear) * 255);
  const bByte = Math.round(compand(bLinear) * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bByte)}`;
}
