import React, { useEffect, useMemo, useState } from "react";
import { adminGetFilterPromo, adminUpdateFilterPromo, uploadImageToCloudinary } from "../../redux/actions";

export default function FilterPromoAdminSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [enabled, setEnabled] = useState(true);
  const [badgeText, setBadgeText] = useState("");
  const [title, setTitle] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const isValidHref = useMemo(() => {
    const v = String(ctaHref || "").trim();
    if (!v) return true;
    if (v === "#") return true;
    return /^https?:\/\//i.test(v) || v.startsWith("/");
  }, [ctaHref]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminGetFilterPromo();
      const p = res?.promo || {};
      setEnabled(Boolean(p?.enabled));
      setBadgeText(String(p?.badgeText || ""));
      setTitle(String(p?.title || ""));
      setCtaText(String(p?.ctaText || ""));
      setCtaHref(String(p?.ctaHref || ""));
      setImageUrl(String(p?.imageUrl || ""));
      setImageAlt(String(p?.imageAlt || ""));
    } catch (e) {
      setError(e?.message || "Failed to load filter promo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePickImage = async (file) => {
    if (!file) return;
    setError("");
    try {
      setSaving(true);
      const url = await uploadImageToCloudinary(file);
      setImageUrl(url);
    } catch (e) {
      setError(e?.message || "Image upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!isValidHref) {
      setError("CTA link should be a full URL (https://...) or a relative path (/sale).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminUpdateFilterPromo({
        enabled,
        badgeText,
        title,
        ctaText,
        ctaHref: ctaHref || "#",
        imageUrl,
        imageAlt,
      });
      await load();
    } catch (e) {
      setError(e?.message || "Failed to save filter promo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Filters promo banner</div>
          <div className="section-desc">
            Controls the banner shown above filters on the products/collection page.
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,101,132,0.35)",
            background: "rgba(255,101,132,0.08)",
            color: "#991b1b",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      ) : null}

      <div className="table-wrap" style={{ padding: 16 }}>
        {loading ? (
          <div style={{ padding: 12, color: "#6b7280", fontWeight: 800 }}>
            Loading…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, color: "#111827" }}>
                  <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                  Enabled
                </label>
                <button className="btn btn-ghost" type="button" onClick={load} disabled={saving}>
                  ↻ Refresh
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Badge text</label>
                <input className="form-input" value={badgeText} onChange={(e) => setBadgeText(e.target.value)} placeholder="Online Exclusive" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Title</label>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SALE UP TO 25% OFF" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CTA text</label>
                  <input className="form-input" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Shop The Sale" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CTA link</label>
                  <input className="form-input" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} placeholder="/sale or https://…" />
                  {!isValidHref ? (
                    <div style={{ marginTop: 6, color: "#b91c1c", fontWeight: 800, fontSize: 12 }}>
                      Use `https://...` or `/path`
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Image URL</label>
                  <input className="form-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Image alt</label>
                  <input className="form-input" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Promotion" />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <label className="btn btn-ghost" style={{ cursor: saving ? "not-allowed" : "pointer" }}>
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    disabled={saving}
                    onChange={(e) => handlePickImage(e.target.files?.[0])}
                  />
                </label>
                <button className="btn btn-primary" type="button" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                overflow: "hidden",
                background: "#0b1220",
              }}
            >
              <div style={{ padding: 12, color: "#e5e7eb", fontWeight: 900, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                Preview
              </div>
              <div style={{ display: "grid", gridTemplateRows: "160px auto" }}>
                <div style={{ background: "#111827", position: "relative" }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={imageAlt || "Preview"} style={{ width: "100%", height: "160px", objectFit: "cover", display: "block", opacity: enabled ? 1 : 0.6 }} />
                  ) : (
                    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontWeight: 800 }}>
                      No image
                    </div>
                  )}
                  {!enabled ? (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 950, color: "#fff", background: "rgba(0,0,0,0.35)" }}>
                      Disabled
                    </div>
                  ) : null}
                </div>
                <div style={{ padding: 14, color: "#fff", textAlign: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.9 }}>
                    {badgeText || "—"}
                  </div>
                  <div style={{ fontWeight: 950, fontSize: 18, marginTop: 6 }}>
                    {title || "—"}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 14px", borderRadius: 999, background: "#2563eb", fontWeight: 900, fontSize: 12 }}>
                      {ctaText || "—"}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.7)", wordBreak: "break-all" }}>
                    Link: {ctaHref || "#"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

