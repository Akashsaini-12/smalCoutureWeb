import React, { useEffect, useRef, useState, useCallback } from "react";
import FilterAccordionSection from "./FilterAccordionSection";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCatalogProductFilters } from "../redux/actions";

/* ─── Dual-handle price range slider ───────────────────────────────── */
function PriceRangeSlider({ min, max, value, onChange, onCommit, hasClear, onClear }) {
  const [lo, setLo] = useState(value[0]);
  const [hi, setHi] = useState(value[1]);
  const [loText, setLoText] = useState(String(value[0]));
  const [hiText, setHiText] = useState(String(value[1]));

  // Sync when URL params change externally
  useEffect(() => {
    setLo(value[0]);
    setHi(value[1]);
    setLoText(String(value[0]));
    setHiText(String(value[1]));
  }, [value[0], value[1]]);

  const pct = (v) => ((v - min) / (max - min)) * 100;

  const handleLo = (e) => {
    const v = Math.min(Number(e.target.value), hi - 1);
    setLo(v);
    setLoText(String(v));
    onChange([v, hi]);
  };
  const handleHi = (e) => {
    const v = Math.max(Number(e.target.value), lo + 1);
    setHi(v);
    setHiText(String(v));
    onChange([lo, v]);
  };
  const commit = () => {
    const clamp = (n, a, b) => Math.min(Math.max(n, a), b);
    const loNumRaw =
      loText.trim() === "" ? lo : Number.parseInt(loText, 10);
    const hiNumRaw =
      hiText.trim() === "" ? hi : Number.parseInt(hiText, 10);
    let nextLo = Number.isFinite(loNumRaw) ? loNumRaw : lo;
    let nextHi = Number.isFinite(hiNumRaw) ? hiNumRaw : hi;

    nextLo = clamp(nextLo, min, max);
    nextHi = clamp(nextHi, min, max);

    // Ensure separation
    if (nextLo >= nextHi) {
      if (nextLo >= max) nextLo = Math.max(min, nextHi - 1);
      else nextHi = Math.min(max, nextLo + 1);
    }

    setLo(nextLo);
    setHi(nextHi);
    setLoText(String(nextLo));
    setHiText(String(nextHi));
    onChange([nextLo, nextHi]);
    onCommit([nextLo, nextHi]);
  };

  return (
    <div style={{ padding: "8px 2px 4px" }}>
      <style>{`
        .cf-range-wrap { position: relative; height: 28px; margin: 8px 0 16px; }
        .cf-range-track {
          position: absolute; top: 50%; left: 0; right: 0;
          height: 4px; background: #e5e5e5; border-radius: 2px;
          transform: translateY(-50%);
        }
        .cf-range-fill {
          position: absolute; top: 50%; height: 4px; background: #1a1a1a;
          border-radius: 2px; transform: translateY(-50%); pointer-events: none;
        }
        .cf-range-input {
          position: absolute; top: 50%; width: 100%;
          -webkit-appearance: none; appearance: none;
          height: 4px; background: transparent; outline: none;
          transform: translateY(-50%); pointer-events: none;
          margin: 0; padding: 0;
        }
        .cf-range-input::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #1a1a1a; cursor: pointer;
          pointer-events: all; border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: transform 0.1s;
        }
        .cf-range-input::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .cf-range-input::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #1a1a1a; cursor: pointer;
          pointer-events: all; border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        }
        .cf-range-vals {
          display: flex; justify-content: space-between;
          gap: 8px; margin-bottom: 10px;
        }
        .cf-range-val-box {
          flex: 1; display: flex; align-items: center; gap: 4px;
          border: 1px solid #e0e0e0; border-radius: 4px; padding: 5px 8px;
          font-size: 12.5px; background: #fff;
        }
        .cf-range-val-box span { color: #999; font-size: 11px; }
        .cf-range-val-box input {
          border: none; outline: none; width: 100%;
          font-size: 12.5px; padding: 0; background: transparent;
        }
      `}</style>

      {/* Value boxes */}
      <div className="cf-range-vals">
        <div className="cf-range-val-box">
          <span>₹</span>
          <input
            type="text"
            inputMode="numeric"
            value={loText}
            onChange={(e) => {
              const raw = String(e.target.value || "");
              // Allow clearing/backspacing while typing
              if (raw === "") {
                setLoText("");
                return;
              }
              // Digits only
              if (!/^\d+$/.test(raw)) return;
              setLoText(raw);
              const n = Number.parseInt(raw, 10);
              if (!Number.isFinite(n)) return;
              const v = Math.min(n, hi - 1);
              setLo(v);
              onChange([v, hi]);
            }}
            onBlur={commit}
          />
        </div>
        <div style={{ alignSelf: "center", color: "#bbb", fontSize: 14 }}>To</div>
        <div className="cf-range-val-box">
          <span>₹</span>
          <input
            type="text"
            inputMode="numeric"
            value={hiText}
            onChange={(e) => {
              const raw = String(e.target.value || "");
              if (raw === "") {
                setHiText("");
                return;
              }
              if (!/^\d+$/.test(raw)) return;
              setHiText(raw);
              const n = Number.parseInt(raw, 10);
              if (!Number.isFinite(n)) return;
              const v = Math.max(n, lo + 1);
              setHi(v);
              onChange([lo, v]);
            }}
            onBlur={commit}
          />
        </div>
      </div>

      {/* Dual slider */}
      <div className="cf-range-wrap">
        <div className="cf-range-track" />
        <div
          className="cf-range-fill"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input type="range" className="cf-range-input" min={min} max={max} value={lo}
          onChange={handleLo} onMouseUp={commit} onTouchEnd={commit} />
        <input type="range" className="cf-range-input" min={min} max={max} value={hi}
          onChange={handleHi} onMouseUp={commit} onTouchEnd={commit} />
      </div>

      {hasClear && (
        <button type="button" onClick={onClear}
          style={{ marginTop: 6, fontSize: 11.5, background: "none", border: "none", cursor: "pointer", color: "#aaa", textDecoration: "underline", padding: 0, display: "block" }}>
          Clear price
        </button>
      )}
    </div>
  );
}

