import React, { useEffect, useMemo, useState } from "react";
import { adminCreateCoupon, adminDeleteCoupon, adminListCoupons } from "../../redux/actions";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
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
  const [isActive, setIsActive] = useState(true);

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

  const handleCreate = async () => {
    setError("");
    try {
      await adminCreateCoupon({
        code: normalizedCode,
        type,
        value: Number(value),
        minSubtotal: minSubtotal === "" ? 0 : Number(minSubtotal),
        maxDiscount: maxDiscount === "" ? 0 : Number(maxDiscount),
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      setCode("");
      setValue("");
      setMinSubtotal("");
      setMaxDiscount("");
      setExpiresAt("");
      setIsActive(true);
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

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, color: "#111827" }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
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
              <th>Status</th>
              <th>Expires</th>
              <th>Created</th>
              <th style={{ width: 90 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ color: "#6b7280", fontWeight: 600 }}>Loading…</td></tr>
            ) : items.length ? (
              items.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 700 }}>{c.code}</td>
                  <td>{c.type}</td>
                  <td>{c.type === "percent" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td>₹{Number(c.minSubtotal || 0)}</td>
                  <td>₹{Number(c.maxDiscount || 0)}</td>
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
              <tr><td colSpan={9} style={{ color: "#6b7280", fontWeight: 600 }}>No coupons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

