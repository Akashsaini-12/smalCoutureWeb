import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FilterAccordionSection from "./FilterAccordionSection";
import { fetchCatalogProductFilters } from "../redux/actions";

function norm(v) {
  return String(v || "").trim();
}
function normLower(v) {
  return norm(v).toLowerCase();
}
function parseCsvParam(v) {
  return norm(v)
    .split(",")
    .map((x) => norm(x))
    .filter(Boolean);
}
function uniq(arr) {
  const out = [];
  const seen = new Set();
  (Array.isArray(arr) ? arr : []).forEach((x) => {
    const k = normLower(x);
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(norm(x));
  });
  return out;
}
function toggleInList(list, value) {
  const v = norm(value);
  if (!v) return list;
  const has = list.some((x) => normLower(x) === normLower(v));
  return has ? list.filter((x) => normLower(x) !== normLower(v)) : [...list, v];
}

function Pill({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        minHeight: 34,
        padding: "6px 10px",
        borderRadius: 10,
        border: active ? "1px solid #0f172a" : "1px solid #e5e7eb",
        background: active ? "#0f172a" : "#fff",
        color: active ? "#fff" : "#0f172a",
        fontWeight: 800,
        fontSize: 12.5,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function CheckRow({ active, label, count, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 0",
        border: "none",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: active ? "2px solid #0f172a" : "2px solid #cbd5e1",
            background: active ? "#0f172a" : "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {active ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
      </span>
      {count != null ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: "#64748b",
            background: "#f1f5f9",
            borderRadius: 999,
            padding: "2px 8px",
            flexShrink: 0,
          }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function Swatch({ active, colorCode, title, onClick }) {
  const bg = norm(colorCode) || "#e5e7eb";
  const isLight = ["#fff", "#ffffff", "white", "#f5f5f5", "#f1f5f9"].includes(bg.toLowerCase());
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: active ? "2px solid #0f172a" : `1px solid ${isLight ? "#cbd5e1" : "transparent"}`,
        boxShadow: active ? "0 0 0 2px #fff inset" : "none",
        background: bg,
        cursor: "pointer",
        flexShrink: 0,
      }}
    />
  );
}

export default function CollectionFilters() {
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState({
    availability: true,
    category: false,
    price: true,
    color: true,
    size: true,
    brand: false,
  });

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const active = useMemo(() => {
    const colors = parseCsvParam(params.get("colors") || params.get("color") || "");
    const sizes = parseCsvParam(params.get("sizes") || params.get("size") || "");
    const brands = parseCsvParam(params.get("brands") || params.get("brand") || "");
    const availability = parseCsvParam(params.get("availability") || "");
    const categoryId = parseCsvParam(params.get("categoryId") || params.get("category") || "");
    const multicolor = normLower(params.get("multicolor")) === "true";
    const minPrice = norm(params.get("minPrice"));
    const maxPrice = norm(params.get("maxPrice"));
    return {
      colors: uniq(colors),
      sizes: uniq(sizes),
      brands: uniq(brands),
      availability: uniq(availability),
      categoryId: uniq(categoryId),
      multicolor,
      minPrice,
      maxPrice,
    };
  }, [params]);

  const [priceDraft, setPriceDraft] = useState({ minPrice: "", maxPrice: "" });

  useEffect(() => {
    setPriceDraft({ minPrice: active.minPrice || "", maxPrice: active.maxPrice || "" });
  }, [active.minPrice, active.maxPrice]);

  const updateUrl = useCallback(
    (next) => {
      const p = new URLSearchParams(location.search);

      // If user came from a header category (e.g. Jewellery), the category is stored as a one-time
      // hint in sessionStorage (`navCategoryIds`) and NOT in the URL. When the user applies any
      // filter (color/size/etc), we must "materialize" that hint into `categoryId` so filters
      // stay scoped to the selected category.
      try {
        const hasCategoryInUrl = Boolean(p.get("categoryId") || p.get("category"));
        const navIds = sessionStorage.getItem("navCategoryIds") || "";
        const canUseNavIds = Boolean(location?.state?.menuId);
        if (!hasCategoryInUrl && navIds && canUseNavIds) {
          p.set("categoryId", String(navIds));
        }
      } catch {
        // ignore
      }

      const setCsv = (key, list) => {
        const cleaned = uniq(list);
        if (cleaned.length) p.set(key, cleaned.join(","));
        else p.delete(key);
      };

      if (next.categoryId != null) setCsv("categoryId", next.categoryId);
      if (next.availability != null) setCsv("availability", next.availability);
      if (next.brands != null) setCsv("brands", next.brands);
      if (next.sizes != null) setCsv("sizes", next.sizes);
      if (next.sizes != null) setCsv("size", next.sizes); // legacy compatibility

      // Color is exclusive (1 at a time)
      if (next.colors != null) {
        const c = uniq(next.colors).slice(0, 1);
        if (c.length) {
          p.set("colors", c[0]);
          p.set("color", c[0]); // legacy compatibility
        } else {
          p.delete("colors");
          p.delete("color");
        }
      }

      if (typeof next.multicolor === "boolean") {
        if (next.multicolor) p.set("multicolor", "true");
        else p.delete("multicolor");
      }

      if (next.minPrice != null) {
        const v = norm(next.minPrice);
        if (v) p.set("minPrice", v);
        else p.delete("minPrice");
      }
      if (next.maxPrice != null) {
        const v = norm(next.maxPrice);
        if (v) p.set("maxPrice", v);
        else p.delete("maxPrice");
      }

      p.delete("page");

      navigate(
        { pathname: location.pathname, search: p.toString() ? `?${p.toString()}` : "" },
        { replace: false, state: location.state ?? null },
      );
    },
    [location.pathname, location.search, location.state, navigate],
  );

  const [facet, setFacet] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchCatalogProductFilters({
      categoryId: active.categoryId.length ? active.categoryId.join(",") : undefined,
      minPrice: active.minPrice || undefined,
      maxPrice: active.maxPrice || undefined,
      colors: active.colors.length ? active.colors.join(",") : undefined,
      sizes: active.sizes.length ? active.sizes.join(",") : undefined,
      brands: active.brands.length ? active.brands.join(",") : undefined,
      availability: active.availability.length ? active.availability.join(",") : undefined,
      multicolor: active.multicolor,
    })
      .then((res) => {
        if (!mounted) return;
        setFacet(res || null);
      })
      .catch(() => {
        if (!mounted) return;
        setFacet(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [
    active.categoryId.join("|"),
    active.minPrice,
    active.maxPrice,
    active.colors.join("|"),
    active.sizes.join("|"),
    active.brands.join("|"),
    active.availability.join("|"),
    active.multicolor,
  ]);

  const availabilityFacet = Array.isArray(facet?.availability) ? facet.availability : [];
  const categoriesFacet = Array.isArray(facet?.categories) ? facet.categories : [];
  const colorsFacet = Array.isArray(facet?.colors) ? facet.colors : [];
  const sizesFacet = Array.isArray(facet?.sizes) ? facet.sizes : [];
  const brandsFacet = Array.isArray(facet?.brands) ? facet.brands : [];

  const hasAnyActive =
    active.categoryId.length ||
    active.availability.length ||
    active.colors.length ||
    active.sizes.length ||
    active.brands.length ||
    active.multicolor ||
    active.minPrice ||
    active.maxPrice;

  const clearAll = () => {
    try {
      sessionStorage.removeItem("navCategoryIds");
    } catch {
      // ignore
    }
    navigate(
      { pathname: location.pathname, search: "" },
      { replace: false, state: location.state ?? null },
    );
  };

  return (
    <div className="m-collection-filters-form m-filter--widget">
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {hasAnyActive ? (
          <button
            type="button"
            onClick={clearAll}
            style={{
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#fff",
              padding: "8px 12px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div style={{ marginTop: 16 }}>
        {/* Availability */}
        <FilterAccordionSection
          isOpen={open.availability}
          onToggle={() => setOpen((s) => ({ ...s, availability: !s.availability }))}
          title="Availability"
          dataIndex={1}
        >
          {loading ? (
            <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 13 }}>Loading…</div>
          ) : (
            <div style={{ display: "grid", gap: 2 }}>
              {availabilityFacet.map((it) => (
                <CheckRow
                  key={it.value}
                  active={active.availability.some((x) => normLower(x) === normLower(it.value))}
                  label={it.label}
                  count={it.count}
                  onToggle={() =>
                    updateUrl({
                      availability: toggleInList(active.availability, it.value),
                    })
                  }
                />
              ))}
            </div>
          )}
        </FilterAccordionSection>

        {/* Category */}
        {categoriesFacet.length ? (
          <FilterAccordionSection
            isOpen={open.category}
            onToggle={() => setOpen((s) => ({ ...s, category: !s.category }))}
            title="Category"
            dataIndex={2}
          >
            {loading ? (
              <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 13 }}>Loading…</div>
            ) : (
              <div style={{ display: "grid", gap: 2 }}>
                {categoriesFacet.map((c) => (
                  <CheckRow
                    key={c.id}
                    active={active.categoryId.includes(String(c.id))}
                    label={c.title}
                    count={c.count}
                    onToggle={() =>
                      updateUrl({
                        categoryId: toggleInList(active.categoryId, String(c.id)),
                      })
                    }
                  />
                ))}
              </div>
            )}
          </FilterAccordionSection>
        ) : null}

        {/* Price */}
        <FilterAccordionSection
          isOpen={open.price}
          onToggle={() => setOpen((s) => ({ ...s, price: !s.price }))}
          title="Price"
          dataIndex={3}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>Min</span>
              <input
                value={priceDraft.minPrice}
                onChange={(e) => setPriceDraft((s) => ({ ...s, minPrice: e.target.value }))}
                inputMode="numeric"
                placeholder="0"
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontWeight: 800,
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>Max</span>
              <input
                value={priceDraft.maxPrice}
                onChange={(e) => setPriceDraft((s) => ({ ...s, maxPrice: e.target.value }))}
                inputMode="numeric"
                placeholder="∞"
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontWeight: 800,
                }}
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => updateUrl({ minPrice: priceDraft.minPrice, maxPrice: priceDraft.maxPrice })}
              style={{
                borderRadius: 12,
                border: "1px solid #0f172a",
                background: "#0f172a",
                color: "#fff",
                padding: "10px 14px",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Apply price
            </button>
            {(active.minPrice || active.maxPrice) ? (
              <button
                type="button"
                onClick={() => updateUrl({ minPrice: "", maxPrice: "" })}
                style={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  padding: "10px 14px",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Clear price
              </button>
            ) : null}
          </div>
        </FilterAccordionSection>

        {/* Color */}
        {colorsFacet.length ? (
          <FilterAccordionSection
            isOpen={open.color}
            onToggle={() => setOpen((s) => ({ ...s, color: !s.color }))}
            title="Color"
            dataIndex={4}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
              <Pill
                active={active.multicolor}
                onClick={() =>
                  updateUrl({
                    multicolor: !active.multicolor,
                    // turning on multicolor should not forcibly clear categories here;
                    // we keep existing query contract intact.
                  })
                }
                title="Multicolor"
              >
                Multicolor
              </Pill>
              {active.colors.length ? (
                <Pill active={false} onClick={() => updateUrl({ colors: [] })} title="Clear color">
                  Clear color
                </Pill>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {colorsFacet.map((c) => {
                const isActive = active.colors.some((x) => normLower(x) === normLower(c.color));
                return (
                  <Swatch
                    key={c.color}
                    active={isActive}
                    colorCode={c.colorCode}
                    title={`${c.color} (${c.count})`}
                    onClick={() => updateUrl({ colors: isActive ? [] : [c.color] })}
                  />
                );
              })}
            </div>
            {active.colors.length ? (
              <div style={{ marginTop: 10, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
                Selected: {active.colors.join(", ")}
              </div>
            ) : null}
          </FilterAccordionSection>
        ) : null}

        {/* Size */}
        {sizesFacet.length ? (
          <FilterAccordionSection
            isOpen={open.size}
            onToggle={() => setOpen((s) => ({ ...s, size: !s.size }))}
            title="Size"
            dataIndex={5}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {sizesFacet.map((s) => {
                const isActive = active.sizes.some((x) => normLower(x) === normLower(s.size));
                return (
                  <Pill
                    key={s.size}
                    active={isActive}
                    title={`${s.count} products`}
                    onClick={() => updateUrl({ sizes: toggleInList(active.sizes, s.size) })}
                  >
                    {s.size}
                  </Pill>
                );
              })}
            </div>
          </FilterAccordionSection>
        ) : null}

        {/* Brand */}
        {brandsFacet.length ? (
          <FilterAccordionSection
            isOpen={open.brand}
            onToggle={() => setOpen((s) => ({ ...s, brand: !s.brand }))}
            title="Brand"
            dataIndex={6}
          >
            <div style={{ display: "grid", gap: 2 }}>
              {brandsFacet.map((b) => (
                <CheckRow
                  key={b.brand}
                  active={active.brands.some((x) => normLower(x) === normLower(b.brand))}
                  label={b.brand}
                  count={b.count}
                  onToggle={() => updateUrl({ brands: toggleInList(active.brands, b.brand) })}
                />
              ))}
            </div>
          </FilterAccordionSection>
        ) : null}
      </div>
    </div>
  );
}