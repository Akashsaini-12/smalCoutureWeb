import React from "react";
import {
  DEFAULT_MEASURE_COLUMN_COUNT,
  FIT_OPTIONS,
  MAX_MEASURE_COLUMNS,
  STRETCH_OPTIONS,
  defaultMeasureLabelForIndex,
  emptySizeGuideFormRow,
  normalizeSizeLabel,
} from "../../utils/sizeGuide";

const section = {
  marginBottom: 14,
};

const label = {
  fontWeight: 700,
  fontSize: 14,
  marginBottom: 10,
  color: "var(--text, #111)",
};

const barTrack = {
  position: "relative",
  height: 8,
  borderRadius: 999,
  background: "#e5e7eb",
  marginBottom: 8,
};

function FitStretchBar({ options, value, onSelect }) {
  return (
    <div style={barTrack}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${options.length}, 1fr)`,
          gap: 0,
          height: "100%",
        }}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onSelect(o.value)}
            title={o.label}
            style={{
              border: "none",
              background:
                value === o.value
                  ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                  : "transparent",
              cursor: "pointer",
              borderRadius: 999,
              minHeight: 8,
              padding: 0,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 11,
          color: "var(--muted, #666)",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        {options.map((o) => (
          <span
            key={o.value}
            style={{
              fontWeight: value === o.value ? 800 : 500,
              color: value === o.value ? "var(--text, #111)" : "var(--muted)",
              flex: "1 1 auto",
              textAlign: "center",
              minWidth: 52,
            }}
          >
            {o.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminSizeGuideEditor({
  fitType,
  stretchability,
  measureColumns,
  rows,
  inputUnit,
  onMeasureColumnsChange,
  onFitChange,
  onStretchChange,
  onRowsChange,
  onInputUnitChange,
}) {
  const cols =
    Array.isArray(measureColumns) && measureColumns.length
      ? measureColumns
      : Array.from({ length: DEFAULT_MEASURE_COLUMN_COUNT }, () => "");

  const safeRows =
    Array.isArray(rows) && rows.length
      ? rows
      : [emptySizeGuideFormRow(cols.length)];

  const setRow = (idx, patch) => {
    const next = safeRows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onRowsChange(next);
  };

  const addRow = () => {
    onRowsChange([...safeRows, emptySizeGuideFormRow(cols.length)]);
  };

  const removeRow = (idx) => {
    if (safeRows.length <= 1) {
      onRowsChange([emptySizeGuideFormRow(cols.length)]);
      return;
    }
    onRowsChange(safeRows.filter((_, i) => i !== idx));
  };

  const unitLabel = inputUnit === "inch" ? "inch" : "cm";

  const setColumnHeading = (i, text) => {
    const next = cols.map((c, j) => (j === i ? text : c));
    onMeasureColumnsChange(next);
  };

  const addColumn = () => {
    if (cols.length >= MAX_MEASURE_COLUMNS) return;
    onMeasureColumnsChange([...cols, ""]);
  };

  const removeLastColumn = () => {
    if (cols.length <= 1) return;
    onMeasureColumnsChange(cols.slice(0, -1));
  };

  return (
    <div>
      <div style={section}>
        <div style={label}>Fit Type</div>
        <FitStretchBar
          options={FIT_OPTIONS}
          value={fitType || ""}
          onSelect={onFitChange}
        />
      </div>

      <div style={section}>
        <div style={label}>Stretchability</div>
        <FitStretchBar
          options={STRETCH_OPTIONS}
          value={stretchability || ""}
          onSelect={onStretchChange}
        />
      </div>

      <div style={{ ...section, marginBottom: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={label}>Product measurements</div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span style={{ opacity: inputUnit === "cm" ? 1 : 0.45 }}>cm</span>
            <button
              type="button"
              onClick={() =>
                onInputUnitChange(inputUnit === "cm" ? "inch" : "cm")
              }
              aria-label="Toggle cm or inch"
              style={{
                width: 48,
                height: 26,
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: inputUnit === "inch" ? "#111" : "#e5e7eb",
                position: "relative",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: inputUnit === "inch" ? 26 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s ease",
                }}
              />
            </button>
            <span style={{ opacity: inputUnit === "inch" ? 1 : 0.45 }}>inch</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: "6px 12px", fontSize: 13 }}
            onClick={addColumn}
            disabled={cols.length >= MAX_MEASURE_COLUMNS}
            title={
              cols.length >= MAX_MEASURE_COLUMNS
                ? `Maximum ${MAX_MEASURE_COLUMNS} columns`
                : "Add a measurement column"
            }
          >
            + Add column
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: "6px 12px", fontSize: 13 }}
            onClick={removeLastColumn}
            disabled={cols.length <= 1}
            title="Remove the last measurement column"
          >
            Remove column
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {cols.map((heading, i) => (
            <div className="form-group" style={{ marginBottom: 0 }} key={i}>
              <label className="form-label" style={{ fontSize: 12 }}>
                Column {i + 1}
              </label>
              <input
                className="form-input"
                value={heading}
                onChange={(e) => setColumnHeading(i, e.target.value)}
                placeholder={defaultMeasureLabelForIndex(i)}
                style={{ padding: "8px 10px", fontSize: 13 }}
              />
            </div>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 420,
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: "var(--surface, #f9fafb)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  Size
                </th>
                {cols.map((h, ci) => (
                  <th
                    key={ci}
                    style={{
                      textAlign: "center",
                      padding: "8px 6px",
                      border: "1px solid var(--border)",
                      minWidth: 72,
                    }}
                  >
                    {String(h || "").trim() || defaultMeasureLabelForIndex(ci)} (
                    {unitLabel})
                  </th>
                ))}
                <th
                  style={{
                    width: 72,
                    border: "1px solid var(--border)",
                  }}
                />
              </tr>
            </thead>
            <tbody>
              {safeRows.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 6, border: "1px solid var(--border)" }}>
                    <input
                      className="form-input"
                      value={r.sizeLabel}
                      onChange={(e) =>
                        setRow(idx, {
                          sizeLabel: normalizeSizeLabel(e.target.value),
                        })
                      }
                      placeholder="XS"
                      autoCapitalize="characters"
                      style={{
                        padding: "8px 10px",
                        width: "100%",
                        minWidth: 0,
                        textTransform: "uppercase",
                      }}
                    />
                  </td>
                  {cols.map((_, ci) => (
                    <td
                      key={ci}
                      style={{ padding: 6, border: "1px solid var(--border)" }}
                    >
                      <input
                        className="form-input"
                        type="text"
                        inputMode="decimal"
                        value={
                          Array.isArray(r.values) ? r.values[ci] ?? "" : ""
                        }
                        onChange={(e) => {
                          const nextVals = cols.map((__, j) =>
                            j === ci
                              ? e.target.value
                              : Array.isArray(r.values)
                                ? r.values[j] ?? ""
                                : "",
                          );
                          setRow(idx, { values: nextVals });
                        }}
                        placeholder="—"
                        style={{
                          padding: "8px 10px",
                          width: "100%",
                          minWidth: 0,
                        }}
                      />
                    </td>
                  ))}
                  <td
                    style={{
                      padding: 6,
                      border: "1px solid var(--border)",
                      textAlign: "center",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      onClick={() => removeRow(idx)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 10 }}
          onClick={addRow}
        >
          + Add size row
        </button>
      </div>
    </div>
  );
}
