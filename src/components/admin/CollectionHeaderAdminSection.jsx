import React, { useEffect, useMemo, useState } from "react";
import {
  adminCreateCollectionHeaderSlide,
  adminDeleteCollectionHeaderSlide,
  adminListCollectionHeaderSlides,
  adminReorderCollectionHeaderSlides,
  adminUpdateCollectionHeaderSlide,
  uploadImageToCloudinary,
} from "../../redux/actions";

const empty = { title: "", description: "", imageUrl: "", enabled: true };

export default function CollectionHeaderAdminSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListCollectionHeaderSlides();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Failed to load slides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm(empty);
    setEditId(null);
    setFile(null);
    setModalOpen(true);
    setEditOpen(false);
  };

  const openEdit = (s) => {
    setForm({
      title: String(s?.title || ""),
      description: String(s?.description || ""),
      imageUrl: String(s?.imageUrl || ""),
      enabled: Boolean(s?.enabled ?? true),
    });
    setEditId(Number(s?.id));
    setFile(null);
    setEditOpen(true);
    setModalOpen(false);
  };

  const uploadIfNeeded = async () => {
    if (!file) return String(form.imageUrl || "").trim();
    setUploading(true);
    try {
      return await uploadImageToCloudinary(file);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const imageUrl = await uploadIfNeeded();
      const payload = {
        title: String(form.title || "").trim(),
        description: String(form.description || "").trim(),
        imageUrl: String(imageUrl || "").trim(),
        enabled: Boolean(form.enabled),
      };
      if (!payload.title) throw new Error("Title is required");
      if (!payload.imageUrl) throw new Error("Image is required");
      await adminCreateCollectionHeaderSlide(payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    setError("");
    try {
      const imageUrl = await uploadIfNeeded();
      const payload = {
        title: String(form.title || "").trim(),
        description: String(form.description || "").trim(),
        imageUrl: String(imageUrl || "").trim(),
        enabled: Boolean(form.enabled),
      };
      if (!payload.title) throw new Error("Title is required");
      if (!payload.imageUrl) throw new Error("Image is required");
      await adminUpdateCollectionHeaderSlide(editId, payload);
      setEditOpen(false);
      setEditId(null);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    const id = Number(s?.id);
    if (!Number.isFinite(id)) return;
    if (!window.confirm(`Delete slide "${s?.title || "Slide"}"?`)) return;
    try {
      await adminDeleteCollectionHeaderSlide(id);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to delete");
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
      await adminReorderCollectionHeaderSlides(next.map((it) => ({ id: it.id })));
      await load();
    } catch (e) {
      setError(e?.message || "Failed to reorder");
      await load();
    }
  };

  const Modal = ({ open, title, onClose, children }) => {
    if (!open) return null;
    return (
      <div
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
            width: "min(900px, 100%)",
            background: "#fff",
            borderRadius: 12,
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
  };

  const Form = ({ onSave }) => (
    <div style={{ display: "grid", gap: 12 }}>
      {error ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.06)",
            color: "#991b1b",
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 900, fontSize: 12, color: "#0f172a" }}>Title *</div>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="All products"
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 700 }}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 900, fontSize: 12, color: "#0f172a" }}>Enabled</div>
          <select
            value={form.enabled ? "1" : "0"}
            onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.value === "1" }))}
            style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 800 }}
          >
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontWeight: 900, fontSize: 12, color: "#0f172a" }}>Description</div>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Short description under title"
          style={{ minHeight: 90, borderRadius: 12, border: "1px solid #e5e7eb", padding: 12, fontWeight: 650, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontWeight: 900, fontSize: 12, color: "#0f172a" }}>Banner image *</div>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <input
          value={form.imageUrl}
          onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
          placeholder="Or paste image URL"
          style={{ height: 40, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 12px", fontWeight: 650 }}
        />
      </div>

      <button type="button" className="btn btn-primary" style={{ height: 40 }} onClick={onSave} disabled={saving || uploading}>
        {uploading ? "Uploading…" : saving ? "Saving…" : "Save"}
      </button>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>Collection header</div>
          <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>All products page header carousel</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" style={{ height: 38 }} onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button type="button" className="btn btn-primary" style={{ height: 38 }} onClick={openAdd}>
            + Add slide
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#991b1b", fontWeight: 800 }}>
          {error}
        </div>
      ) : null}

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 90px 210px 170px", padding: "10px 12px", gap: 12, background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontWeight: 950, fontSize: 12 }}>
          <div>#</div>
          <div>Slide</div>
          <div>Status</div>
          <div>Actions</div>
          <div>Order</div>
        </div>

        {loading ? <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>Loading…</div> : null}
        {!loading && items.length === 0 ? <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>No slides yet.</div> : null}

        {!loading &&
          items.map((s, idx) => (
            <div key={String(s?._id || s?.id)} style={{ display: "grid", gridTemplateColumns: "70px 1fr 90px 210px 170px", padding: "10px 12px", gap: 12, borderBottom: "1px solid #f1f5f9", alignItems: "start" }}>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>{s?.id ?? idx + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 950, color: "#0f172a" }}>{s?.title || "—"}</div>
                <div style={{ color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
                  {String(s?.description || "").slice(0, 120)}
                  {String(s?.description || "").length > 120 ? "…" : ""}
                </div>
                {s?.imageUrl ? (
                  <div style={{ marginTop: 10 }}>
                    <img src={s.imageUrl} alt={s.title || "slide"} style={{ width: 160, height: 48, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }} />
                  </div>
                ) : null}
              </div>
              <div style={{ fontWeight: 900, color: s?.enabled ? "#16a34a" : "#ef4444" }}>{s?.enabled ? "On" : "Off"}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-ghost" style={{ height: 32 }} onClick={() => openEdit(s)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger" style={{ height: 32 }} onClick={() => remove(s)}>
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

      <Modal open={modalOpen} title="Add collection header slide" onClose={() => setModalOpen(false)}>
        <Form onSave={save} />
      </Modal>
      <Modal open={editOpen} title={`Edit collection header slide #${editId ?? ""}`} onClose={() => setEditOpen(false)}>
        <Form onSave={saveEdit} />
      </Modal>
    </div>
  );
}

