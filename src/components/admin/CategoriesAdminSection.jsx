import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  uploadImageToCloudinary,
  fetchShopCategories,
  fetchNavMenu,
  saveShopCategories,
  updateShopCategory,
  deleteShopCategory,
} from "../../redux/actions";
import { ensureHttpsUrl } from "../../utils/ensureHttpsUrl";

const isRootCategory = (c) =>
  c == null || c.parentId == null || c.parentId === undefined;

// Separate component to render the categories table
function CategoriesTable({ categories, loading, saving, onDelete, onEdit }) {
  const titleById = useMemo(() => {
    const m = new Map();
    (categories || []).forEach((c) => {
      if (c.id != null) m.set(c.id, c.title);
    });
    return m;
  }, [categories]);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ color: "#4b5563" }}>Preview</th>
            <th style={{ color: "#4b5563" }}>Title</th>
            <th style={{ color: "#4b5563" }}>Parent</th>
            {/* <th style={{ color: "#4b5563" }}>Sort</th> */}
            <th style={{ color: "#4b5563" }}>Products</th>
            <th style={{ color: "#4b5563" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td
                colSpan={6}
                style={{
                  textAlign: "center",
                  padding: "24px",
                  color: "var(--muted)",
                }}
              >
                Loading categories...
              </td>
            </tr>
          )}
          {!loading && categories.length === 0 && (
            <tr>
              <td
                colSpan={6}
                style={{
                  textAlign: "center",
                  padding: "24px",
                  color: "var(--muted)",
                }}
              >
                No categories yet
              </td>
            </tr>
          )}
          {!loading &&
            categories.map((c, index) => (
              <tr key={c.id ?? c._id ?? index}>
                <td>
                  {c.image && (
                    <img
                      src={c.image}
                      alt={c.title}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  )}
                </td>
                <td style={{ fontWeight: 600 }}>{c.title}</td>
                <td style={{ color: "#64748b", fontSize: 13 }}>
                  {isRootCategory(c)
                    ? "—"
                    : titleById.get(c.parentId) || `#${c.parentId}`}
                </td>
                {/* <td style={{ color: "#64748b", fontSize: 13 }}>{c.sortOrder ?? 0}</td> */}
                <td>{c.count}</td>

                <td>
                  <button
                    className="action-btn action-edit"
                    type="button"
                    onClick={() => onEdit(c)}
                    disabled={saving}
                    style={{ marginRight: 8 }}
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn action-del"
                    type="button"
                    onClick={() => onDelete(index)}
                    disabled={saving}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesAdminSection() {
  const dispatch = useDispatch();
  const reduxCategories = useSelector((state) => state.shopCategories || []);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    title: "",
    image: "",
    parentId: "",
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editForm, setEditForm] = useState({
    id: null,
    title: "",
    image: "",
    parentId: "",
    sortOrder: "0",
    productCountDisplay: "0",
  });

  const rootCategoriesOnly = useMemo(
    () => (categories || []).filter(isRootCategory),
    [categories],
  );

  const sortedCategories = useMemo(() => {
    const list = [...(categories || [])];
    list.sort(
      (a, b) =>
        (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
        (Number(a.id) || 0) - (Number(b.id) || 0),
    );
    return list;
  }, [categories]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        await dispatch(fetchShopCategories());
        await dispatch(fetchNavMenu());
      } catch (e) {
        setError("Unable to load categories");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dispatch]);

  useEffect(() => {
    setCategories(Array.isArray(reduxCategories) ? reduxCategories : []);
  }, [reduxCategories]);

  const openEdit = (category) => {
    setError("");
    setEditImageFile(null);
    setEditForm({
      id: category?.id ?? null,
      title: category?.title ?? "",
      image: category?.image ?? "",
      parentId:
        category?.parentId != null && category?.parentId !== undefined
          ? String(category.parentId)
          : "",
      sortOrder: String(category?.sortOrder ?? 0),
      productCountDisplay: String(category?.count ?? "0"),
    });
    setEditModalOpen(true);
  };

  const saveCategories = async (payload) => {
    try {
      setSaving(true);
      setError("");
      await saveShopCategories(payload);
      // Refresh so the UI gets the backend-generated numeric `id` too.
      await dispatch(fetchShopCategories());
      await dispatch(fetchNavMenu());
    } catch (e) {
      setError("Failed to save categories");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    try {
      setError("");
      if (!categoryForm.title) {
        setError("Title is required");
        return;
      }

      let imageUrl = categoryForm.image;

      // If user selected a file, upload to Cloudinary first
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const isSubcategory = Boolean(categoryForm.parentId);
      if (!isSubcategory && !imageUrl) {
        setError("Image is required for top-level categories");
        return;
      }

      // Send only the single new category; backend appends without replacing
      await saveCategories({
        title: categoryForm.title,
        count: categoryForm.count,
        image: ensureHttpsUrl(imageUrl || ""),
        ...(categoryForm.parentId
          ? { parentId: Number(categoryForm.parentId) }
          : {}),
        sortOrder: categoryForm.sortOrder,
      });
      setModalOpen(false);
      setImageFile(null);
      setCategoryForm({
        title: "",
        count: "",
        image: "",
        parentId: "",
        sortOrder: "0",
      });
    } catch (e) {
      setError("Failed to upload image. Please try again.");
    }
  };

  const deleteCategory = async (index) => {
    // index is just UI reference; actual API uses the numeric `id`.
    const category = sortedCategories[index];
    if (!category?.id) return;
    try {
      setSaving(true);
      setError("");
      await deleteShopCategory(category.id);
      setEditModalOpen(false);
      setModalOpen(false);
      await dispatch(fetchShopCategories());
      await dispatch(fetchNavMenu());
    } catch (e) {
      setError("Failed to delete category");
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    try {
      setSaving(true);
      setError("");
      if (!editForm.id) {
        setError("Missing category id");
        return;
      }
      if (!editForm.title) {
        setError("Title is required");
        return;
      }

      let imageUrl = editForm.image;
      if (editImageFile) {
        imageUrl = await uploadImageToCloudinary(editImageFile);
      }
      const isSubcategory =
        editForm.parentId !== "" &&
        editForm.parentId !== null &&
        editForm.parentId !== undefined;
      if (!isSubcategory && !imageUrl) {
        setError("Image is required for top-level categories");
        return;
      }

      const hasChildren = categories.some((c) => c.parentId === editForm.id);
      await updateShopCategory({
        id: editForm.id,
        title: editForm.title,
        image: ensureHttpsUrl(imageUrl || ""),
        sortOrder: editForm.sortOrder,
        ...(!hasChildren
          ? {
              parentId: editForm.parentId
                ? Number(editForm.parentId)
                : null,
            }
          : {}),
      });

      setEditModalOpen(false);
      setEditImageFile(null);
      await dispatch(fetchShopCategories());
      await dispatch(fetchNavMenu());
    } catch (e) {
      setError("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const editCategoryHasChildren =
    editModalOpen && editForm.id != null
      ? categories.some((c) => c.parentId === editForm.id)
      : false;

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Shop Categories</div>
          <div className="section-desc">
            Yahi list <strong>Shop by Categories</strong> aur{" "}
            <strong>header navigation</strong> dono chalati hai (sort order = left‑to‑right).
            Product add karte waqt yahi category / subcategory chuno.
          </div>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setModalOpen(true)}
        >
          + Add Category
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 12,
            fontSize: 13,
            color: "var(--accent2)",
          }}
        >
          {error}
        </div>
      )}

      {/* Table: shows each category with image preview, title, count and image URL */}
      <CategoriesTable
        categories={sortedCategories}
        loading={loading}
        saving={saving}
        onDelete={deleteCategory}
        onEdit={openEdit}
      />

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New Category</div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  value={categoryForm.title}
                  onChange={(e) =>
                    setCategoryForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. Knit Wears"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parent (optional)</label>
                <select
                  className="form-select"
                  value={categoryForm.parentId}
                  onChange={(e) =>
                    setCategoryForm((p) => ({
                      ...p,
                      parentId: e.target.value,
                    }))
                  }
                >
                  <option value="">None — top-level (carousel)</option>
                  {rootCategoriesOnly.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                <div
                  style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}
                >
                  Subcategories are only allowed under a top-level category.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Upload Image
                  {categoryForm.parentId ? (
                    <span
                      style={{
                        fontWeight: 400,
                        color: "var(--muted)",
                      }}
                    >
                      {" "}
                      (optional)
                    </span>
                  ) : null}
                </label>
                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) {
                      setError("Only image files are allowed");
                      return;
                    }
                    setImageFile(file);
                    // local preview
                    const previewUrl = URL.createObjectURL(file);
                    setCategoryForm((p) => ({ ...p, image: previewUrl }));
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={addCategory}
                disabled={saving}
              >
                {saving ? "Saving..." : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setEditModalOpen(false)}
        >
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit Category</div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setEditModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {editForm.image && (
                <img
                  src={editForm.image}
                  alt={editForm.title}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginBottom: 12,
                  }}
                />
              )}

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Category title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Products (from catalog)</label>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}
                >
                  {editForm.productCountDisplay}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  Parent row = is category + direct subcategories ke active products.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sort order</label>
                <input
                  className="form-input"
                  type="number"
                  value={editForm.sortOrder}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, sortOrder: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parent</label>
                {editCategoryHasChildren ? (
                  <div
                    style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}
                  >
                    This category has subcategories. It stays top-level; move or
                    delete subcategories first if you need to change hierarchy.
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={editForm.parentId}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, parentId: e.target.value }))
                    }
                  >
                    <option value="">None — top-level</option>
                    {rootCategoriesOnly
                      .filter((r) => r.id !== editForm.id)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Upload New Image
                  {editForm.parentId || editForm.image ? (
                    <span
                      style={{
                        fontWeight: 400,
                        color: "var(--muted)",
                      }}
                    >
                      {" "}
                      (optional)
                    </span>
                  ) : null}
                </label>
                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    setEditImageFile(file || null);
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={submitEdit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesAdminSection;
