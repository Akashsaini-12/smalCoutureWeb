import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminCreateCoupon, adminDeleteCoupon, adminListCoupons, fetchShopCategories } from "../../redux/actions";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function formatAmount(value) {
  const amount = Number(value || 0);
  return amount === 0 ? "-" : `₹${amount}`;
}

function CategoryChipInput({ values, onChange, categories }) {
  const containerRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    const selected = new Set(values.map((value) => String(value).toLowerCase()));
    return categories
      .filter((category) => {
        const title = String(category?.title || category?.name || "");
        const id = String(category?.id ?? category?._id ?? "");
        return title && !selected.has(id.toLowerCase()) && !selected.has(title.toLowerCase()) &&
          (!query || `${title} ${id}`.toLowerCase().includes(query));
      })
      .slice(0, 6);
  }, [categories, inputValue, values]);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!containerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const addValue = (value) => {
    const nextValue = String(value || "").trim();
    if (!nextValue || values.some((item) => String(item).toLowerCase() === nextValue.toLowerCase())) return;
    onChange([...values, nextValue]);
    setInputValue("");
    setMenuOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "," || event.key === "Enter") {
      event.preventDefault();
      addValue(inputValue);
    } else if (event.key === "Backspace" && !inputValue && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  const titleForValue = (value) => {
    const category = categories.find((item) => String(item?.id ?? item?._id ?? "") === String(value));
    return category?.title || category?.name || value;
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        className="form-input"
        style={{ minHeight: 46, height: "auto", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: 7 }}
        onClick={() => setMenuOpen(true)}
      >
        {values.map((value) => (
          <span key={value} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 999, background: "#e0ecff", color: "#174ea6", fontSize: 12, fontWeight: 700 }}>
            {titleForValue(value)}
            <button type="button" aria-label={`Remove ${titleForValue(value)}`} onClick={(event) => { event.stopPropagation(); onChange(values.filter((item) => item !== value)); }} style={{ border: 0, background: "transparent", color: "#174ea6", cursor: "pointer", padding: 0, fontWeight: 900 }}>×</button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          placeholder={values.length ? "Add another..." : "e.g., suits, kurti, coord"}
          onChange={(event) => { setInputValue(event.target.value); setMenuOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setMenuOpen(true)}
          style={{ flex: "1 1 120px", minWidth: 120, border: 0, outline: 0, background: "transparent", padding: "5px 3px", font: "inherit" }}
        />
      </div>
      {menuOpen && suggestions.length ? (
        <div style={{ position: "absolute", zIndex: 10, left: 0, right: 0, bottom: "calc(100% + 4px)", maxHeight: 210, overflowY: "auto", background: "#fff", border: "1px solid #dbe3ef", borderRadius: 8, boxShadow: "0 8px 20px rgba(15, 23, 42, 0.14)", padding: 4 }}>
          {suggestions.map((category) => {
            const id = String(category.id ?? category._id ?? category.title ?? category.name);
            const parent = categories.find((item) => String(item?.id ?? item?._id ?? "") === String(category.parentId));
            return (
              <button key={id} type="button" onClick={(event) => { event.stopPropagation(); addValue(category.id ?? category._id ?? category.title ?? category.name); }} style={{ display: "block", width: "100%", border: 0, background: "transparent", textAlign: "left", padding: "8px 10px", borderRadius: 6, cursor: "pointer", color: "#1f2937" }}>
                <strong>{category.title || category.name}</strong>
                <span style={{ display: "block", color: "#7b8798", fontSize: 11 }}>{parent ? `${parent.title || parent.name} / ` : ""}{category.id ?? category._id ? `ID: ${category.id ?? category._id}` : "Category"}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function CouponsAdminSection() {
  const dispatch = useDispatch();
  const shopCategories = useSelector((state) => state.shopCategories || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [applicableCategories, setApplicableCategories] = useState([]);
  const [applicableOn, setApplicableOn] = useState("");
  const normalizedCode = useMemo(() => String(code || "").trim().toUpperCase(), [code]);
  const categoryTitleById = useMemo(() => {
    const titles = new Map();
    (Array.isArray(shopCategories) ? shopCategories : []).forEach((category) => {
      const id = category?.id ?? category?._id;
      if (id != null) titles.set(String(id), category.title || category.name || String(id));
    });
    return titles;
  }, [shopCategories]);

  const formatApplicableCategories = (values) => {
    if (!Array.isArray(values) || values.length === 0) return "All";
    return values.map((value) => categoryTitleById.get(String(value)) || String(value)).join(", ");
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListCoupons();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    dispatch(fetchShopCategories());
  }, [dispatch]);

  const handleCreate = async () => {
    setError("");
    try {
      await adminCreateCoupon({
        code: normalizedCode,
        type,
        value: Number(value),
        minSubtotal: minSubtotal === "" ? 0 : Number(minSubtotal),
        maxDiscount: maxDiscount === "" ? 0 : Number(maxDiscount),
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        applicableOn,
            applicableCategories,
      });
      setCode("");
      setValue("");
      setMinSubtotal("");
      setMaxDiscount("");
      setExpiresAt("");
      setApplicableOn("");
setApplicableCategories([]);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to create coupon");
    }
  };

  const handleDelete = async (couponId) => {
    setError("");
    try {
      await adminDeleteCoupon({ couponId });
      await load();
    } catch (e) {
      setError(e?.message || "Failed to delete coupon");
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Coupons</div>
          <div className="section-desc">Create coupon codes for Checkout (SAVE10 / FLAT50 etc.).</div>
        </div>
        <div className="badge">{items.length} total</div>
      </div>

      {error ? (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,101,132,0.35)", background: "rgba(255,101,132,0.08)", color: "#991b1b", fontWeight: 600, marginBottom: 14 }}>
          {error}
        </div>
      ) : null}

      <div className="table-wrap" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Code</label>
            <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SAVE10" />
            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>Will be saved as: <strong>{normalizedCode || "-"}</strong></div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{type === "percent" ? "Percent" : "Flat amount"}</label>
            <input className="form-input" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "percent" ? "10" : "50"} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Min subtotal (₹)</label>
            <input className="form-input" type="number" value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Max discount (₹) (percent only)</label>
            <input className="form-input" type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Expires at</label>
            <input className="form-input" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
    <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Applicable On (Payment Method)</label>
        <select 
            className="form-select" 
            value={applicableOn} 
            onChange={(e) => setApplicableOn(e.target.value)}
        >
            <option value="">All (No Restriction)</option>
            <option value="prepaid">Prepaid Only</option>
            <option value="cod">COD Only</option>
        </select>
    </div>

    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">Applicable Categories</label>
      <CategoryChipInput values={applicableCategories} onChange={setApplicableCategories} categories={Array.isArray(shopCategories) ? shopCategories : []} />
        <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
            Leave empty if applicable on all categories.
        </div>
    </div>
</div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btn-primary" type="button" onClick={handleCreate} disabled={!normalizedCode || !value}>
              ➕ Create coupon
            </button>
            <button className="btn btn-ghost" type="button" onClick={load}>
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Applicable On</th>
              <th>Applicable Categories</th>
              <th>Min Subtotal</th>
              <th>Max Discount</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Created</th>
              <th style={{ width: 90 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} style={{ color: "#6b7280", fontWeight: 600 }}>Loading…</td></tr>
            ) : items.length ? (
              items.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 700 }}>{c.code}</td>
                  <td>{c.type}</td>
                  <td>{c.type === "percent" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td>{c.applicableOn || "All"}</td>
                  <td>{formatApplicableCategories(c.applicableCategories)}</td>
                  <td>{formatAmount(c.minSubtotal)}</td>
                  <td>{formatAmount(c.maxDiscount)}</td>
                  <td>
                    <span className={`status-pill ${c.isActive ? "status-active" : "status-inactive"}`}>
                      {c.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td>{c.expiresAt ? formatDate(c.expiresAt) : "-"}</td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>
                    <button className="action-btn action-del" type="button" title="Delete" onClick={() => handleDelete(c._id)}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={11} style={{ color: "#6b7280", fontWeight: 600 }}>No coupons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

