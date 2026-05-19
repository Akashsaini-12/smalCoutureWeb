import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  adminCreateMixMatchLook,
  adminDeleteMixMatchLook,
  adminListMixMatchLooks,
  adminReorderMixMatchLooks,
  adminSeedDefaultMixMatchLooks,
  adminUpdateMixMatchLook,
  adminUpsertMixMatchLookItems,
  fetchCatalogProductsAdmin,
  uploadImageToCloudinary,
} from "../../redux/actions";

const emptyForm = {
  title: "",
  headingText: "",
  // Legacy single-image field kept for backward compatibility with older looks.
  // New looks should use before/after images.
  heroImageUrl: "",
  heroImageAlt: "",
  beforeImageUrl: "",
  afterImageUrl: "",
  isActive: true,
  sortOrder: 0,
  products: [],
};

function toLookPayload(form) {
  return {
    title: String(form.title || "").trim(),
    headingText: String(form.headingText || "").trim(),
    heroImageUrl: String(form.heroImageUrl || "").trim(),
    heroImageAlt: String(form.heroImageAlt || "").trim(),
    beforeImageUrl: String(form.beforeImageUrl || "").trim(),
    afterImageUrl: String(form.afterImageUrl || "").trim(),
    isActive: Boolean(form.isActive),
    sortOrder: Number(form.sortOrder || 0),
  };
}

