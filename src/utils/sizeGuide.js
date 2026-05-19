export const CM_PER_INCH = 2.54;

export const MAX_MEASURE_COLUMNS = 12;
export const DEFAULT_MEASURE_COLUMN_COUNT = 3;

export const FIT_OPTIONS = [
  { value: "slim", label: "Slim" },
  { value: "regular", label: "Regular" },
  { value: "relaxed", label: "Relaxed" },
  { value: "oversized", label: "Oversized" },
];

export const STRETCH_OPTIONS = [
  { value: "rigid", label: "Rigid" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function cmToInch(cm) {
  if (!Number.isFinite(cm)) return NaN;
  return cm / CM_PER_INCH;
}

export function inchToCm(inch) {
  if (!Number.isFinite(inch)) return NaN;
  return inch * CM_PER_INCH;
}

/** Trim trailing zeros / dot ("12.50" → "12.5", "16.00" → "16"); leaves whole numbers like "40" intact. */
function trimDecimalString(s) {
  if (!s.includes(".")) return s;
  const t = s.replace(/0+$/, "").replace(/\.$/, "");
  return t === "" ? "0" : t;
}

/**
 * Format measurement for storefront (values stored as cm in API).
 * - cm: shows saved cm without a forced ".0" on whole numbers.
 * - inch: converts from cm with a clean, stable display (2 decimal places max, trimmed).
 */
export function formatMeasureCm(cm, unit) {
  if (!Number.isFinite(cm)) return "—";
  if (unit === "inch") {
    const inches = cmToInch(cm);
    if (!Number.isFinite(inches)) return "—";
    const x = Math.round(inches * 100) / 100;
    return trimDecimalString(x.toFixed(2));
  }
  const x = Math.round(cm * 1e6) / 1e6;
  return trimDecimalString(x.toFixed(6));
}

export function clampMeasureColumnCount(n) {
  return Math.min(MAX_MEASURE_COLUMNS, Math.max(1, Math.floor(Number(n)) || 1));
}

/** Default header text for column index when admin label is empty. */
export function defaultMeasureLabelForIndex(i) {
  const presets = ["Bust", "Shoulder breadth", "Sleeve length"];
  return presets[i] || `Measure ${i + 1}`;
}

/**
 * How many measurement columns this guide uses (new `measureColumns` / `values`, or legacy 3).
 */
export function resolveMeasureColumnCount(sg) {
  if (!sg || typeof sg !== "object") return DEFAULT_MEASURE_COLUMN_COUNT;
  if (Array.isArray(sg.measureColumns) && sg.measureColumns.length > 0) {
    return clampMeasureColumnCount(sg.measureColumns.length);
  }
  const first = Array.isArray(sg.rows) ? sg.rows[0] : null;
  if (first && Array.isArray(first.values) && first.values.length > 0) {
    return clampMeasureColumnCount(first.values.length);
  }
  return DEFAULT_MEASURE_COLUMN_COUNT;
}

/** Labels for each column (new measureColumns or legacy colLabel*). */
export function resolveMeasureColumnLabelsForDisplay(sg) {
  const n = resolveMeasureColumnCount(sg);
  const legacy = [
    String(sg?.colLabelBust ?? "").trim(),
    String(sg?.colLabelShoulder ?? "").trim(),
    String(sg?.colLabelSleeve ?? "").trim(),
  ];
  const out = [];
  for (let i = 0; i < n; i++) {
    const fromNew = String(sg?.measureColumns?.[i] ?? "").trim();
    if (fromNew) out.push(fromNew);
    else if (i < 3 && legacy[i]) out.push(legacy[i]);
    else out.push("");
  }
  return out;
}

export function hasSizeGuideContent(sg) {
  if (!sg || typeof sg !== "object") return false;
  if (!Array.isArray(sg.rows) || sg.rows.length === 0) return false;
  return sg.rows.some((r) => {
    if (!r || typeof r !== "object") return false;
    if (String(r.sizeLabel || "").trim()) return true;
    if (Array.isArray(r.values)) {
      // Treat all-zero rows as "no real size guide" (common placeholder in admin data).
      return r.values.some((v) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0;
      });
    }
    return (
      (Number.isFinite(Number(r.bust)) && Number(r.bust) > 0) ||
      (Number.isFinite(Number(r.shoulder)) && Number(r.shoulder) > 0) ||
      (Number.isFinite(Number(r.sleeve)) && Number(r.sleeve) > 0)
    );
  });
}

/**
 * Build storefront table header: custom admin text or default, plus (cm) / (inch).
 */
export function formatMeasureColumnHeader(customLabel, defaultBase, unit) {
  const u = unit === "inch" ? "inch" : "cm";
  const base = String(customLabel || "").trim() || defaultBase;
  return `${base} (${u})`;
}

export function emptySizeGuideFormRow(colCount) {
  const n = clampMeasureColumnCount(colCount);
  return { sizeLabel: "", values: Array.from({ length: n }, () => "") };
}

/** Store & display size column in caps (e.g. XS, M). */
export function normalizeSizeLabel(raw) {
  return String(raw ?? "").trim().toUpperCase();
}

/** Convert API row (cm) to form strings for admin display unit. */
export function rowCmToForm(row, unit, colCount) {
  const n = clampMeasureColumnCount(colCount);
  const fromCm = (cm) => {
    if (!Number.isFinite(Number(cm))) return "";
    const num = Number(cm);
    const v = unit === "inch" ? cmToInch(num) : num;
    const rounded = Math.round(v * 100) / 100;
    return String(rounded);
  };
  const values = [];
  if (Array.isArray(row?.values) && row.values.length > 0) {
    for (let i = 0; i < n; i++) {
      values.push(fromCm(row.values[i]));
    }
  } else {
    const legacy = [row?.bust, row?.shoulder, row?.sleeve];
    for (let i = 0; i < n; i++) {
      values.push(fromCm(legacy[i]));
    }
  }
  return {
    sizeLabel: normalizeSizeLabel(row?.sizeLabel),
    values,
  };
}

/** Build API payload rows from admin form (strings → cm). */
export function convertFormRowsUnit(rows, fromUnit, toUnit) {
  if (fromUnit === toUnit) return Array.isArray(rows) ? rows : [];
  const convertField = (raw) => {
    const s = String(raw ?? "").trim();
    if (!s) return "";
    const num = parseFloat(s.replace(/,/g, ""));
    if (!Number.isFinite(num)) return s;
    if (fromUnit === "cm" && toUnit === "inch") {
      return String(Math.round((num / CM_PER_INCH) * 100) / 100);
    }
    if (fromUnit === "inch" && toUnit === "cm") {
      return String(Math.round(num * CM_PER_INCH * 100) / 100);
    }
    return s;
  };
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    sizeLabel: normalizeSizeLabel(r?.sizeLabel),
    values: Array.isArray(r.values)
      ? r.values.map((cell) => convertField(cell))
      : [],
  }));
}

