import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSliderSlides,
  fetchShopCategories,
  createSliderSlide,
  updateSliderSlide,
  deleteSliderSlide,
  uploadImageToCloudinary,
} from "../../redux/actions";
import { ensureHttpsUrl } from "../../utils/ensureHttpsUrl";

const SLIDES_API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (typeof window !== "undefined"
    ? `http://${window.location.hostname}:4000`
    : "");

async function fetchCategoriesForSlidesAdmin() {
  if (!SLIDES_API_BASE) return [];
  const res = await fetch(`${SLIDES_API_BASE}/api/categories`);
  if (!res.ok) throw new Error(`Categories request failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .map((c) => {
      const id = c.id != null ? Number(c.id) : NaN;
      if (!Number.isFinite(id)) return null;
      return {
        id,
        title: String(c.title || "").trim() || `Category #${id}`,
        parentId:
          c.parentId != null && c.parentId !== ""
            ? Number(c.parentId)
            : null,
        sortOrder: Number(c.sortOrder) || 0,
      };
    })
    .filter(Boolean);
}

function SlidesAdminSection() {
  const [slides, setSlides] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [slideForm, setSlideForm] = useState({
    title: "",
    subtitleLine1: "",
    subtitleLine2: "",
    image: "",
    categoryId: "",
    status: "Active",
    order: "",
  });

  const [editSlideId, setEditSlideId] = useState(null);
  const [editUploading, setEditUploading] = useState(false);
  const [editUploadError, setEditUploadError] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editSlideForm, setEditSlideForm] = useState({
    title: "",
    subtitleLine1: "",
    subtitleLine2: "",
    image: "",
    categoryId: "",
  });

  const reduxSlides = useSelector((state) => state.slider);
  const shopCategories = useSelector((state) => state.shopCategories || []);
  const dispatch = useDispatch();

  const [slideCategories, setSlideCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

  const loadSlideCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError("");
    try {
      const rows = await fetchCategoriesForSlidesAdmin();
      setSlideCategories(rows);
    } catch (e) {
      setCategoriesError(
        e?.message || "Could not load categories. Check API / backend.",
      );
      setSlideCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchSliderSlides());
    dispatch(fetchShopCategories());
    loadSlideCategories();
  }, [dispatch]);

  useEffect(() => {
    if (!modalOpen && !editModalOpen) return;
    loadSlideCategories();
  }, [modalOpen, editModalOpen]);

  const categoryRows = useMemo(() => {
    if (slideCategories.length) return slideCategories;
    return (shopCategories || [])
      .map((c) => {
        const id = c.id != null ? Number(c.id) : NaN;
        if (!Number.isFinite(id)) return null;
        return {
          id,
          title: String(c.title || "").trim() || `Category #${id}`,
          parentId:
            c.parentId != null && c.parentId !== ""
              ? Number(c.parentId)
              : null,
          sortOrder: Number(c.sortOrder) || 0,
        };
      })
      .filter(Boolean);
  }, [slideCategories, shopCategories]);

  const categoryTitleById = useMemo(() => {
    const m = new Map();
    categoryRows.forEach((c) => {
      if (c && c.id != null) m.set(Number(c.id), c.title || "");
    });
    return m;
  }, [categoryRows]);

  const sortedCategoryRows = useMemo(
    () =>
      [...categoryRows].sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.id ?? 0) - (b.id ?? 0),
      ),
    [categoryRows],
  );

  const editCategorySelectRows = useMemo(() => {
    const raw = editSlideForm.categoryId;
    if (raw === "" || raw == null) return sortedCategoryRows;
    const has = sortedCategoryRows.some((c) => String(c.id) === String(raw));
    if (has) return sortedCategoryRows;
    const n = Number(raw);
    if (!Number.isFinite(n)) return sortedCategoryRows;
    return [
      {
        id: n,
        title: `Category #${n} (reload list if missing)`,
        parentId: null,
        sortOrder: -999,
      },
      ...sortedCategoryRows,
    ];
  }, [sortedCategoryRows, editSlideForm.categoryId]);

  // Helper: normalise image URL from different backend shapes (always https)
  const getSlideImage = (slide) => {
    let raw = "";
    if (typeof slide.images === "string" && slide.images) raw = slide.images;
    else if (slide.images?.desktop?.src) raw = slide.images.desktop.src;
    else if (slide.image) raw = slide.image;
    return ensureHttpsUrl(raw);
  };

  useEffect(() => {
    if (reduxSlides && reduxSlides.length > 0) {
      setSlides(
        reduxSlides.map((slide) => ({
          id: slide.id || slide._id,
          // backend: title = "New Arrivals" (string), subtitle = ["line1", "line2"]
          title: slide.title || "",
          subtitle: Array.isArray(slide.subtitle)
            ? slide.subtitle
            : [slide.subtitle || "", ""],
          image: getSlideImage(slide),
          categoryId:
            slide.categoryId != null && Number.isFinite(Number(slide.categoryId))
              ? Number(slide.categoryId)
              : null,
          status: "Active",
          order: slide.id || slide._id,
        })),
      );
    }
  }, [reduxSlides]);

  const addSlide = async () => {
    try {
      setUploading(true);
      setUploadError("");

      let imageUrl = slideForm.image;

      // If a file was chosen, upload it now (on submit)
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      } else if (imageUrl && !imageUrl.startsWith("blob:")) {
        imageUrl = ensureHttpsUrl(imageUrl);
      }
      const payload = {
        title: slideForm.title,
        subtitle: [slideForm.subtitleLine1, slideForm.subtitleLine2],
        imageUrl: ensureHttpsUrl(imageUrl),
        categoryId:
          slideForm.categoryId === "" || slideForm.categoryId == null
            ? null
            : Number(slideForm.categoryId),
      };

      // Call shared API helper; throws on error.
      const saved = await createSliderSlide(payload);

      const newSlide = {
        id: saved.id,
        title: saved.title,
        subtitle: saved.subtitle,
        image: saved.images || imageUrl,
        categoryId:
          saved.categoryId != null && Number.isFinite(Number(saved.categoryId))
            ? Number(saved.categoryId)
            : null,
        status: slideForm.status,
        order: saved.id,
      };

      // If API call was successful, update UI and clear form/modal
      setSlides((prev) => [...prev, newSlide]);
      setModalOpen(false);
      setImageFile(null);
      setSlideForm({
        title: "",
        subtitleLine1: "",
        subtitleLine2: "",
        image: "",
        categoryId: "",
        status: "Active",
        order: "",
      });
    } catch (err) {
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const deleteSlide = async (id) => {
    if (!id) return;
    const ok = window.confirm("Delete this slider slide?");
    if (!ok) return;
    setDeletingId(id);
    setUploadError("");
    try {
      await deleteSliderSlide(id);
      dispatch(fetchSliderSlides());
    } catch (err) {
      setUploadError(err?.message || "Failed to delete slide");
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Frontend guard: only allow image/* files
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed");
      return;
    }

    // Store file for later upload on submit
    setImageFile(file);
    setUploadError("");

    // Optional: show local preview before upload
    const previewUrl = URL.createObjectURL(file);
    setSlideForm((prev) => ({ ...prev, image: previewUrl }));
  };

  const openEdit = (slide) => {
    const slideId = slide?.id || slide?._id;
    setEditSlideId(slideId);
    setEditImageFile(null);
    setEditUploadError("");
    setEditSlideForm({
      title: slide?.title || "",
      subtitleLine1: Array.isArray(slide?.subtitle) ? slide.subtitle[0] || "" : "",
      subtitleLine2: Array.isArray(slide?.subtitle) ? slide.subtitle[1] || "" : "",
      image: slide?.image || "",
      categoryId:
        slide?.categoryId != null && Number.isFinite(Number(slide.categoryId))
          ? String(slide.categoryId)
          : "",
    });
    setEditModalOpen(true);
  };

  const handleEditImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditUploadError("Only image files are allowed");
      return;
    }

    setEditImageFile(file);
    setEditUploadError("");
    const previewUrl = URL.createObjectURL(file);
    setEditSlideForm((prev) => ({ ...prev, image: previewUrl }));
  };

  const saveEditSlide = async () => {
    if (!editSlideId) return;
    try {
      setEditUploading(true);
      setEditUploadError("");

      let imageUrl = editSlideForm.image;
      if (editImageFile) {
        imageUrl = await uploadImageToCloudinary(editImageFile);
      } else if (imageUrl && !imageUrl.startsWith("blob:")) {
        imageUrl = ensureHttpsUrl(imageUrl);
      }

      const payload = {
        title: editSlideForm.title,
        subtitle: [editSlideForm.subtitleLine1, editSlideForm.subtitleLine2],
        imageUrl: ensureHttpsUrl(imageUrl),
        categoryId:
          editSlideForm.categoryId === "" || editSlideForm.categoryId == null
            ? null
            : Number(editSlideForm.categoryId),
      };

      await updateSliderSlide(editSlideId, payload);
      setEditModalOpen(false);
      setEditImageFile(null);
      dispatch(fetchSliderSlides());
    } catch (err) {
      setEditUploadError(err?.message || "Failed to update slide");
    } finally {
      setEditUploading(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Banner Slides</div>
          <div className="section-desc">Manage homepage carousel slides</div>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setModalOpen(true)}
        >
          + Add Slide
        </button>
      </div>

      <div className="slides-grid">
        {slides.map((s) => (
          <div className="slide-card" key={s.id}>
            {s.image && (
              <img
                className="slide-img"
                src={s.image}
                alt={
                  s.title ||
                  (Array.isArray(s.subtitle)
                    ? `${s.subtitle[0] || ""} ${s.subtitle[1] || ""}`.trim()
                    : "")
                }
              />
            )}
            <div className="slide-body">
              <div className="slide-title">
                {Array.isArray(s.subtitle) &&
                  (s.subtitle[0] || s.subtitle[1]) && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        marginBottom: 4,
                      }}
                    >
                      {s.subtitle[0]}
                      <br />
                      {s.subtitle[1]}
                    </div>
                  )}
                <div>{s.title}</div>
              </div>
              <div className="slide-meta">
                <span className="status-pill status-active">{s.status}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="action-btn action-edit"
                    type="button"
                    onClick={() => openEdit(s)}
                    disabled={deletingId === s.id}
                    title="Edit slide"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn action-del"
                    type="button"
                    onClick={() => deleteSlide(s.id)}
                    disabled={deletingId === s.id}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="slide-order">Order: #{s.order}</div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  marginTop: 6,
                }}
              >
                Shop Now:{" "}
                {s.categoryId != null && s.categoryId !== ""
                  ? categoryTitleById.get(Number(s.categoryId)) ||
                    `Category #${s.categoryId}`
                  : "All products"}
              </div>
            </div>
          </div>
        ))}
        <div className="slide-card add-card" onClick={() => setModalOpen(true)}>
          <div className="add-icon">+</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Add New Slide</div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New Slide</div>
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
                  value={slideForm.title}
                  onChange={(e) =>
                    setSlideForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. New Arrivals"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle Line 1</label>
                <input
                  className="form-input"
                  value={slideForm.subtitleLine1}
                  onChange={(e) =>
                    setSlideForm((p) => ({
                      ...p,
                      subtitleLine1: e.target.value,
                    }))
                  }
                  placeholder="e.g. New Arrivals"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle Line 2</label>
                <input
                  className="form-input"
                  value={slideForm.subtitleLine2}
                  onChange={(e) =>
                    setSlideForm((p) => ({
                      ...p,
                      subtitleLine2: e.target.value,
                    }))
                  }
                  placeholder="e.g. Drop 01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Shop Now — link to category (optional)
                </label>
                <select
                  className="form-select"
                  value={slideForm.categoryId}
                  onChange={(e) =>
                    setSlideForm((p) => ({ ...p, categoryId: e.target.value }))
                  }
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories…"
                      : "All products (no filter)"}
                  </option>
                  {sortedCategoryRows.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.parentId != null ? `↳ ${c.title}` : c.title}
                    </option>
                  ))}
                </select>
                {categoriesError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--accent2)",
                      marginTop: 6,
                    }}
                  >
                    {categoriesError}{" "}
                    <button
                      type="button"
                      className="action-btn action-edit"
                      style={{ marginLeft: 8, fontSize: 11 }}
                      onClick={() => loadSlideCategories()}
                    >
                      Retry
                    </button>
                  </div>
                )}
                {!categoriesLoading &&
                  !categoriesError &&
                  sortedCategoryRows.length === 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--accent2)",
                        marginTop: 6,
                      }}
                    >
                      No categories returned from API. Add categories in
                      Categories admin or check backend URL (
                      {SLIDES_API_BASE || "REACT_APP_API_BASE_URL"}).
                    </div>
                  )}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    marginTop: 6,
                  }}
                >
                  Homepage &quot;Shop Now&quot; opens All Products filtered by
                  this category.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Upload Image</label>
                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                />
                {uploading && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 6,
                    }}
                  >
                    Uploading image...
                  </div>
                )}
                {uploadError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--accent2)",
                      marginTop: 6,
                    }}
                  >
                    {uploadError}
                  </div>
                )}
              </div>
              {slideForm.image && (
                <div
                  style={{
                    marginBottom: 16,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={slideForm.image}
                    alt="preview"
                    style={{ width: "100%", height: 140, objectFit: "cover" }}
                    onError={(e) => {
                      // eslint-disable-next-line no-param-reassign
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={slideForm.status}
                    onChange={(e) =>
                      setSlideForm((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input
                    className="form-input"
                    type="number"
                    value={slideForm.order}
                    onChange={(e) =>
                      setSlideForm((p) => ({ ...p, order: e.target.value }))
                    }
                    placeholder="1, 2, 3..."
                  />
                </div>
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
                onClick={addSlide}
              >
                Add Slide
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
              <div className="modal-title">Edit Slide</div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setEditModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  value={editSlideForm.title}
                  onChange={(e) =>
                    setEditSlideForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. New Arrivals"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle Line 1</label>
                <input
                  className="form-input"
                  value={editSlideForm.subtitleLine1}
                  onChange={(e) =>
                    setEditSlideForm((p) => ({
                      ...p,
                      subtitleLine1: e.target.value,
                    }))
                  }
                  placeholder="e.g. New Arrivals"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle Line 2</label>
                <input
                  className="form-input"
                  value={editSlideForm.subtitleLine2}
                  onChange={(e) =>
                    setEditSlideForm((p) => ({
                      ...p,
                      subtitleLine2: e.target.value,
                    }))
                  }
                  placeholder="e.g. Drop 01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Shop Now — link to category (optional)
                </label>
                <select
                  className="form-select"
                  value={editSlideForm.categoryId}
                  onChange={(e) =>
                    setEditSlideForm((p) => ({
                      ...p,
                      categoryId: e.target.value,
                    }))
                  }
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories…"
                      : "All products (no filter)"}
                  </option>
                  {editCategorySelectRows.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.parentId != null ? `↳ ${c.title}` : c.title}
                    </option>
                  ))}
                </select>
                {categoriesError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--accent2)",
                      marginTop: 6,
                    }}
                  >
                    {categoriesError}{" "}
                    <button
                      type="button"
                      className="action-btn action-edit"
                      style={{ marginLeft: 8, fontSize: 11 }}
                      onClick={() => loadSlideCategories()}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Upload Image (optional)</label>
                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageFileChange}
                />
                {editUploading && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 6,
                    }}
                  >
                    Uploading image...
                  </div>
                )}
                {editUploadError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--accent2)",
                      marginTop: 6,
                    }}
                  >
                    {editUploadError}
                  </div>
                )}
              </div>

              {editSlideForm.image && (
                <div
                  style={{
                    marginBottom: 16,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  <img
                    src={editSlideForm.image}
                    alt="preview"
                    style={{ width: "100%", height: 140, objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={editUploading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={editUploading || !editSlideId}
                onClick={saveEditSlide}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlidesAdminSection;
