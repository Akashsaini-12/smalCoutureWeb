import React, { useEffect, useMemo, useState } from "react";
import {
  adminCreateTestimonial,
  adminDeleteTestimonial,
  adminListTestimonials,
  adminReorderTestimonials,
  adminUpdateTestimonial,
  uploadImageToCloudinary,
} from "../../redux/actions";

function FieldLabel({ children, required = false }) {
  return (
    <div style={{ fontWeight: 900, fontSize: 12, color: "#0f172a" }}>
      {children}{" "}
      {required ? <span style={{ color: "#ef4444", fontWeight: 950 }}>*</span> : null}
    </div>
  );
}

function clampRating(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso || "");
  }
}

const emptyForm = {
  name: "",
  title: "",
  rating: 5,
  text: "",
  mainImageUrl: "",
  productTitle: "",
  productHref: "",
  productImageUrl: "",
  enabled: true,
};

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label={title}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(920px, 100%)",
          background: "#fff",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 14px 48px rgba(0,0,0,0.25)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>{title}</div>
          <button type="button" className="btn btn-ghost" style={{ height: 36 }} onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

function TestimonialForm({
  error,
  form,
  setForm,
  saving,
  uploading,
  setMainFile,
  setProductFile,
  onSave,
}) {
  const canSave = String(form?.name || "").trim() && String(form?.text || "").trim();
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {error ? (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#991b1b", fontWeight: 800 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <FieldLabel required>Customer name</FieldLabel>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Ayesha K."
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 700 }}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <FieldLabel>Title</FieldLabel>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Love it so much"
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 700 }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <FieldLabel>Rating</FieldLabel>
          <input
            type="number"
            min={1}
            max={5}
            value={form.rating}
            onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 700 }}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <FieldLabel>Enabled</FieldLabel>
          <select
            value={form.enabled ? "1" : "0"}
            onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.value === "1" }))}
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 800 }}
          >
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
        <div />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <FieldLabel required>Review text</FieldLabel>
        <textarea
          value={form.text}
          onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
          placeholder="Write the review…"
          style={{ minHeight: 110, borderRadius: 12, border: "1px solid #e5e7eb", padding: 12, fontWeight: 650, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <FieldLabel>Main image (optional)</FieldLabel>
          <input type="file" accept="image/*" onChange={(e) => setMainFile(e.target.files?.[0] || null)} />
          <input
            value={form.mainImageUrl}
            onChange={(e) => setForm((p) => ({ ...p, mainImageUrl: e.target.value }))}
            placeholder="Or paste image URL"
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 650 }}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <FieldLabel>Product image (optional)</FieldLabel>
          <input type="file" accept="image/*" onChange={(e) => setProductFile(e.target.files?.[0] || null)} />
          <input
            value={form.productImageUrl}
            onChange={(e) => setForm((p) => ({ ...p, productImageUrl: e.target.value }))}
            placeholder="Or paste image URL"
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 650 }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <FieldLabel>Product title</FieldLabel>
          <input
            value={form.productTitle}
            onChange={(e) => setForm((p) => ({ ...p, productTitle: e.target.value }))}
            placeholder="e.g. Denim Jacket"
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 650 }}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <FieldLabel>Product link (href)</FieldLabel>
          <input
            value={form.productHref}
            onChange={(e) => setForm((p) => ({ ...p, productHref: e.target.value }))}
            placeholder="e.g. /products/slug"
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 650 }}
          />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={onSave}
        disabled={!canSave || saving || uploading}
        style={{ height: 40, opacity: !canSave || saving || uploading ? 0.7 : 1 }}
        title={!canSave ? "Name and review text are required" : ""}
      >
        {uploading ? "Uploading…" : saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export default function HappyCustomersAdminSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [mainFile, setMainFile] = useState(null);
  const [productFile, setProductFile] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListTestimonials();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = String(q || "").trim().toLowerCase();
    if (!s) return items;
    return items.filter((t) => {
      const hay = [
        t?.name,
        t?.title,
        t?.text,
        t?.productTitle,
        t?.productHref,
        t?.productImageUrl,
        t?.mainImageUrl,
        t?._id,
        t?.id,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return hay.includes(s);
    });
  }, [items, q]);

  const openAdd = () => {
    setForm(emptyForm);
    setMainFile(null);
    setProductFile(null);
    setEditId(null);
    setModalOpen(true);
    setEditOpen(false);
  };

  const openEdit = (t) => {
    setForm({
      name: String(t?.name || ""),
      title: String(t?.title || ""),
      rating: clampRating(t?.rating ?? 5),
      text: String(t?.text || ""),
      mainImageUrl: String(t?.mainImageUrl || ""),
      productTitle: String(t?.productTitle || ""),
      productHref: String(t?.productHref || ""),
      productImageUrl: String(t?.productImageUrl || ""),
      enabled: Boolean(t?.enabled ?? true),
    });
    setMainFile(null);
    setProductFile(null);
    setEditId(Number(t?.id));
    setEditOpen(true);
    setModalOpen(false);
  };

  const handleUploadIfNeeded = async () => {
    let mainImageUrl = String(form.mainImageUrl || "").trim();
    let productImageUrl = String(form.productImageUrl || "").trim();

    if (mainFile) {
      setUploading(true);
      mainImageUrl = await uploadImageToCloudinary(mainFile);
      setUploading(false);
    }
    if (productFile) {
      setUploading(true);
      productImageUrl = await uploadImageToCloudinary(productFile);
      setUploading(false);
    }
    return { mainImageUrl, productImageUrl };
  };

  const saveNew = async () => {
    setSaving(true);
    setError("");
    try {
      const { mainImageUrl, productImageUrl } = await handleUploadIfNeeded();
      const payload = {
        ...form,
        rating: clampRating(form.rating),
        mainImageUrl,
        productImageUrl,
      };
      await adminCreateTestimonial(payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to save testimonial");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    setError("");
    try {
      const { mainImageUrl, productImageUrl } = await handleUploadIfNeeded();
      const payload = {
        ...form,
        rating: clampRating(form.rating),
        mainImageUrl,
        productImageUrl,
      };
      await adminUpdateTestimonial(editId, payload);
      setEditOpen(false);
      setEditId(null);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to update testimonial");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const remove = async (t) => {
    const id = Number(t?.id);
    if (!Number.isFinite(id)) return;
    if (!window.confirm(`Delete testimonial "${t?.name || "Customer"}"?`)) return;
    try {
      await adminDeleteTestimonial(id);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to delete testimonial");
    }
  };

  const move = async (idx, dir) => {
    const next = [...items];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    setItems(next);
    try {
      await adminReorderTestimonials(next.map((it) => ({ id: it.id })));
      await load();
    } catch (e) {
      setError(e?.message || "Failed to reorder");
      await load();
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>Happy customers</div>
          <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>Manage homepage testimonials</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            style={{ height: 38, width: 280, maxWidth: "100%", borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 700 }}
          />
          <button type="button" className="btn btn-ghost" style={{ height: 38 }} onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button type="button" className="btn btn-primary" style={{ height: 38 }} onClick={openAdd}>
            + Add review
          </button>
        </div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "auto", background: "#fff", maxHeight: "70vh" }}>
        <div style={{ minWidth: 980 }}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 110px 90px 120px 180px 170px", padding: "10px 12px", gap: 12, background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontWeight: 950, fontSize: 12 }}>
          <div>#</div>
          <div>Review</div>
          <div>Rating</div>
          <div>Status</div>
          <div>Date</div>
          <div>Actions</div>
          <div>Order</div>
        </div>

        {loading ? <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>Loading…</div> : null}
        {!loading && filtered.length === 0 ? <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>No reviews found.</div> : null}

        {!loading &&
          filtered.map((t, idx) => (
            <div key={String(t?._id || t?.id)} style={{ display: "grid", gridTemplateColumns: "70px 1fr 110px 90px 120px 180px 170px", padding: "10px 12px", gap: 12, borderBottom: "1px solid #f1f5f9", alignItems: "start" }}>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>{t?.id ?? idx + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 950, color: "#0f172a" }}>{t?.name || "—"}</div>
                <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>{t?.title || "—"}</div>
                <div style={{ color: "#334155", marginTop: 6, lineHeight: 1.5 }}>
                  {String(t?.text || "").slice(0, 120)}
                  {String(t?.text || "").length > 120 ? "…" : ""}
                </div>
                {(t?.productTitle || t?.productHref) ? (
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                    {t?.productTitle ? <span style={{ marginRight: 8 }}>{t.productTitle}</span> : null}
                    {t?.productHref ? (
                      <a
                        href={String(t.productHref)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#2563eb", wordBreak: "break-all" }}
                        title={String(t.productHref)}
                      >
                        {String(t.productHref)}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>{clampRating(t?.rating ?? 5)} / 5</div>
              <div style={{ fontWeight: 900, color: t?.enabled ? "#16a34a" : "#ef4444" }}>{t?.enabled ? "Enabled" : "Hidden"}</div>
              <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>{fmtDate(t?.createdAt)}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-ghost" style={{ height: 32 }} onClick={() => openEdit(t)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger" style={{ height: 32 }} onClick={() => remove(t)}>
                  Delete
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ height: 32 }} onClick={() => move(idx, -1)} disabled={idx === 0}>
                  ↑
                </button>
                <button type="button" className="btn btn-ghost" style={{ height: 32 }} onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} title="Add review" onClose={() => setModalOpen(false)}>
        <TestimonialForm
          error={error}
          form={form}
          setForm={setForm}
          saving={saving}
          uploading={uploading}
          setMainFile={setMainFile}
          setProductFile={setProductFile}
          onSave={saveNew}
        />
      </Modal>
      <Modal open={editOpen} title={`Edit review #${editId ?? ""}`} onClose={() => setEditOpen(false)}>
        <TestimonialForm
          error={error}
          form={form}
          setForm={setForm}
          saving={saving}
          uploading={uploading}
          setMainFile={setMainFile}
          setProductFile={setProductFile}
          onSave={saveEdit}
        />
      </Modal>
    </div>
  );
}