/* ─── Skeleton row ──────────────────────────────────────────────────── */
function SkeletonRows({ n = 4 }) {
  return Array.from({ length: n }).map((_, i) => (
    <li key={i} style={{ padding: "7px 0", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 16, height: 16, borderRadius: 3, background: "#e8e8e8", display: "inline-block", flexShrink: 0, animation: "cfPulse 1.4s ease infinite", animationDelay: `${i * 0.12}s` }} />
      <span style={{ height: 12, borderRadius: 6, background: "#e8e8e8", width: `${55 + (i % 3) * 15}%`, display: "inline-block", animation: "cfPulse 1.4s ease infinite", animationDelay: `${i * 0.12 + 0.1}s` }} />
    </li>
  ));
}

export default function CollectionFilters({ showMobileFooter = false, onCloseMobile = null }) {
  const [openSections, setOpenSections] = useState({
    availability: true, productType: false, price: true, color: true, size: true, brand: false,
  });
  const toggle = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterData, setFilterData] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);

  const formRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  // Read both plural and legacy singular keys so UI always reflects the URL.
  const activeColors       = (params.get("colors")       || params.get("color")  || "").split(",").map(v => v.trim()).filter(Boolean);
  const activeSizes        = (params.get("sizes")        || params.get("size")   || "").split(",").map(v => v.trim()).filter(Boolean);
  const activeBrands       = (params.get("brands")       || params.get("brand")  || "").split(",").map(v => v.trim()).filter(Boolean);
  const activeAvailability = (params.get("availability") || "").split(",").map(v => v.trim()).filter(Boolean);
  const activeMulticolor   = String(params.get("multicolor") || "").trim().toLowerCase() === "true";

  // Only use categories that are explicitly in the URL — never from sessionStorage nav hints.
  const activeCategories = (
    params.get("category") ||
    params.get("categoryId") ||
    ""
  )
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

  const updateSearchParams = useCallback((updater) => {
    const p = new URLSearchParams(location.search);
    updater(p);
    p.delete("page");
    // Clear the one-time nav hint whenever filters are updated.
    try { sessionStorage.removeItem("navCategoryIds"); } catch {}
    const search = p.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: false, state: location.state ?? null },
    );
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setMinPrice(p.get("minPrice") || "");
    setMaxPrice(p.get("maxPrice") || "");
  }, [location.search]);

  useEffect(() => {
    const fetchFilters = async () => {
      setFilterLoading(true);
      try {
        const p = new URLSearchParams(location.search);
        const multi = String(p.get("multicolor") || "").trim().toLowerCase() === "true";

        // FIX: Only pass categoryId to the API when it is EXPLICITLY in the URL.
        // Never use sessionStorage nav hints here — they cause categoryId to leak
        // into API payloads when the user selects color, availability, size, or brand.
        const hasCategoryInUrl = !!(p.get("category") || p.get("categoryId"));
        const cat = hasCategoryInUrl
          ? (p.get("category") || p.get("categoryId") || "")
          : "";

        const minP = p.get("minPrice") || "";
        const maxP = p.get("maxPrice") || "";
        const avail = p.get("availability") || "";
        const colors = p.get("colors") || p.get("color") || "";
        const sizes = p.get("sizes") || p.get("size") || "";
        const brands = p.get("brands") || p.get("brand") || "";

        const data = await fetchCatalogProductFilters({
          categoryId: cat || undefined,
          minPrice: minP || undefined,
          maxPrice: maxP || undefined,
          colors: colors || undefined,
          sizes: sizes || undefined,
          brands: brands || undefined,
          availability: avail || undefined,
          multicolor: multi,
        });
        setFilterData(data);
      } catch {
        setFilterData(null);
      } finally {
        setFilterLoading(false);
      }
    };
    fetchFilters();
  // Re-fetch whenever any filter param in the URL changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.get("category"),
    params.get("categoryId"),
    params.get("minPrice"),
    params.get("maxPrice"),
    params.get("colors"),
    params.get("color"),
    params.get("sizes"),
    params.get("size"),
    params.get("brands"),
    params.get("brand"),
    params.get("availability"),
    params.get("multicolor"),
  ]);

  const toggleMultiParam = (paramKey, value) => {
    updateSearchParams((p) => {
      const current = (p.get(paramKey) || "").split(",").map(v => v.trim()).filter(Boolean);
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      if (next.length) p.set(paramKey, next.join(",")); else p.delete(paramKey);
    });
  };

  // For Color: allow only ONE active at a time (exclusive selection).
  // - clicking a different color replaces previous selection
  // - clicking the same color clears it
  const toggleExclusiveFromCommaList = (paramKey, value) => {
    const needle = String(value || "").trim();
    if (!needle) return;
    updateSearchParams((p) => {
      const currentList = String(p.get(paramKey) || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const isSame =
        currentList.length === 1 &&
        currentList[0].toLowerCase() === needle.toLowerCase();
      if (isSame) {
        p.delete(paramKey);
        return;
      }
      p.set(paramKey, needle);
    });
  };

  const handlePriceBlur = () => {
    updateSearchParams((p) => {
      if (minPrice) p.set("minPrice", minPrice); else p.delete("minPrice");
      if (maxPrice) p.set("maxPrice", maxPrice); else p.delete("maxPrice");
    });
  };

  const clearAll = () => {
    // Clear the one-time navigation category hint.
    try { sessionStorage.removeItem("navCategoryIds"); } catch {}
    navigate(
      { pathname: location.pathname, search: "" },
      { replace: false, state: location.state ?? null },
    );
    setMinPrice(""); setMaxPrice("");
  };

  const availability = filterData?.availability || [];
  const colors       = filterData?.colors       || [];
  const sizes        = filterData?.sizes        || [];
  const brands       = filterData?.brands       || [];
  const categories   = filterData?.categories   || [];

  // Build active chips for summary
  const activeChips = [
    ...activeAvailability.map(v => ({ key: "availability", value: v, label: v === "instock" ? "In stock" : "Out of stock" })),
    ...(activeMulticolor ? [{ key: "multicolor", value: "true", label: "Multicolor" }] : []),
    ...activeCategories.map(v => ({ key: "categoryId", value: v, label: categories.find(c => String(c.id) === v)?.title || v })),
    ...activeColors.map(v => ({ key: "colors", value: v, label: v })),
    ...activeSizes.map(v => ({ key: "sizes", value: v, label: `Size: ${v}` })),
    ...activeBrands.map(v => ({ key: "brands", value: v, label: v })),
    ...(params.get("minPrice") || params.get("maxPrice") ? [{ key: "price", value: "price", label: `₹${params.get("minPrice") || "0"} – ₹${params.get("maxPrice") || "∞"}` }] : []),
  ];

  const removeChip = (chip) => {
    if (chip.key === "price") {
      setMinPrice(""); setMaxPrice("");
      updateSearchParams((p) => { p.delete("minPrice"); p.delete("maxPrice"); });
    } else if (chip.key === "multicolor") {
      updateSearchParams((p) => { p.delete("multicolor"); });
    } else {
      toggleMultiParam(chip.key, chip.value);
    }
  };

  return (
    <>
      <style>{`
        @keyframes cfPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .cf-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f4f4f4; border: 1px solid #e0e0e0; border-radius: 20px;
          padding: 3px 10px 3px 10px; font-size: 12px; color: #444;
          cursor: pointer; transition: background 0.15s;
        }
        .cf-chip:hover { background: #ececec; }
        .cf-chip-x { font-size: 14px; color: #999; line-height: 1; }
        .cf-clear-btn {
          background: none; border: 1px solid #ddd; border-radius: 20px;
          padding: 3px 12px; font-size: 12px; color: #555; cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .cf-clear-btn:hover { border-color: #333; color: #111; }
        .cf-color-swatch {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid transparent; box-sizing: border-box;
          cursor: pointer; flex-shrink: 0; transition: transform 0.15s;
          display: inline-block;
        }
        .cf-color-swatch:hover { transform: scale(1.15); }
        .cf-color-swatch.active { border-color: #333; box-shadow: 0 0 0 2px #fff inset; }
        .cf-size-pill {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 36px; height: 32px; padding: 0 8px;
          border: 1px solid #ddd; border-radius: 4px;
          font-size: 12.5px; cursor: pointer; background: #fff;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
          user-select: none;
        }
        .cf-size-pill:hover { border-color: #333; }
        .cf-size-pill.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
        .cf-price-input {
          width: 100%; border: 1px solid #ddd; border-radius: 4px;
          padding: 6px 8px; font-size: 13px; outline: none;
          transition: border-color 0.15s;
        }
        .cf-price-input:focus { border-color: #333; }
        .cf-avail-badge {
          display: inline-block; width: 8px; height: 8px; border-radius: 50%;
          flex-shrink: 0; margin-right: 2px;
        }
        @media (max-width: 1279px) {
          .m-collection-filters-form { padding-left: 2px; padding-right: 2px; }
          .cf-color-swatch-btn { width: 32px !important; height: 32px !important; }
          .cf-size-pill {
            min-height: 44px;
            min-width: 44px;
            padding: 0 14px;
            font-size: 14px;
          }
          .cf-chip { padding: 6px 12px; font-size: 13px; min-height: 40px; align-items: center; }
          .cf-clear-btn { padding: 6px 14px; min-height: 40px; }
        }
      `}</style>

    <div className="m-collection-filters-form m-filter--widget">
        <form id="CollectionFiltersForm" ref={formRef} style={{ marginTop: 20 }}>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {activeChips.map((chip) => (
                <button key={`${chip.key}-${chip.value}`} type="button" className="cf-chip" onClick={() => removeChip(chip)}>
                  {chip.label}
                  <span className="cf-chip-x">×</span>
                </button>
              ))}
              <button type="button" className="cf-clear-btn" onClick={clearAll}>Clear all</button>
        </div>
          )}

          {/* Availability */}
          <FilterAccordionSection isOpen={openSections.availability} onToggle={() => toggle("availability")} title="Availability" dataIndex={1}>
            <ul className="m-facets" role="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {filterLoading ? <SkeletonRows n={2} /> : availability.map((item) => {
                const isActive = activeAvailability.includes(item.value);
                const dotColor = item.value === "instock" ? "#22c55e" : "#ef4444";
                return (
                  <li key={item.value} className="m-facet--item">
                    <label htmlFor={`Filter-Avail-${item.value}`} className="m-facet--checkbox" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0" }}>
                      <input type="checkbox" id={`Filter-Avail-${item.value}`} checked={isActive} onChange={() => toggleMultiParam("availability", item.value)} style={{ display: "none" }} />
                      <span style={{
                        width: 16, height: 16, border: `2px solid ${isActive ? "#1a1a1a" : "#ccc"}`,
                        borderRadius: 3, background: isActive ? "#1a1a1a" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s"
                      }}>
                        {isActive && <svg width={9} height={9} viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                      <span className="cf-avail-badge" style={{ background: dotColor }} />
                      <span className="m-facet--label" style={{ flex: 1, fontSize: 13 }}>{item.label}</span>
                      <span style={{ fontSize: 12, color: "#aaa", background: "#f5f5f5", borderRadius: 10, padding: "1px 7px" }}>{item.count}</span>
                </label>
              </li>
                );
              })}
            </ul>
        </FilterAccordionSection>

          {/* Product Type */}
          {(filterLoading || categories.length > 0) && (
            <FilterAccordionSection isOpen={openSections.productType} onToggle={() => toggle("productType")} title="Product type" dataIndex={2}>
              <ul className="m-facets" role="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {filterLoading ? <SkeletonRows n={4} /> : categories.map((cat) => {
                  const isActive = activeCategories.includes(String(cat.id));
                  return (
                    <li key={cat.id} className="m-facet--item">
                      <label htmlFor={`Filter-Cat-${cat.id}`} className="m-facet--checkbox" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0" }}>
                        <input type="checkbox" id={`Filter-Cat-${cat.id}`} checked={isActive} onChange={() => toggleMultiParam("categoryId", String(cat.id))} style={{ display: "none" }} />
                        <span style={{
                          width: 16, height: 16, border: `2px solid ${isActive ? "#1a1a1a" : "#ccc"}`,
                          borderRadius: 3, background: isActive ? "#1a1a1a" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s"
                        }}>
                          {isActive && <svg width={9} height={9} viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                        <span className="m-facet--label" style={{ flex: 1, fontSize: 13 }}>{cat.title}</span>
                        <span style={{ fontSize: 12, color: "#aaa", background: "#f5f5f5", borderRadius: 10, padding: "1px 7px" }}>{cat.count}</span>
                </label>
              </li>
                  );
                })}
            </ul>
        </FilterAccordionSection>
          )}

        {/* Price range slider */}
        <FilterAccordionSection isOpen={openSections.price} onToggle={() => toggle("price")} title="Price" dataIndex={3}>
          <PriceRangeSlider
            min={0} max={10000}
            value={[Number(minPrice) || 0, Number(maxPrice) || 10000]}
            onChange={([lo, hi]) => { setMinPrice(String(lo)); setMaxPrice(String(hi)); }}
            onCommit={([lo, hi]) => {
              updateSearchParams((p) => {
                if (lo > 0) p.set("minPrice", lo); else p.delete("minPrice");
                if (hi < 10000) p.set("maxPrice", hi); else p.delete("maxPrice");
              });
            }}
            hasClear={!!(params.get("minPrice") || params.get("maxPrice"))}
            onClear={() => {
              setMinPrice(""); setMaxPrice("");
              updateSearchParams((p) => { p.delete("minPrice"); p.delete("maxPrice"); });
            }}
          />
        </FilterAccordionSection>

          {/* Color — shown as swatches */}
          {(filterLoading || colors.length > 0) && (
            <FilterAccordionSection isOpen={openSections.color} onToggle={() => toggle("color")} title="Color" dataIndex={4}>
              {filterLoading
                ? <ul style={{ listStyle: "none", margin: 0, padding: 0 }}><SkeletonRows n={4} /></ul>
                : (
                  <>
                    {/* Multicolor (boolean) */}
                    <div style={{ padding: "2px 0 10px" }}>
                      <button
                        type="button"
                        className={`cf-size-pill${activeMulticolor ? " active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateSearchParams((p) => {
                            if (activeMulticolor) {
                              p.delete("multicolor");
                              return;
                            }
                            // Multicolor on = show across *all* products by default.
                            // Remove any category scope so multicolor isn't accidentally limited.
                            p.delete("category");
                            p.delete("categoryId");
                            p.set("multicolor", "true");
                          });
                        }}
                        title="Multicolor"
                        style={{
                          height: 32,
                          minWidth: 110,
                          padding: "0 12px",
                          display: "inline-flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)",
                            border: "1px solid rgba(0,0,0,0.08)",
                            flexShrink: 0,
                          }}
                        />
                        Multicolor
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "4px 0 8px" }}>
                    {colors.map((item) => {
                      const isActive = activeColors.some(
                        (c) =>
                          String(c || "").trim().toLowerCase() ===
                          String(item.color || "").trim().toLowerCase(),
                      );
                      const bg = item.colorCode || "#ccc";
                      const isLight = ["white", "#ffffff", "#fff", "#f5f5f5", "cream", "#fffdd0", "#f0ece3"].includes((item.colorCode || "").toLowerCase()) ||
                        (item.color || "").toLowerCase() === "white";
                      return (
                        <button
                          key={item.color}
                          type="button"
                          className="cf-color-swatch-btn"
                          title={`${item.color} (${item.count})`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExclusiveFromCommaList("colors", item.color);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExclusiveFromCommaList("colors", item.color);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExclusiveFromCommaList("colors", item.color);
                          }}
                          style={{
                            width: 26, height: 26, borderRadius: "50%", background: bg,
                            border: isActive ? "2px solid #1a1a1a" : `1px solid ${isLight ? "#ccc" : "transparent"}`,
                            boxShadow: isActive ? "0 0 0 2px #fff inset" : "none",
                            cursor: "pointer", outline: "none", transition: "transform 0.15s, box-shadow 0.15s",
                            flexShrink: 0,
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = "scale(1.18)"}
                          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                        />
                      );
                    })}
                    </div>
                  </>
                )
              }
              {/* Show selected color names below swatches */}
              {!filterLoading && activeColors.length > 0 && (
                <div style={{ fontSize: 11.5, color: "#888", marginBottom: 4 }}>
                  Selected: {activeColors.join(", ")}
                </div>
              )}
        </FilterAccordionSection>
          )}

          {/* Size — shown as pills */}
          {(filterLoading || sizes.length > 0) && (
            <FilterAccordionSection isOpen={openSections.size} onToggle={() => toggle("size")} title="Size" dataIndex={5}>
              {filterLoading
                ? <ul style={{ listStyle: "none", margin: 0, padding: 0 }}><SkeletonRows n={4} /></ul>
                : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "4px 0 8px" }}>
                    {sizes.map((item) => {
                      const isActive = activeSizes.includes(item.size);
                      return (
                        <button
                          key={item.size}
                          type="button"
                          title={`${item.count} products`}
                          className={`cf-size-pill${isActive ? " active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleMultiParam("sizes", item.size);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleMultiParam("sizes", item.size);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleMultiParam("sizes", item.size);
                          }}
                        >
                          {item.size}
                        </button>
                      );
                    })}
                  </div>
                )
              }
        </FilterAccordionSection>
          )}

          {/* Brand */}
          {(filterLoading || brands.length > 0) && (
            <FilterAccordionSection isOpen={openSections.brand} onToggle={() => toggle("brand")} title="Brand" dataIndex={6}>
              <ul className="m-facets" role="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {filterLoading ? <SkeletonRows n={3} /> : brands.map((item) => {
                  const isActive = activeBrands.includes(item.brand);
                  return (
                    <li key={item.brand} className="m-facet--item">
                      <label htmlFor={`Filter-Brand-${item.brand}`} className="m-facet--checkbox" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0" }}>
                        <input type="checkbox" id={`Filter-Brand-${item.brand}`} checked={isActive} onChange={() => toggleMultiParam("brands", item.brand)} style={{ display: "none" }} />
                        <span style={{
                          width: 16, height: 16, border: `2px solid ${isActive ? "#1a1a1a" : "#ccc"}`,
                          borderRadius: 3, background: isActive ? "#1a1a1a" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s"
                        }}>
                          {isActive && <svg width={9} height={9} viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                        <span className="m-facet--label" style={{ flex: 1, fontSize: 13 }}>{item.brand}</span>
                        <span style={{ fontSize: 12, color: "#aaa", background: "#f5f5f5", borderRadius: 10, padding: "1px 7px" }}>{item.count}</span>
                </label>
              </li>
                  );
                })}
            </ul>
        </FilterAccordionSection>
          )}

      </form>
    </div>
    </>
  );
}