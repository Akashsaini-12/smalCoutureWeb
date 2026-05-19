import React, { useEffect, useState } from "react";
import {
  deleteCatalogProduct,
  fetchCatalogProductsAdmin,
  fetchMasterCategories,
  updateCatalogProduct,
} from "../../redux/actions";

function ProductsAdminSection({ onEditProduct } = {}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    categoryId: "",
    price: "",
    discountPrice: "",
    description: "",
    status: "active",
    rating: "0",
    numReviews: "0",
    isFeatured: "no",
  });
  const [deleteSavingId, setDeleteSavingId] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchCatalogProductsAdmin({
        page: 1,
        limit: 1000,
      });
      const items = Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response)
          ? response
          : [];
      setProducts(items);
    } catch (e) {
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const loadCats = async () => {
      try {
        const data = await fetchMasterCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      }
    };
    loadCats();
  }, []);

  const categoryTitleById = React.useMemo(() => {
    const map = new Map();
    for (const c of categories || []) {
      const id = c?.id ?? c?._id;
      if (id == null) continue;
      map.set(String(id), String(c?.title || ""));
    }
    return map;
  }, [categories]);

  const getCategoryTitle = (categoryId) => {
    const id = categoryId == null ? "" : String(categoryId);
    return categoryTitleById.get(id) || "";
  };

  const filteredProducts = React.useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return products;
    return (Array.isArray(products) ? products : []).filter((p) => {
      const name = String(p?.name || "").toLowerCase();
      const status = String(p?.status || "").toLowerCase();
      const catText = (Array.isArray(p?.categoryIds) && p.categoryIds.length
        ? p.categoryIds.map((id) => getCategoryTitle(id) || id).join(", ")
        : getCategoryTitle(p?.categoryId) || p?.categoryId || ""
      );
      const cats = String(catText || "").toLowerCase();
      return name.includes(q) || cats.includes(q) || status.includes(q);
    });
  }, [products, search, categoryTitleById]);

  const getProductTotalStock = (p) => {
    // Supports multiple schemas:
    // - variants[].sizes[].stock
    // - variants[].stockAll (single stock for variant)
    // - variants[].stock
    // - p.stock / p.inventory (fallback)
    try {
      const variants = Array.isArray(p?.variants) ? p.variants : [];
      if (variants.length) {
        let total = 0;
        let sawAny = false;
        for (const v of variants) {
          const sizes = Array.isArray(v?.sizes) ? v.sizes : [];
          if (sizes.length) {
            for (const s of sizes) {
              const n = Number(s?.stock);
              if (Number.isFinite(n)) {
                total += Math.max(0, Math.floor(n));
                sawAny = true;
              }
            }
            continue;
          }
          const n1 = Number(v?.stockAll);
          if (Number.isFinite(n1)) {
            total += Math.max(0, Math.floor(n1));
            sawAny = true;
            continue;
          }
          const n2 = Number(v?.stock);
          if (Number.isFinite(n2)) {
            total += Math.max(0, Math.floor(n2));
            sawAny = true;
          }
        }
        if (sawAny) return total;
      }

      const fallback =
        p?.stock ??
        p?.inventory ??
        p?.inventoryQty ??
        p?.inventoryQuantity ??
        p?.qty ??
        p?.quantity;
      const n = Number(fallback);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    } catch {
      return 0;
    }
  };

  const openEdit = (p) => {
    const id = p?._id || p.id;
    // Route to the full editor so variants/images are editable.
    if (onEditProduct && id) {
      onEditProduct(id);
      return;
    }

    setEditingProduct(p);
    setEditForm({
      name: p?.name ?? "",
      // Allow showing multiple categories in the simple editor.
      categoryId: Array.isArray(p?.categoryIds) && p.categoryIds.length
        ? p.categoryIds.map((x) => String(x)).join(",")
        : p?.categoryId != null
          ? String(p.categoryId)
          : "",
      price: p?.price != null ? String(p.price) : "",
      discountPrice: p?.discountPrice != null ? String(p.discountPrice) : "",
      description: p?.description ?? "",
      status: p?.status ?? "active",
      rating: p?.rating != null ? String(p.rating) : "0",
      numReviews: p?.numReviews != null ? String(p.numReviews) : "0",
      isFeatured: p?.isFeatured ? "yes" : "no",
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditingProduct(null);
  };

  const submitEdit = async () => {
    if (!editingProduct?._id) return;
    setEditSaving(true);
    try {
      const catNums = String(editForm.categoryId || "")
        .split(",")
        .map((s) => Number(String(s).trim()))
        .filter((n) => Number.isFinite(n));

      if (!catNums.length) {
        setError("Category Id(s) is required");
        return;
      }

      // Multi-category schema: preserve admin selection (dedupe only exact duplicates).
      const normalizedCatNums = (() => {
        const seen = new Set();
        const next = [];
        for (const n of catNums) {
          const k = String(n);
          if (seen.has(k)) continue;
          seen.add(k);
          next.push(n);
        }
        return next;
      })();

      const payloadBase = {
        name: editForm.name,
        price: Number(editForm.price),
        discountPrice:
          editForm.discountPrice === ""
            ? undefined
            : Number(editForm.discountPrice),
        description: editForm.description,
        status: editForm.status,
        rating: Number(editForm.rating || 0),
        numReviews: Number(editForm.numReviews || 0),
        isFeatured: editForm.isFeatured === "yes",
        // Keep variants untouched for now.
        variants: Array.isArray(editingProduct.variants) ? editingProduct.variants : [],
        brand: editingProduct.brand ?? "",
      };

      // Update the current product to include all selected categories.
      await updateCatalogProduct(editingProduct._id, {
        ...payloadBase,
        categoryIds: normalizedCatNums,
        // Legacy compat: also send categoryId as the "primary" category.
        categoryId: normalizedCatNums[0],
      });
      closeEdit();
      await loadProducts();
    } catch (e) {
      setError(e?.message || "Failed to update product");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!id) return;
    const ok = window.confirm("Delete this catalog product?");
    if (!ok) return;
    setDeleteSavingId(id);
    setError("");
    try {
      await deleteCatalogProduct(id);
      await loadProducts();
    } catch (e) {
      setError(e?.message || "Failed to delete product");
    } finally {
      setDeleteSavingId(null);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Products</div>
          <div className="section-desc">Manage your product catalog</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <input
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{ flex: "1 1 260px", minWidth: 180, maxWidth: 420 }}
          />
          {!!search && (
            <button className="btn btn-ghost" type="button" onClick={() => setSearch("")}>
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="table-wrap">
        {error && (
          <div style={{ marginBottom: 8, fontSize: 13, color: "var(--accent2)" }}>
            {error}
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price (₹)</th>
              <th>Variants</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--muted)",
                  }}
                >
                  Loading products...
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--muted)",
                  }}
                >
                  No products yet
                </td>
              </tr>
            )}
            {!loading && products.length > 0 && filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "22px",
                    color: "var(--muted)",
                  }}
                >
                  No products match “{String(search || "").trim()}”
                </td>
              </tr>
            )}
            {filteredProducts.map((p) => (
              <tr key={p._id || p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: "var(--muted)" }}>
                  {Array.isArray(p.categoryIds) && p.categoryIds.length
                    ? p.categoryIds.map((id) => getCategoryTitle(id) || id).join(", ")
                    : getCategoryTitle(p.categoryId) || p.categoryId}
                </td>
                <td
                  style={{
                    color: "var(--accent3)",
                    fontWeight: 600,
                  }}
                >
                  ₹{Number(p.price || 0).toLocaleString()}
                </td>
                <td
                  style={{
                    color: "var(--text)",
                  }}
                >
                  {Array.isArray(p.variants) ? p.variants.length : 0}
                </td>
                <td>
                  {(() => {
                    const stock = getProductTotalStock(p);
                    const inStock = stock > 0;
                    return (
                      <span
                        className={`status-pill ${
                          inStock ? "status-active" : "status-oos"
                        }`}
                        title={inStock ? "In stock" : "Out of stock"}
                      >
                        {inStock ? "In stock" : "Out of stock"} ({stock})
                      </span>
                    );
                  })()}
                </td>
                <td>
                  <span
                    className={`status-pill ${
                      p.status === "active" ? "status-active" : "status-oos"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      className="action-btn action-edit"
                      type="button"
                      onClick={() => openEdit(p)}
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn action-del"
                      type="button"
                      onClick={() => deleteProduct(p._id || p.id)}
                      disabled={deleteSavingId === (p._id || p.id)}
                      title="Delete product"
                    >
                      {deleteSavingId === (p._id || p.id) ? "…" : "🗑️"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editOpen && editingProduct && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
          role="dialog"
          aria-label="Edit catalog product"
        >
          <div
            className="modal"
            style={{
              width: "min(720px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 18,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>Edit Product</div>
              <button className="btn btn-ghost" type="button" onClick={closeEdit}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category Id(s) *</label>
                  <input className="form-input" value={editForm.categoryId} onChange={(e) => setEditForm((p) => ({ ...p, categoryId: e.target.value }))} />
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                    Enter one ID or comma-separated IDs (e.g. `1` or `1,2,3`).
                  </div>
                  {!!getCategoryTitle(editForm.categoryId) && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                      Category: {getCategoryTitle(editForm.categoryId)}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price *</label>
                  <input className="form-input" value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Price</label>
                  <input className="form-input" value={editForm.discountPrice} onChange={(e) => setEditForm((p) => ({ ...p, discountPrice: e.target.value }))} placeholder="optional" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <input className="form-input" value={editForm.rating} onChange={(e) => setEditForm((p) => ({ ...p, rating: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Num Reviews</label>
                  <input className="form-input" value={editForm.numReviews} onChange={(e) => setEditForm((p) => ({ ...p, numReviews: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Featured</label>
                <select className="form-select" value={editForm.isFeatured} onChange={(e) => setEditForm((p) => ({ ...p, isFeatured: e.target.value }))}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 13 }}>
                Variants: {Array.isArray(editingProduct.variants) ? editingProduct.variants.length : 0} (not editable here)
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" type="button" onClick={closeEdit}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="button" onClick={submitEdit} disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProductsAdminSection;