export function formRowsToCmRows(rows, unit) {
  const u = unit === "inch" ? "inch" : "cm";
  const toCm = (raw) => {
    const n = parseFloat(String(raw ?? "").replace(/,/g, ""));
    if (!Number.isFinite(n)) return null;
    return u === "inch" ? inchToCm(n) : n;
  };
  return (Array.isArray(rows) ? rows : []).map((r) => {
    const sizeLabel = normalizeSizeLabel(r?.sizeLabel);
    const rawVals = Array.isArray(r.values) ? r.values : [];
    const values = rawVals.map((cell) => {
      const cm = toCm(cell);
      return cm != null && Number.isFinite(cm) ? cm : null;
    });
    return { sizeLabel, values };
  });
}

/** Per-cell cm for storefront (legacy bust/shoulder/sleeve or `values`). */
export function rowCmValuesForDisplay(row, colCount) {
  const n = clampMeasureColumnCount(colCount);
  const out = [];
  if (Array.isArray(row?.values) && row.values.length > 0) {
    for (let i = 0; i < n; i++) {
      const v = Number(row.values[i]);
      out.push(Number.isFinite(v) ? v : NaN);
    }
    return out;
  }
  const legacy = [row?.bust, row?.shoulder, row?.sleeve];
  for (let i = 0; i < n; i++) {
    const v = Number(legacy[i]);
    out.push(Number.isFinite(v) ? v : NaN);
  }
  return out;
}
