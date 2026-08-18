// Utilities to convert between Latin (0-9) and Bangla (০-৯) digits.

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const EN_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function fromBanglaDigits(input: string): string {
  return String(input).replace(/[০-৯]/g, (d) => EN_DIGITS[BN_DIGITS.indexOf(d)]);
}

/** Renders a serial number padded to `width` digits, in Bangla numerals. e.g. 1 -> ০১ */
export function banglaSerial(num: number, width = 2): string {
  const padded = String(num).padStart(width, "0");
  return toBanglaDigits(padded);
}

export function toBanglaNumber(num: number): string {
  return toBanglaDigits(String(num));
}

export const SUB_QUESTION_LABELS = ["ক", "খ", "গ", "ঘ"] as const;

export function optionLabel(index: number, style: string): string {
  const letters = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
  const letter = letters[index] ?? String(index + 1);
  switch (style) {
    case "circle":
      return "○";
    case "paren":
      return `(${letter})`;
    case "dot":
      return `${letter}.`;
    case "bracket":
      return `${letter})`;
    default:
      return `${letter}.`;
  }
}