export default function MixMatchAdminSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [looks, setLooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [beforeUploading, setBeforeUploading] = useState(false);
  const [beforeUploadFile, setBeforeUploadFile] = useState(null);
  const [afterUploading, setAfterUploading] = useState(false);
  const [afterUploadFile, setAfterUploadFile] = useState(null);

  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [view, setView] = useState("list"); // "list" | "form"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const seedDefaults = async () => {
    const ok = window.confirm(
      "Insert default Mix & Match looks into table? This works only when table is empty.",
    );
    if (!ok) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await adminSeedDefaultMixMatchLooks();
      const count = Number(res?.count || 0);
      const msg = count > 0 ? `Inserted ${count} default looks` : "Default looks inserted";
      toast.success(msg);
      setSuccess(msg);
      await loadLooks();
    } catch (e) {
      toast.error(e?.message || "Failed to insert default looks");
      setError(e?.message || "Failed to insert default looks");
    } finally {
      setSaving(false);
    }
  };

  const loadLooks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListMixMatchLooks();
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setLooks(items);
    } catch (e) {
      setLooks([]);
      setError(e?.message || "Failed to load Mix & Match looks");
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await fetchCatalogProductsAdmin({ page: 1, limit: 200, query: catalogQuery || undefined });
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setCatalogProducts(items);
    } catch {
      setCatalogProducts([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadLooks();
  }, []);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSuccess("");
    setError("");
    setBeforeUploading(false);
    setBeforeUploadFile(null);
    setAfterUploading(false);
    setAfterUploadFile(null);
  };

  const editLook = (look) => {
    setView("form");
    setEditingId(String(look?._id || look?.id || ""));
    const legacyHero = String(look?.heroImageUrl || look?.imageUrl || "").trim();
    const before = String(look?.beforeImageUrl || "").trim() || legacyHero;
    const items = Array.isArray(look?.products)
      ? look.products.map((p, idx) => ({
          productId: String(p?.productId || p?._id || p?.id || ""),
          position: Number(p?.position ?? idx),
          customLabel: String(p?.customLabel || ""),
        }))
      : [];
    setForm({
      title: look?.title || "",
      headingText: look?.headingText || look?.heading || "",
      heroImageUrl: legacyHero,
      heroImageAlt: look?.heroImageAlt || look?.image?.alt || "",
      beforeImageUrl: before,
      afterImageUrl: look?.afterImageUrl || "",
      isActive: Boolean(look?.isActive ?? true),
      sortOrder: Number(look?.sortOrder || 0),
      products: items,
    });
    setSuccess("");
    setError("");
    setBeforeUploading(false);
    setBeforeUploadFile(null);
    setAfterUploading(false);
    setAfterUploadFile(null);
  };

  const startCreate = () => {
    resetForm();
    setView("form");
  };

  const uploadBeforeImage = async () => {
    if (!beforeUploadFile) {
      toast.error("Please select an image");
      return;
    }
    setBeforeUploading(true);
    try {
      const url = await uploadImageToCloudinary(beforeUploadFile);
      setForm((p) => ({ ...p, beforeImageUrl: String(url || "").trim() }));
      toast.success("Before image uploaded");
    } catch (e) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBeforeUploading(false);
    }
  };

  const uploadAfterImage = async () => {
    if (!afterUploadFile) {
      toast.error("Please select an image");
      return;
    }
    setAfterUploading(true);
    try {
      const url = await uploadImageToCloudinary(afterUploadFile);
      setForm((p) => ({ ...p, afterImageUrl: String(url || "").trim() }));
      toast.success("After image uploaded");
    } catch (e) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setAfterUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // If admin selected a file but hasn't uploaded yet, upload first and use that URL.
      let nextForm = form;
      if (beforeUploadFile && !String(nextForm.beforeImageUrl || "").trim()) {
        try {
          setBeforeUploading(true);
          const url = await uploadImageToCloudinary(beforeUploadFile);
          nextForm = {
            ...nextForm,
            beforeImageUrl: String(url || "").trim(),
          };
          setForm(nextForm);
          toast.success("Before image uploaded");
        } finally {
          setBeforeUploading(false);
        }
      }
      if (afterUploadFile && !String(nextForm.afterImageUrl || "").trim()) {
        try {
          setAfterUploading(true);
          const url = await uploadImageToCloudinary(afterUploadFile);
          nextForm = { ...nextForm, afterImageUrl: String(url || "").trim() };
          setForm(nextForm);
          toast.success("After image uploaded");
        } finally {
          setAfterUploading(false);
        }
      }

      const hasBefore = Boolean(String(nextForm.beforeImageUrl || "").trim());
      const hasHero = Boolean(String(nextForm.heroImageUrl || "").trim());
      if (!hasBefore && !hasHero) {
        throw new Error("Before image is required");
      }

      let lookId = editingId;
      if (editingId) {
        await adminUpdateMixMatchLook(editingId, toLookPayload(nextForm));
      } else {
        const created = await adminCreateMixMatchLook(toLookPayload(nextForm));
        lookId = String(created?.item?._id || created?._id || "");
      }

      if (lookId) {
        await adminUpsertMixMatchLookItems(
          lookId,
          (form.products || []).map((it, idx) => ({
            productId: String(it.productId || ""),
            position: Number(it.position ?? idx),
            customLabel: String(it.customLabel || ""),
          })),
        );
      }
      toast.success(editingId ? "Look updated successfully" : "Look created successfully");
      setSuccess(editingId ? "Look updated successfully" : "Look created successfully");
      await loadLooks();
      resetForm();
    } catch (err) {
      toast.error(err?.message || "Failed to save look");
      setError(err?.message || "Failed to save look");
    } finally {
      setSaving(false);
    }
  };

  const deleteLook = async (id) => {
    if (!id) return;
    const ok = window.confirm("Delete this Mix & Match look?");
    if (!ok) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await adminDeleteMixMatchLook(id);
      await loadLooks();
      if (editingId === id) resetForm();
      toast.success("Look deleted");
      setSuccess("Look deleted");
    } catch (e) {
      toast.error(e?.message || "Failed to delete look");
      setError(e?.message || "Failed to delete look");
    } finally {
      setSaving(false);
    }
  };

  const moveLook = async (id, direction) => {
    const index = looks.findIndex((l) => String(l?._id || l?.id) === String(id));
    if (index < 0) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= looks.length) return;
    const next = [...looks];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    setLooks(next);
    try {
      await adminReorderMixMatchLooks(
        next.map((l, idx) => ({
          id: l?._id || l?.id,
          sortOrder: idx,
        })),
      );
    } catch (e) {
      toast.error(e?.message || "Failed to reorder looks");
      setError(e?.message || "Failed to reorder looks");
      await loadLooks();
    }
  };

  const selectedProductMap = useMemo(() => {
    const m = new Map();
    for (const p of catalogProducts) {
      const id = String(p?._id || p?.id || "");
      if (id) m.set(id, p);
    }
    return m;
  }, [catalogProducts]);

  const addProduct = (productId) => {
    if (!productId) return;
    if (form.products.some((p) => p.productId === productId)) {
      toast.info("Product already added");
      return;
    }
    setForm((prev) => ({
      ...prev,
      products: [...prev.products, { productId, position: prev.products.length, customLabel: "" }],
    }));
    toast.success("Product linked");
  };

  const removeProduct = (idx) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx).map((p, i) => ({ ...p, position: i })),
    }));
  };

  const moveProduct = (idx, dir) => {
    setForm((prev) => {
      const arr = [...prev.products];
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return prev;
      const [row] = arr.splice(idx, 1);
      arr.splice(target, 0, row);
      return { ...prev, products: arr.map((p, i) => ({ ...p, position: i })) };
    });
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Mix & Match</div>
          <div className="section-desc">Manage look cards and linked products</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setView("list")}
              style={{
                height: 36,
                borderRadius: 0,
                border: 0,
                fontWeight: 800,
                background: view === "list" ? "#111827" : "transparent",
                color: view === "list" ? "#fff" : "#0f172a",
              }}
            >
              Looks list
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => (view === "form" ? setView("form") : startCreate())}
              style={{
                height: 36,
                borderRadius: 0,
                border: 0,
                fontWeight: 800,
                background: view === "form" ? "#111827" : "transparent",
                color: view === "form" ? "#fff" : "#0f172a",
              }}
            >
              {editingId ? "Edit look" : "Create look"}
            </button>
          </div>

          {view === "list" ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={loadLooks} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button type="button" className="btn btn-primary" onClick={startCreate}>
                + New look
              </button>
              <button type="button" className="btn btn-ghost" onClick={seedDefaults} disabled={saving}>
                Seed defaults
              </button>
            </>
          ) : (
            <>
        <button
          type="button"
          className="btn btn-ghost"
                onClick={() => {
                  resetForm();
                  setView("list");
                }}
              >
                ← Back to list
        </button>
            </>
          )}
        </div>
      </div>

      {error ? <div style={{ marginBottom: 10, color: "#dc2626", fontWeight: 700 }}>{error}</div> : null}
      {success ? <div style={{ marginBottom: 10, color: "#166534", fontWeight: 700 }}>{success}</div> : null}

      {view === "list" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Look</th>
                <th>Status</th>
                <th>Order</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>
                    Loading looks...
                  </td>
                </tr>
              ) : looks.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>
                    No looks found
                  </td>
                </tr>
              ) : (
                looks.map((look, idx) => {
                  const id = String(look?._id || look?.id || "");
                  return (
                    <tr key={id || idx}>
                      <td style={{ fontWeight: 700 }}>{look?.headingText || look?.title || "Look"}</td>
                      <td>
                        <span className={`status-pill ${look?.isActive ? "status-active" : "status-inactive"}`}>
                          {look?.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td>{Number(look?.sortOrder ?? idx)}</td>
                      <td style={{ textAlign: "right" }}>
                        {/* <button className="action-btn action-edit" type="button" onClick={() => moveLook(id, "up")} title="Move up">↑</button>
                        <button className="action-btn action-edit" type="button" onClick={() => moveLook(id, "down")} title="Move down">↓</button> */}
                        <button className="action-btn action-edit" type="button" onClick={() => editLook(look)} title="Edit">✏️</button>
                        <button className="action-btn action-del" type="button" onClick={() => deleteLook(id)} title="Delete">🗑️</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <form
          className="table-wrap"
          onSubmit={onSubmit}
          style={{ padding: isMobile ? 12 : 14, maxWidth: 980 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, marginBottom: 2, color: "#111827" }}>
              {editingId ? "Edit look" : "Create look"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update look" : "Create look"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Reset
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <input className="form-input" placeholder="Internal title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            <input className="form-input" placeholder="Heading text (frontend)" value={form.headingText} onChange={(e) => setForm((p) => ({ ...p, headingText: e.target.value }))} />
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 800, color: "#111827", fontSize: 13 }}>
                Before/After
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <input className="form-input" placeholder="Before image URL" value={form.beforeImageUrl} readOnly />
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBeforeUploadFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    />
                    <button type="button" className="btn btn-ghost" onClick={uploadBeforeImage} disabled={beforeUploading || saving}>
                      {beforeUploading ? "Uploading..." : "Upload before"}
                    </button>
                    {form.beforeImageUrl ? (
                      <a href={form.beforeImageUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ textDecoration: "none" }}>
                        Preview
                      </a>
                    ) : null}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <input className="form-input" placeholder="After image URL" value={form.afterImageUrl} readOnly />
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAfterUploadFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    />
                    <button type="button" className="btn btn-ghost" onClick={uploadAfterImage} disabled={afterUploading || saving}>
                      {afterUploading ? "Uploading..." : "Upload after"}
                    </button>
                    {form.afterImageUrl ? (
                      <a href={form.afterImageUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ textDecoration: "none" }}>
                        Preview
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
              <div style={{ color: "#64748b", fontSize: 12, fontWeight: 650, lineHeight: 1.35 }}>
                Upload Before image (required). If you also upload After image, storefront will show a draggable Before/After slider.
              </div>
            </div>
            <input className="form-input" placeholder="Hero image alt" value={form.heroImageAlt} onChange={(e) => setForm((p) => ({ ...p, heroImageAlt: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input className="form-input" type="number" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#334155" }}>
                <input type="checkbox" checked={Boolean(form.isActive)} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                Active
              </label>
            </div>
          </div>

          <div style={{ marginTop: 14, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <strong style={{ color: "#111827" }}>Linked products</strong>
              <button type="button" className="btn btn-ghost" onClick={loadCatalog} disabled={catalogLoading}>
                {catalogLoading ? "Loading..." : "Refresh products"}
              </button>
            </div>
            <input
              className="form-input"
              placeholder="Filter by product name"
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div
              style={{
                maxHeight: isMobile ? 160 : 120,
                overflow: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 8,
              }}
            >
              {catalogProducts
                .filter((p) => String(p?.name || "").toLowerCase().includes(String(catalogQuery || "").toLowerCase()))
                .slice(0, 50)
                .map((p) => {
                  const pid = String(p?._id || p?.id || "");
                  return (
                    <div key={pid} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "4px 0" }}>
                      <span style={{ fontSize: 13, color: "#334155" }}>{p?.name}</span>
                      <button type="button" className="btn btn-ghost" onClick={() => addProduct(pid)}>Add</button>
                    </div>
                  );
                })}
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {form.products.map((lp, idx) => {
                const product = selectedProductMap.get(String(lp.productId));
                return (
                  <div key={`${lp.productId}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>
                      {product?.name || lp.productId}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="action-btn action-edit" onClick={() => moveProduct(idx, "up")} title="Move up">↑</button>
                      <button type="button" className="action-btn action-edit" onClick={() => moveProduct(idx, "down")} title="Move down">↓</button>
                      <button type="button" className="action-btn action-del" onClick={() => removeProduct(idx)} title="Remove">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </form>
      )}
    </div>
  );
}

