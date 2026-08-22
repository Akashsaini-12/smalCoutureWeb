import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  adminCreateCoupon,
  adminDeleteCoupon,
  adminListCoupons,
  fetchMasterCategories,
} from "../../redux/actions";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function formatPaymentMethod(applicableOn) {
  if (applicableOn === "prepaid") return "Prepaid";
  if (applicableOn === "cod") return "COD";
  return "All";
}

export default function CouponsAdminSection() {
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
  const [applicableCategoriesInput, setApplicableCategoriesInput] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categorySuggestionsOpen, setCategorySuggestionsOpen] = useState(false);
  const categoryInputRef = useRef(null);
  const [applicableOn, setApplicableOn] = useState("");
  const normalizedCode = useMemo(() => String(code || "").trim().toUpperCase(), [code]);

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
  }, []);

  useEffect(() => {
    if (!categorySuggestionsOpen) return undefined;
    const closeSuggestionsOnOutsideClick = (event) => {
      if (!categoryInputRef.current?.contains(event.target)) {
        setCategorySuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeSuggestionsOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeSuggestionsOnOutsideClick);
  }, [categorySuggestionsOpen]);

  useEffect(() => {
    fetchMasterCategories()
      .then((categories) => {
        const options = (Array.isArray(categories) ? categories : [])
          .map((category) => ({
            id: String(category?.id ?? category?._id ?? ""),
            title: String(category?.title || category?.name || "").trim(),
            parentId: category?.parentId == null ? null : String(category.parentId),
          }))
          .filter((category) => category.id && category.title)
          .sort((first, second) => first.title.localeCompare(second.title));
        setCategoryOptions(options);
      })
      .catch(() => setCategoryOptions([]));
  }, []);

  const addApplicableCategory = () => {
    const category = applicableCategoriesInput.trim();
    if (!category) return;
    setApplicableCategories((categories) => (
      categories.includes(category) ? categories : [...categories, category]
    ));
    setApplicableCategoriesInput("");
    setCategorySuggestionsOpen(false);
  };

  const getCategoryLabel = (categoryId) => (
    categoryOptions.find((category) => category.id === categoryId)?.title || categoryId
  );

  const formatCouponCategories = (categories) => {
    if (!Array.isArray(categories) || !categories.length) return "All categories";
    return categories.map((category) => getCategoryLabel(String(category))).join(", ");
  };

  const selectCategorySuggestion = (category) => {
    const value = category.id;
    setApplicableCategories((categories) => (
      categories.includes(value) ? categories : [...categories, value]
    ));
    setApplicableCategoriesInput("");
  };

  const categorySuggestions = useMemo(() => {
    const search = applicableCategoriesInput.trim().toLowerCase();
    if (!search) return [];
    return categoryOptions
      .filter((category) => (
        category.title.toLowerCase().includes(search) || category.id.toLowerCase().includes(search)
      ))
      .filter((category) => !applicableCategories.includes(category.id))
      .slice(0, 10);
  }, [applicableCategories, applicableCategoriesInput, categoryOptions]);

  const handleCreate = async () => {
    setError("");
    const categories = [
      ...applicableCategories,
      ...(applicableCategoriesInput.trim() ? [applicableCategoriesInput.trim()] : []),
    ].filter((category, index, allCategories) => allCategories.indexOf(category) === index);
    try {
      await adminCreateCoupon({
        code: normalizedCode,
        type,
        value: Number(value),
        minSubtotal: minSubtotal === "" ? 0 : Number(minSubtotal),
        maxDiscount: maxDiscount === "" ? 0 : Number(maxDiscount),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        applicableOn,
        applicableCategories: categories,
      });
      setCode("");
      setValue("");
      setMinSubtotal("");
      setMaxDiscount("");
      setExpiresAt("");
      setApplicableOn("");
      setApplicableCategories([]);
      setApplicableCategoriesInput("");
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

      <div className="table-wrap" style={{ padding: 16, marginBottom: 18, overflow: "visible" }}>
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
          {/* Payment Method aur Category Restrictions */}
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

    <div ref={categoryInputRef} className="form-group" style={{ marginBottom: 0, position: "relative", zIndex: 2 }}>
        <label className="form-label">Applicable Categories (Comma Separated IDs)</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 6,
            minHeight: 42,
            padding: "5px 8px",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            background: "#fff",
            position: "relative",
          }}
        >
          {applicableCategories.map((category) => (
            <span
              key={category}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 7px",
                borderRadius: 6,
                background: "#f3f4f6",
                color: "#111827",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {getCategoryLabel(category)}
              <button
                type="button"
                onClick={() => setApplicableCategories((categories) => categories.filter((item) => item !== category))}
                aria-label={`Remove ${category}`}
                style={{
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  color: "#4b5563",
                  fontSize: 16,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder={applicableCategories.length ? "Add category" : "e.g., suits, kurti, coord"}
            value={applicableCategoriesInput}
            onChange={(e) => {
              setApplicableCategoriesInput(e.target.value);
              setCategorySuggestionsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === ",") {
                e.preventDefault();
                addApplicableCategory();
              }
            }}
            style={{
              flex: "1 1 120px",
              minWidth: 120,
              border: 0,
              outline: "none",
              padding: "6px 2px",
              font: "inherit",
            }}
          />
          {categorySuggestionsOpen && categorySuggestions.length ? (
            <div
              style={{
                position: "absolute",
                zIndex: 5,
                left: 0,
                right: 0,
                top: "calc(100% + 4px)",
                maxHeight: 220,
                overflowY: "auto",
                padding: 4,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                background: "#fff",
                boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)",
              }}
            >
              {categorySuggestions.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCategorySuggestion(category)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 10px",
                    border: 0,
                    borderRadius: 6,
                    background: "transparent",
                    color: "#111827",
                    textAlign: "left",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {category.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
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
              <th>Min Subtotal</th>
              <th>Max Discount</th>
              <th>Payment Method</th>
              <th>Categories</th>
              <th>Expires</th>
              <th>Created</th>
              <th style={{ width: 90 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ color: "#6b7280", fontWeight: 600 }}>Loading…</td></tr>
            ) : items.length ? (
              items.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 700 }}>{c.code}</td>
                  <td>{c.type}</td>
                  <td>{c.type === "percent" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td>₹{Number(c.minSubtotal || 0)}</td>
                  <td>₹{Number(c.maxDiscount || 0)}</td>
                  <td>{formatPaymentMethod(c.applicableOn)}</td>
                  <td style={{ maxWidth: 220, whiteSpace: "normal" }}>
                    {formatCouponCategories(c.applicableCategories)}
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
              <tr><td colSpan={10} style={{ color: "#6b7280", fontWeight: 600 }}>No coupons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

