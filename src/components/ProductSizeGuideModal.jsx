import React, { useState, useMemo } from "react";
import {
  FIT_OPTIONS,
  STRETCH_OPTIONS,
  defaultMeasureLabelForIndex,
  formatMeasureCm,
  formatMeasureColumnHeader,
  hasSizeGuideContent,
  resolveMeasureColumnLabelsForDisplay,
  rowCmValuesForDisplay,
} from "../utils/sizeGuide";

const barWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginBottom: 22,
};

const track = {
  position: "relative",
  height: 8,
  borderRadius: 999,
  background: "#e5e7eb",
  overflow: "hidden",
};

function SelectionBar({ options, value }) {
  const idx = options.findIndex((o) => o.value === value);
  if (idx < 0) {
    return <div style={{ ...track, minHeight: 8 }} />;
  }
  const n = options.length || 1;
  const segW = 100 / n;
  const left = `${idx * segW}%`;
  const width = `${segW}%`;

  return (
    <div style={track}>
      <div
        style={{
          position: "absolute",
          left,
          top: 0,
          bottom: 0,
          width,
          background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
          borderRadius: 999,
          transition: "left 0.2s ease, width 0.2s ease",
        }}
      />
    </div>
  );
}

export default function ProductSizeGuideModal({
  isOpen,
  onClose,
  title = "",
  sizeGuide,
}) {
  const [unit, setUnit] = useState("inch");

  const ok = useMemo(
    () => isOpen && hasSizeGuideContent(sizeGuide),
    [isOpen, sizeGuide],
  );

  if (!ok) return null;

  const headingText = String(title || "").trim();
  const ariaLabel = headingText || "Size measurements";

  const fit = String(sizeGuide.fitType || "").trim();
  const stretch = String(sizeGuide.stretchability || "").trim();
  const rows = Array.isArray(sizeGuide.rows) ? sizeGuide.rows : [];
  const measureLabels = resolveMeasureColumnLabelsForDisplay(sizeGuide);
  const colCount = measureLabels.length;
  const columnHeaders = measureLabels.map((lab, i) =>
    formatMeasureColumnHeader(lab, defaultMeasureLabelForIndex(i), unit),
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "min(520px, 100%)",
          maxHeight: "min(92vh, 900px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 18px",
            borderBottom: "1px solid #f3f4f6",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {headingText ? (
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                  letterSpacing: "-0.02em",
                }}
              >
                {headingText}
              </h2>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "#f3f4f6",
              color: "#374151",
              width: 40,
              height: 40,
              borderRadius: "50%",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            overflow: "auto",
            padding: "18px 18px 22px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {fit ? (
            <div style={barWrap}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                Fit Type
              </div>
              <SelectionBar options={FIT_OPTIONS} value={fit} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 12,
                  color: "#6b7280",
                  flexWrap: "wrap",
                }}
              >
                {FIT_OPTIONS.map((o) => (
                  <span
                    key={o.value}
                    style={{
                      fontWeight: o.value === fit ? 700 : 500,
                      color: o.value === fit ? "#111827" : "#9ca3af",
                      flex: "1 1 auto",
                      textAlign: "center",
                      minWidth: 56,
                    }}
                  >
                    {o.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {stretch ? (
            <div style={barWrap}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                Stretchability
              </div>
              <SelectionBar options={STRETCH_OPTIONS} value={stretch} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 12,
                  color: "#6b7280",
                  flexWrap: "wrap",
                }}
              >
                {STRETCH_OPTIONS.map((o) => (
                  <span
                    key={o.value}
                    style={{
                      fontWeight: o.value === stretch ? 700 : 500,
                      color: o.value === stretch ? "#111827" : "#9ca3af",
                      flex: "1 1 auto",
                      textAlign: "center",
                      minWidth: 72,
                    }}
                  >
                    {o.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {rows.length > 0 ? (
            <div>
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
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                  Product Size
                </span>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  <span style={{ opacity: unit === "cm" ? 1 : 0.45 }}>cm</span>
                  <button
                    type="button"
                    onClick={() => setUnit((u) => (u === "cm" ? "inch" : "cm"))}
                    aria-pressed={unit === "inch"}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 999,
                      border: "none",
                      background: unit === "inch" ? "#111827" : "#e5e7eb",
                      position: "relative",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: unit === "inch" ? 26 : 3,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                        transition: "left 0.2s ease",
                      }}
                    />
                  </button>
                  <span style={{ opacity: unit === "inch" ? 1 : 0.45 }}>inch</span>
                </div>
              </div>

              <div style={{ overflowX: "auto", margin: "0 -4px" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 360,
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          fontWeight: 700,
                          color: "#374151",
                        }}
                      >
                        Size
                      </th>
                      {columnHeaders.map((h, hi) => (
                        <th
                          key={hi}
                          style={{
                            textAlign: "center",
                            padding: "10px 8px",
                            border: "1px solid #e5e7eb",
                            fontWeight: 600,
                            color: "#4b5563",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`${r.sizeLabel || "r"}-${i}`}>
                        <td
                          style={{
                            padding: "10px 12px",
                            border: "1px solid #e5e7eb",
                            background: "#f9fafb",
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {r.sizeLabel || "—"}
                        </td>
                        {rowCmValuesForDisplay(r, colCount).map((cm, j) => (
                          <td
                            key={j}
                            style={{
                              textAlign: "center",
                              padding: "10px 8px",
                              border: "1px solid #e5e7eb",
                              color: "#374151",
                            }}
                          >
                            {formatMeasureCm(cm, unit)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {!fit && !stretch && rows.length === 0 ? (
            <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
              No size measurements added for this product.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
