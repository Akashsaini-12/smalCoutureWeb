import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  adminGetHomeBestSellers,
  adminGetHomeNewArrivals,
  adminUpdateHomeBestSellers,
  adminUpdateHomeNewArrivals,
  createCatalogProduct,
  deleteCatalogProduct,
  fetchMasterCategories,
  fetchCatalogProductById,
  updateCatalogProduct,
  uploadImagesToCloudinary,
} from "../../redux/actions";
import AdminSizeGuideEditor from "./AdminSizeGuideEditor";
import {
  clampMeasureColumnCount,
  convertFormRowsUnit,
  DEFAULT_MEASURE_COLUMN_COUNT,
  emptySizeGuideFormRow,
  formRowsToCmRows,
  resolveMeasureColumnCount,
  rowCmToForm,
} from "../../utils/sizeGuide";
import {
  CANONICAL_INTERNAL_FREE_SIZE_LABEL,
  isInternalFreeSizeLabel,
} from "../../utils/internalFreeSize";
import { ensureHttpsUrl, ensureHttpsUrls } from "../../utils/ensureHttpsUrl";

function parseSizeGuideFromProduct(p) {
  const sg = p?.sizeGuide;
  if (!sg || typeof sg !== "object") {
    return {
      fitType: "",
      stretchability: "",
      measureColumns: Array.from(
        { length: DEFAULT_MEASURE_COLUMN_COUNT },
        () => "",
      ),
      rows: [emptySizeGuideFormRow(DEFAULT_MEASURE_COLUMN_COUNT)],
    };
  }
  const colCount = resolveMeasureColumnCount(sg);
  const legacy = [
    String(sg.colLabelBust ?? "").trim(),
    String(sg.colLabelShoulder ?? "").trim(),
    String(sg.colLabelSleeve ?? "").trim(),
  ];
  const measureColumns = [];
  for (let i = 0; i < colCount; i++) {
    const fromNew = String(sg.measureColumns?.[i] ?? "").trim();
    if (fromNew) measureColumns.push(fromNew);
    else if (i < 3 && legacy[i]) measureColumns.push(legacy[i]);
    else measureColumns.push("");
  }
  const rows =
    Array.isArray(sg.rows) && sg.rows.length
      ? sg.rows.map((r) => rowCmToForm(r, "cm", colCount))
      : [emptySizeGuideFormRow(colCount)];
  return {
    fitType: String(sg.fitType || ""),
    stretchability: String(sg.stretchability || ""),
    measureColumns,
    rows,
  };
}

function normalizeHexInput(raw) {
  const v = String(raw || "").trim();
  if (!v) return "";
  const noHash = v.replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(noHash)) return `#${noHash.toUpperCase()}`;
  return v;
}

function hexToRgb(hex) {
  const clean = String(hex || "")
    .trim()
    .replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

function rgbDistance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

// Best-effort color name for a hex code (approx)
function colorNameFromHex(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";

  const palette = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Gray", hex: "#808080" },
    { name: "Red", hex: "#FF0000" },
    { name: "Green", hex: "#00FF00" },
    { name: "Blue", hex: "#0000FF" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Cyan", hex: "#00FFFF" },
    { name: "Magenta", hex: "#FF00FF" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Pink", hex: "#FFC0CB" },
    { name: "Purple", hex: "#800080" },
    { name: "Brown", hex: "#8B4513" },
    { name: "Navy", hex: "#000080" },
    { name: "Teal", hex: "#008080" },
    { name: "Olive", hex: "#808000" },
  ];

  let best = { name: "", dist: Number.POSITIVE_INFINITY };
  for (const p of palette) {
    const prgb = hexToRgb(p.hex);
    const dist = rgbDistance(rgb, prgb);
    if (dist < best.dist) best = { name: p.name, dist };
  }
  return best.name;
}

const emptyVariant = () => ({
  color: "",
  // For multi-color products: additional color names (stored on backend as `variant.colors`).
  // Keep `color` as primary display value for backward compatibility.
  colors: [],
  colorsText: "",
  colorCode: "",
  sizes: [],
  images: [],
  imageFiles: [],
  stockAll: "",
  colorAuto: true,
});

const emptySpecRow = () => ({ label: "", value: "" });

export default function CatalogProductAdminSection({
  initialProductIdToEdit = null,
  onEditCancel,
} = {}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const fileUrlCacheRef = useRef(new Map());

  const [editingProductId, setEditingProductId] = useState(null);
  const [productIdToEdit, setProductIdToEdit] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [categories, setCategories] = useState([]);

  const [addToHomeBestSellers, setAddToHomeBestSellers] = useState(false);
  const [addToHomeNewArrivals, setAddToHomeNewArrivals] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    discountPrice: "",
    description: "",
    specifications: [emptySpecRow()],
    categoryId: "",
    categoryIds: [],
    rating: 0,
    numReviews: 0,
    isFeatured: false,
    status: "active",
    sizeChartImage: "",
    sizeChartTitle: "",
    sizeGuide: {
      fitType: "",
      stretchability: "",
      measureColumns: Array.from(
        { length: DEFAULT_MEASURE_COLUMN_COUNT },
        () => "",
      ),
      rows: [emptySizeGuideFormRow(DEFAULT_MEASURE_COLUMN_COUNT)],
    },
    sizeGuideInputUnit: "cm",
    variants: [emptyVariant()],
  });

  const resetToCreateMode = () => {
    setEditingProductId(null);
    setProductIdToEdit("");
    setAddToHomeBestSellers(false);
    setAddToHomeNewArrivals(false);
    setForm({
      name: "",
      price: "",
      discountPrice: "",
      description: "",
      specifications: [emptySpecRow()],
      categoryId: "",
      categoryIds: [],
      rating: 0,
      numReviews: 0,
      isFeatured: false,
      status: "active",
      sizeChartImage: "",
      sizeChartTitle: "",
      sizeGuide: {
        fitType: "",
        stretchability: "",
        measureColumns: Array.from(
          { length: DEFAULT_MEASURE_COLUMN_COUNT },
          () => "",
        ),
        rows: [emptySizeGuideFormRow(DEFAULT_MEASURE_COLUMN_COUNT)],
      },
      sizeGuideInputUnit: "cm",
      variants: [emptyVariant()],
    });
    onEditCancel?.();
  };

  const upsertCuratedHomeList = async (kind, productId) => {
    const pid = String(productId || "").trim();
    if (!pid) return;

    const isBest = kind === "best";
    const getFn = isBest ? adminGetHomeBestSellers : adminGetHomeNewArrivals;
    const saveFn = isBest ? adminUpdateHomeBestSellers : adminUpdateHomeNewArrivals;

    const res = await getFn();
    const existing = Array.isArray(res?.productIds) ? res.productIds.map(String) : [];
    const next = [pid, ...existing.filter((x) => String(x) !== pid)].slice(0, 40);
    await saveFn(next);
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      for (const url of fileUrlCacheRef.current.values()) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }
      fileUrlCacheRef.current.clear();
    };
  }, []);

  const getPreviewUrl = (file) => {
    if (!file) return "";
    const key = `${file.name}|${file.size}|${file.lastModified}`;
    const existing = fileUrlCacheRef.current.get(key);
    if (existing) return existing;
    const created = URL.createObjectURL(file);
    fileUrlCacheRef.current.set(key, created);
    return created;
  };

  const handleSizeGuideUnitChange = (next) => {
    setForm((p) => {
      const prev = p.sizeGuideInputUnit === "inch" ? "inch" : "cm";
      if (prev === next) return p;
      return {
        ...p,
        sizeGuideInputUnit: next,
        sizeGuide: {
          ...p.sizeGuide,
          rows: convertFormRowsUnit(p.sizeGuide?.rows, prev, next),
        },
      };
    });
  };

  const loadForEdit = async (idOverride) => {
    const id = String((idOverride ?? productIdToEdit) || "").trim();
    if (!id) return;
    setProductIdToEdit(id);
    setLoadingExisting(true);
    setError("");
    setSuccess("");
    try {
      const p = await fetchCatalogProductById(id);
      const loadedVariants = Array.isArray(p?.variants) && p.variants.length
        ? p.variants.map((v) => {
            const sz = Array.isArray(v?.sizes) ? v.sizes : [];
            const onlyFree =
              sz.length === 1 && isInternalFreeSizeLabel(sz[0]?.size ?? sz[0]);
            const sizesForForm = onlyFree
              ? []
              : sz.map((s) => ({
                  size: isInternalFreeSizeLabel(s?.size ?? s)
                    ? ""
                    : String(s?.size ?? ""),
                  stock: Number(s?.stock ?? 0),
                }));
            let stockAllVal = "";
            if (onlyFree) {
              stockAllVal = String(Number(sz[0]?.stock ?? 0));
            } else if (!sz.length) {
              stockAllVal =
                v?.stock != null && Number.isFinite(Number(v.stock))
                  ? String(Number(v.stock))
                  : "";
            }
            return {
              color: String(v?.color ?? "").trim() || "",
              colors: Array.isArray(v?.colors)
                ? v.colors.map((c) => String(c ?? "").trim()).filter(Boolean)
                : [],
              colorsText: Array.isArray(v?.colors)
                ? v.colors.map((c) => String(c ?? "").trim()).filter(Boolean).join(", ")
                : "",
              colorCode: normalizeHexInput(v?.colorCode) || "",
              sizes: sizesForForm,
              images: ensureHttpsUrls(v?.images),
              imageFiles: [],
              stockAll: stockAllVal,
              colorAuto: false,
            };
          })
        : [emptyVariant()];

      setForm({
        name: p?.name ?? "",
        price: p?.price != null ? String(p.price) : "",
        discountPrice: p?.discountPrice != null ? String(p.discountPrice) : "",
        description: p?.description ?? "",
        specifications:
          Array.isArray(p?.specifications) && p.specifications.length
            ? p.specifications.map((r) => ({
                label: String(r?.label || "").trim(),
                value: String(r?.value || "").trim(),
              }))
            : [emptySpecRow()],
        categoryIds: Array.isArray(p?.categoryIds) && p?.categoryIds.length
          ? p.categoryIds.map((x) => String(x))
          : p?.categoryId != null
            ? [String(p.categoryId)]
            : [],
        // In edit mode, keep `categoryId` as a helper for the UI.
        categoryId:
          Array.isArray(p?.categoryIds) && p?.categoryIds.length
            ? String(p.categoryIds[0])
            : p?.categoryId != null
              ? String(p.categoryId)
              : "",
        rating: p?.rating != null ? Number(p.rating) : 0,
        numReviews: p?.numReviews != null ? Number(p.numReviews) : 0,
        isFeatured: Boolean(p?.isFeatured),
        status: p?.status ?? "active",
        sizeChartImage:
          p?.sizeChartImage != null ? ensureHttpsUrl(String(p.sizeChartImage)) : "",
        sizeChartTitle: p?.sizeChartTitle != null ? String(p.sizeChartTitle) : "",
        sizeGuide: parseSizeGuideFromProduct(p),
        sizeGuideInputUnit: "cm",
        variants: loadedVariants,
      });
      setEditingProductId(String(p?._id || id));
      setSuccess("Product loaded for update");
    } catch (e) {
      setError(e?.message || "Failed to load product");
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (!initialProductIdToEdit) return;
    const id = String(initialProductIdToEdit).trim();
    if (!id) return;
    if (editingProductId && String(editingProductId) === id) return;
    loadForEdit(id);
  }, [initialProductIdToEdit]); // Intentionally not including loadForEdit to avoid re-loading on every render.

  const deleteEditingProduct = async () => {
    if (!editingProductId) return;
    const ok = window.confirm("Delete this catalog product?");
    if (!ok) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await deleteCatalogProduct(editingProductId);
      setSuccess("Product deleted");
      resetToCreateMode();
    } catch (e) {
      setError(e?.message || "Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMasterCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        setCategories([]);
      }
    };
    load();
  }, []);

  const categorySelectTree = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    const byOrder = (a, b) =>
      (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
      (Number(a.id) || 0) - (Number(b.id) || 0);
    const isRoot = (c) =>
      c == null || c.parentId == null || c.parentId === undefined;
    const roots = list.filter(isRoot).sort(byOrder);
    const childrenOf = (pid) =>
      list
        .filter((c) => Number(c.parentId) === Number(pid))
        .sort(byOrder);
    return roots.map((r) => ({
      root: r,
      children: childrenOf(r.id ?? r._id),
    }));
  }, [categories]);

  const setVariant = (idx, patch) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    }));
  };

  const setVariantSizes = (variantIdx, sizes) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === variantIdx ? { ...v, sizes } : v,
      ),
    }));
  };

  const addCommonSizes = (variantIdx, labels) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== variantIdx) return v;
        const existing = new Set((v.sizes || []).map((s) => s.size));
        const nextSizes = [...(v.sizes || [])];
        for (const size of labels) {
          if (!existing.has(size)) nextSizes.push({ size, stock: 0 });
        }
        return { ...v, sizes: nextSizes };
      }),
    }));
  };

  const applyStockToAllSizes = (variantIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== variantIdx) return v;
        const stock = Number(v.stockAll || 0);
        return {
          ...v,
          sizes: (v.sizes || []).map((s) => ({ ...s, stock })),
        };
      }),
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, emptyVariant()] }));
  };

  const removeVariant = (idx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  };

  const addSize = (variantIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === variantIdx
          ? { ...v, sizes: [...(v.sizes || []), { size: "", stock: 0 }] }
          : v,
      ),
    }));
  };

  const removeSize = (variantIdx, sizeIdx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === variantIdx
          ? { ...v, sizes: (v.sizes || []).filter((_, s) => s !== sizeIdx) }
          : v,
      ),
    }));
  };

  const setSize = (variantIdx, sizeIdx, patch) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === variantIdx
          ? {
              ...v,
              sizes: (v.sizes || []).map((s, si) =>
                si === sizeIdx ? { ...s, ...patch } : s,
              ),
            }
          : v,
      ),
    }));
  };

  const removeUploadedImage = (variantIdx, imageUrl) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === variantIdx
          ? { ...v, images: (v.images || []).filter((u) => u !== imageUrl) }
          : v,
      ),
    }));
    showToast("info", "Image removed from this product (not deleted from Cloudinary)");
  };

  const removePendingFile = (variantIdx, fileKey) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== variantIdx) return v;
        const nextFiles = (v.imageFiles || []).filter((f) => {
          const k = `${f?.name}|${f?.size}|${f?.lastModified}`;
          return k !== fileKey;
        });
        return { ...v, imageFiles: nextFiles };
      }),
    }));
  };

  const onSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const selectedCategoryIds =
        Array.isArray(form.categoryIds) && form.categoryIds.length
          ? form.categoryIds
          : form.categoryId
            ? [form.categoryId]
            : [];

      const catNumsRaw = selectedCategoryIds
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n));

      // Multi-category schema: the same product can live under multiple categories.
      // Keep the user's selection as-is (dedupe only exact duplicates).
      const catNums = (() => {
        const seen = new Set();
        const next = [];
        for (const n of catNumsRaw) {
          const k = String(n);
          if (seen.has(k)) continue;
          seen.add(k);
          next.push(n);
        }
        return next;
      })();

      const required = [
        ["name", form.name],
        ["price", form.price],
        ["description", form.description],
      ];
      const missing = required.find(([, v]) => !String(v || "").trim());
      if (missing) {
        setError(`${missing[0]} is required`);
        return;
      }

      if (!catNums.length) {
        setError("Select at least one category");
        return;
      }

      if (!Array.isArray(form.variants) || form.variants.length === 0) {
        setError("At least one variant is required");
        return;
      }

      // Upload variant images (parallel per-variant)
      const variantsInput = form.variants;

      const preparedVariants = await Promise.all(
        variantsInput.map(async (v) => {
          const uploaded =
            v.imageFiles && v.imageFiles.length > 0
              ? await uploadImagesToCloudinary(v.imageFiles)
              : [];

          const images = ensureHttpsUrls([...(v.images || []), ...uploaded]);
          if (!images.length) {
            throw new Error("Each variant requires at least one image");
          }

          const colorCodeNorm = normalizeHexInput(v.colorCode);
          const colorCodeFinal = colorCodeNorm || "";
          const colorFinal = String(v.color || "").trim();
          const fromText = String(v.colorsText ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const fromArr = Array.isArray(v.colors) ? v.colors : [];
          const colorsFinal = [...fromArr, ...fromText]
            .map((c) => String(c ?? "").trim())
            .filter(Boolean)
            .filter(
              (c, i, arr) =>
                arr.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i,
            );

          const rawSizes = Array.isArray(v.sizes) ? v.sizes : [];
          const labeledRows = [];
          let freeBucketStock = 0;

          for (const s of rawSizes) {
            const labelTrim = String(s?.size ?? "").trim();
            const stockRaw = s?.stock;
            const stockNum = Number(stockRaw);
            if (
              stockRaw === "" ||
              stockRaw == null ||
              !Number.isFinite(stockNum) ||
              stockNum < 0
            ) {
              throw new Error(
                "Stock is required for every size row (enter 0 or more)",
              );
            }
            const stock = Math.max(0, Math.floor(stockNum));
            if (!labelTrim || isInternalFreeSizeLabel(labelTrim)) {
              freeBucketStock += stock;
            } else {
              labeledRows.push({ size: labelTrim, stock });
            }
          }

          const fromAllRaw = Number(v.stockAll);
          const fromAll =
            Number.isFinite(fromAllRaw) && fromAllRaw >= 0
              ? Math.max(0, Math.floor(fromAllRaw))
              : null;

          let sizesFinal;
          if (labeledRows.length === 0) {
            if (rawSizes.length === 0) {
              if (fromAll == null) {
                throw new Error("Stock is required (set Stock (no sizes))");
              }
              sizesFinal = [
                {
                  size: CANONICAL_INTERNAL_FREE_SIZE_LABEL,
                  stock: fromAll,
                },
              ];
            } else {
              if (freeBucketStock === 0) {
                throw new Error(
                  "Stock is required on each size row (label optional; use 0 or more)",
                );
              }
              sizesFinal = [
                {
                  size: CANONICAL_INTERNAL_FREE_SIZE_LABEL,
                  stock: freeBucketStock,
                },
              ];
            }
          } else {
            sizesFinal = [...labeledRows];
            if (freeBucketStock > 0) {
              sizesFinal.push({
                size: CANONICAL_INTERNAL_FREE_SIZE_LABEL,
                stock: freeBucketStock,
              });
            }
          }

          return {
            color: colorFinal,
            ...(colorsFinal.length ? { colors: colorsFinal } : {}),
            colorCode: colorCodeFinal,
            sizes: sizesFinal,
            images,
          };
        }),
      );

      const sizeChartImage = ensureHttpsUrl(
        String(form.sizeChartImage || "").trim(),
      );

      const mcRaw = Array.isArray(form.sizeGuide?.measureColumns)
        ? form.sizeGuide.measureColumns
        : [];
      const colN = clampMeasureColumnCount(
        mcRaw.length || DEFAULT_MEASURE_COLUMN_COUNT,
      );
      const measureColumns = Array.from({ length: colN }, (_, i) =>
        String(mcRaw[i] ?? "").trim(),
      );
      const rowsCm = formRowsToCmRows(
        form.sizeGuide?.rows,
        form.sizeGuideInputUnit === "inch" ? "inch" : "cm",
      ).map((r) => {
        const vals = Array.isArray(r.values) ? [...r.values] : [];
        while (vals.length < colN) vals.push(null);
        return { sizeLabel: r.sizeLabel, values: vals.slice(0, colN) };
      });

      const sizeGuidePayload = {
        fitType: String(form.sizeGuide?.fitType || "").trim(),
        stretchability: String(form.sizeGuide?.stretchability || "").trim(),
        measureColumns,
        rows: rowsCm,
      };

      if (editingProductId) {
        const specs = (Array.isArray(form.specifications) ? form.specifications : [])
          .map((r) => ({
            label: String(r?.label || "").trim(),
            value: String(r?.value || "").trim(),
          }))
          .filter((r) => r.label || r.value);
        const payload = {
          name: form.name,
          price: Number(form.price),
          discountPrice: form.discountPrice
            ? Number(form.discountPrice)
            : undefined,
          description: form.description,
          specifications: specs,
          categoryIds: catNums,
          variants: preparedVariants,
          rating: Number(form.rating || 0),
          numReviews: Number(form.numReviews || 0),
          isFeatured: Boolean(form.isFeatured),
          status: form.status,
          sizeChartImage,
          sizeChartTitle: String(form.sizeChartTitle || "").trim(),
          sizeGuide: sizeGuidePayload,
        };

        await updateCatalogProduct(editingProductId, payload);

        // Optional: also add this product to curated Home tabs lists.
        if (addToHomeBestSellers) {
          await upsertCuratedHomeList("best", editingProductId);
        }
        if (addToHomeNewArrivals) {
          await upsertCuratedHomeList("new", editingProductId);
        }

        setSuccess("Product updated successfully");
        showToast("success", "Product updated successfully");
      } else {
        const specs = (Array.isArray(form.specifications) ? form.specifications : [])
          .map((r) => ({
            label: String(r?.label || "").trim(),
            value: String(r?.value || "").trim(),
          }))
          .filter((r) => r.label || r.value);
        const payloadBase = {
          name: form.name,
          price: Number(form.price),
          discountPrice: form.discountPrice
            ? Number(form.discountPrice)
            : undefined,
          description: form.description,
          specifications: specs,
          variants: preparedVariants,
          rating: Number(form.rating || 0),
          numReviews: Number(form.numReviews || 0),
          isFeatured: Boolean(form.isFeatured),
          status: form.status,
          sizeChartImage,
          sizeChartTitle: String(form.sizeChartTitle || "").trim(),
          sizeGuide: sizeGuidePayload,
          categoryIds: catNums,
        };

        const created = await createCatalogProduct(payloadBase);
        const createdId = String(created?._id || "").trim();

        // Optional: add newly created product to curated Home tabs lists.
        if (createdId) {
          if (addToHomeBestSellers) {
            await upsertCuratedHomeList("best", createdId);
          }
          if (addToHomeNewArrivals) {
            await upsertCuratedHomeList("new", createdId);
          }
        }

        setSuccess("Product created successfully");
        showToast("success", "Product created successfully");
        resetToCreateMode();
      }
    } catch (e) {
      setError(editingProductId ? "Failed to update product" : "Failed to create product");
      showToast(
        "error",
        (editingProductId ? "Failed to update product" : "Failed to create product") +
          (e?.message ? `: ${e.message}` : ""),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section">
      {!!toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 18,
            right: 18,
            zIndex: 9999,
            minWidth: 260,
            maxWidth: 420,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            fontSize: 13,
            color:
              toast.type === "success"
                ? "var(--accent3)"
                : toast.type === "error"
                  ? "var(--accent2)"
                  : "var(--text)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{toast.type}</div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setToast(null)}
              style={{ padding: "4px 8px", height: 28 }}
            >
              Close
            </button>
          </div>
          <div style={{ marginTop: 6, color: "var(--text)" }}>{toast.message}</div>
        </div>
      )}
      <style>{`
        .compact-form .form-group { margin-bottom: 10px; }
        .compact-form .form-row { gap: 10px; }
        .compact-form .form-label { margin-bottom: 4px; }
        .compact-form .form-input,
        .compact-form .form-select,
        .compact-form .form-textarea { padding: 9px 12px; }
        .compact-form .form-textarea { min-height: 70px; }
      `}</style>
      <div className="section-header">
        <div>
          <div className="section-title">{editingProductId ? "Update Product" : "Add Product"}</div>
          <div className="section-desc">Create catalog product with variants</div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, fontSize: 13, color: "var(--accent2)" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: 12, fontSize: 13, color: "var(--accent3)" }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        {/* <div style={{ flex: "1 1 280px" }}>
          <label className="form-label">Product ID (for edit)</label>
          <input
            className="form-input"
            value={productIdToEdit}
            onChange={(e) => setProductIdToEdit(e.target.value)}
            placeholder="e.g. 65f... (Mongo _id)"
          />
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={loadForEdit}
          disabled={!productIdToEdit || saving || loadingExisting}
        >
          {loadingExisting ? "Loading..." : "Load for Edit"}
        </button> */}
        {editingProductId && (
          <>
            <button
              className="btn btn-danger"
              type="button"
              onClick={deleteEditingProduct}
              disabled={saving || loadingExisting}
            >
              Delete
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={resetToCreateMode}
              disabled={saving || loadingExisting}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <div className="table-wrap compact-form" style={{ padding: 12 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            {false ? (
              <select
                className="form-select"
                value={form.categoryId}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    categoryId: e.target.value,
                    categoryIds: e.target.value ? [e.target.value] : [],
                  }))
                }
              >
                <option value="">Select...</option>
                {categorySelectTree.map(({ root, children }) =>
                  children.length === 0 ? (
                    <option key={root.id} value={root.id}>
                      {root.title}
                    </option>
                  ) : (
                    <optgroup key={root.id} label={root.title}>
                      <option value={root.id}>{root.title} (parent)</option>
                      {children.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))}
                    </optgroup>
                  ),
                )}
              </select>
            ) : (
              <>
                <div
                  style={{
                    marginTop: 4,
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: 12,
                    background: "var(--surface)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontWeight: 950, fontSize: 14 }}>Categories</div>
                   
                  </div>

                  <div
                    style={{
                      maxHeight: 260,
                      overflowY: "auto",
                      paddingRight: 6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {categorySelectTree.map(({ root, children }) => {
                      const rootIdStr = String(root.id);
                      const rootChecked = form.categoryIds.includes(rootIdStr);
                      const childChecked = Array.isArray(children)
                        ? children.some((ch) => form.categoryIds.includes(String(ch.id)))
                        : false;

                      // Leaf root = no sub-categories
                      if (!children || children.length === 0) {
                        return (
                          <label
                            key={root.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: `1px solid ${
                                rootChecked ? "rgba(21, 128, 61, 0.55)" : "var(--border)"
                              }`,
                              background: rootChecked
                                ? "rgba(21, 128, 61, 0.08)"
                                : "transparent",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={rootChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setForm((prev) => {
                                  const nextIds = checked
                                    ? prev.categoryIds.includes(rootIdStr)
                                      ? prev.categoryIds
                                      : [...prev.categoryIds, rootIdStr]
                                    : prev.categoryIds.filter(
                                        (x) => String(x) !== rootIdStr,
                                      );
                                  return {
                                    ...prev,
                                    categoryIds: nextIds,
                                    categoryId: nextIds[0] || "",
                                  };
                                });
                              }}
                            />
                            <span style={{ fontWeight: 800 }}>{root.title}</span>
                            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
                              Root
                            </span>
                          </label>
                        );
                      }

                      // Root with children = collapsible panel
                      const open = rootChecked || childChecked;
                      return (
                        <details
                          key={root.id}
                          open={open}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            padding: 10,
                            background: "transparent",
                          }}
                        >
                          <summary
                            style={{
                              listStyle: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "4px 2px",
                              userSelect: "none",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 950,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={rootChecked || childChecked}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setForm((prev) => {
                                    const next = new Set(prev.categoryIds.map((x) => String(x)));
                                    if (checked) {
                                      next.add(rootIdStr);
                                      for (const ch of children) next.add(String(ch.id));
                                    } else {
                                      next.delete(rootIdStr);
                                      for (const ch of children) next.delete(String(ch.id));
                                    }
                                    const nextIds = Array.from(next);
                                    return {
                                      ...prev,
                                      categoryIds: nextIds,
                                      categoryId: nextIds[0] || "",
                                    };
                                  });
                                }}
                              />
                              {root.title}
                            </span>
                            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
                              Sub-categories: {children.length}
                            </span>
                          </summary>

                          <div style={{ paddingLeft: 18, marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                            {children.map((ch) => {
                              const idStr = String(ch.id);
                              const checked = form.categoryIds.includes(idStr);
                              return (
                                <label
                                  key={ch.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "8px 10px",
                                    borderRadius: 12,
                                    border: `1px solid ${
                                      checked ? "rgba(21, 128, 61, 0.55)" : "var(--border)"
                                    }`,
                                    background: checked ? "rgba(21, 128, 61, 0.08)" : "transparent",
                                    cursor: "pointer",
                                    userSelect: "none",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      setForm((prev) => {
                                        const nextIds = isChecked
                                          ? prev.categoryIds.includes(idStr)
                                            ? prev.categoryIds
                                            : [...prev.categoryIds, idStr]
                                          : prev.categoryIds.filter((x) => String(x) !== idStr);
                                        return {
                                          ...prev,
                                          categoryIds: nextIds,
                                          categoryId: nextIds[0] || "",
                                        };
                                      });
                                    }}
                                  />
                                  <span style={{ fontWeight: 750 }}>{ch.title}</span>
                                </label>
                              );
                            })}
                          </div>
                        </details>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                    Selected: {form.categoryIds.length} category(s)
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price *</label>
            <input
              className="form-input"
              type="number"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Discount Price</label>
            <input
              className="form-input"
              type="number"
              value={form.discountPrice}
              onChange={(e) =>
                setForm((p) => ({ ...p, discountPrice: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            className="form-textarea"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>

        <div
          style={{
            marginTop: 8,
            marginBottom: 8,
            padding: 14,
            border: "1px solid var(--border)",
            borderRadius: 14,
            background: "var(--surface)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>
            Specifications{" "}
            <span style={{ fontWeight: 500, color: "var(--muted)" }}>
              (optional)
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            {(Array.isArray(form.specifications) ? form.specifications : [emptySpecRow()]).map((row, idx) => (
              <div
                key={`spec-${idx}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr) auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Label</label>
                  <input
                    className="form-input"
                    value={row?.label || ""}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = Array.isArray(p.specifications) ? [...p.specifications] : [];
                        while (next.length < 1) next.push(emptySpecRow());
                        next[idx] = { ...(next[idx] || emptySpecRow()), label: e.target.value };
                        return { ...p, specifications: next };
                      })
                    }
                    placeholder="Fabric / Fit / Material"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Value</label>
                  <input
                    className="form-input"
                    value={row?.value || ""}
                    onChange={(e) =>
                      setForm((p) => {
                        const next = Array.isArray(p.specifications) ? [...p.specifications] : [];
                        while (next.length < 1) next.push(emptySpecRow());
                        next[idx] = { ...(next[idx] || emptySpecRow()), value: e.target.value };
                        return { ...p, specifications: next };
                      })
                    }
                    placeholder="Cotton • Regular fit • Hand wash"
                  />
                </div>

                <button
                  type="button"
                  className="action-btn action-del"
                  title="Remove"
                  onClick={() =>
                    setForm((p) => {
                      const next = (Array.isArray(p.specifications) ? p.specifications : [])
                        .filter((_, i) => i !== idx);
                      return { ...p, specifications: next.length ? next : [emptySpecRow()] };
                    })
                  }
                  style={{ height: 36, width: 42 }}
                >
                  ✕
                </button>
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    specifications: [...(Array.isArray(p.specifications) ? p.specifications : []), emptySpecRow()],
                  }))
                }
              >
                ➕ Add specification
              </button>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
                Tip: add 4–8 key points customers care about.
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 8,
            marginBottom: 8,
            padding: 14,
            border: "1px solid var(--border)",
            borderRadius: 14,
            background: "var(--surface)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>
            Size guide <span style={{ fontWeight: 500, color: "var(--muted)" }}>(optional)</span>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={form.sizeChartTitle}
              onChange={(e) =>
                setForm((p) => ({ ...p, sizeChartTitle: e.target.value }))
              }
              placeholder=""
              title="Optional — shown as the heading above the size guide on the store"
            />
          </div>

          <AdminSizeGuideEditor
            fitType={form.sizeGuide?.fitType || ""}
            stretchability={form.sizeGuide?.stretchability || ""}
            measureColumns={form.sizeGuide?.measureColumns}
            rows={form.sizeGuide?.rows}
            inputUnit={form.sizeGuideInputUnit === "inch" ? "inch" : "cm"}
            onMeasureColumnsChange={(next) =>
              setForm((p) => {
                const prev = p.sizeGuide.measureColumns || [];
                const a = prev.length;
                const b = next.length;
                let rows = p.sizeGuide.rows || [];
                if (b > a) {
                  const add = b - a;
                  rows = rows.map((r) => ({
                    ...r,
                    values: [
                      ...(Array.isArray(r.values) ? r.values : []),
                      ...Array(add).fill(""),
                    ],
                  }));
                } else if (b < a) {
                  rows = rows.map((r) => ({
                    ...r,
                    values: (Array.isArray(r.values) ? r.values : []).slice(
                      0,
                      b,
                    ),
                  }));
                }
                return {
                  ...p,
                  sizeGuide: {
                    ...p.sizeGuide,
                    measureColumns: next,
                    rows,
                  },
                };
              })
            }
            onFitChange={(fitType) =>
              setForm((p) => ({
                ...p,
                sizeGuide: {
                  ...p.sizeGuide,
                  fitType: p.sizeGuide?.fitType === fitType ? "" : fitType,
                },
              }))
            }
            onStretchChange={(stretchability) =>
              setForm((p) => ({
                ...p,
                sizeGuide: {
                  ...p.sizeGuide,
                  stretchability:
                    p.sizeGuide?.stretchability === stretchability ? "" : stretchability,
                },
              }))
            }
            onRowsChange={(rows) =>
              setForm((p) => ({ ...p, sizeGuide: { ...p.sizeGuide, rows } }))
            }
            onInputUnitChange={handleSizeGuideUnitChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Rating</label>
            <input
              className="form-input"
              type="number"
              step="0.1"
              value={form.rating}
              onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Num Reviews</label>
            <input
              className="form-input"
              type="number"
              value={form.numReviews}
              onChange={(e) =>
                setForm((p) => ({ ...p, numReviews: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Featured</label>
            <select
              className="form-select"
              value={form.isFeatured ? "yes" : "no"}
              onChange={(e) =>
                setForm((p) => ({ ...p, isFeatured: e.target.value === "yes" }))
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Home sections (optional)</label>
            <div
              style={{
                marginTop: 4,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                padding: 10,
                border: "1px solid var(--border)",
                borderRadius: 14,
                background: "var(--surface)",
              }}
            >
              <label style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={addToHomeBestSellers}
                  onChange={(e) => setAddToHomeBestSellers(e.target.checked)}
                />
                Add to Home → Best sellers
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={addToHomeNewArrivals}
                  onChange={(e) => setAddToHomeNewArrivals(e.target.checked)}
                />
                Add to Home → New arrivals
              </label>
              <div style={{ flex: "1 1 220px", color: "var(--muted)", fontSize: 12, fontWeight: 700, alignSelf: "center" }}>
                On Save/Create, this product will be inserted into the curated lists.
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, marginBottom: 8, fontWeight: 700 }}>
          Variants *
        </div>

        {form.variants.map((v, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              background: "var(--surface)",
            }}
          >
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Color</label>
                <input
                  className="form-input"
                  value={v.color}
                  onChange={(e) =>
                    setVariant(idx, { color: e.target.value, colorAuto: false })
                  }
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)", lineHeight: 1.35 }}>
                  Multi-color products: add extra color names below (comma-separated). These colors will be searchable and usable in filters.
                </div>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    padding: 8,
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    background: "#fff",
                  }}
                >
                  {(Array.isArray(v.colors) ? v.colors : []).map((c) => (
                    <span
                      key={c}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 8px",
                        borderRadius: 999,
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() =>
                          setVariant(idx, {
                            colors: (v.colors || []).filter((x) => x !== c),
                          })
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontWeight: 900,
                          color: "#64748b",
                          lineHeight: 1,
                        }}
                        aria-label={`Remove ${c}`}
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <input
                    value={String(v.colorsText ?? "")}
                    onChange={(e) => setVariant(idx, { colorsText: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== ",") return;
                      e.preventDefault();
                      const raw = String(v.colorsText ?? "").trim();
                      const token = raw.replace(/,+$/, "").trim();
                      if (!token) return;
                      const existing = Array.isArray(v.colors) ? v.colors : [];
                      const next = [...existing, token]
                        .map((x) => String(x || "").trim())
                        .filter(Boolean)
                        .filter(
                          (x, i, arr) =>
                            arr.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i,
                        );
                      setVariant(idx, { colors: next, colorsText: "" });
                    }}
                    onBlur={() => {
                      const token = String(v.colorsText ?? "").trim();
                      if (!token) return;
                      const existing = Array.isArray(v.colors) ? v.colors : [];
                      const next = [...existing, token]
                        .map((x) => String(x || "").trim())
                        .filter(Boolean)
                        .filter(
                          (x, i, arr) =>
                            arr.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i,
                        );
                      setVariant(idx, { colors: next, colorsText: "" });
                    }}
                    placeholder="Type a color and press Enter"
                    style={{
                      flex: 1,
                      minWidth: 180,
                      border: "none",
                      outline: "none",
                      padding: "6px 8px",
                      fontSize: 13,
                      background: "transparent",
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Color Code</label>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
                  <input
                    className="form-input"
                    type="color"
                    value={v.colorCode || "#000000"}
                    onChange={(e) => {
                      const hex = normalizeHexInput(e.target.value);
                      const suggested = colorNameFromHex(hex);
                      setVariant(idx, {
                        colorCode: hex,
                        ...(suggested
                          ? { color: suggested, colorAuto: true }
                          : { colorAuto: true }),
                      });
                    }}
                    aria-label="Pick color"
                    style={{ padding: 6, height: 42 }}
                  />
                  <input
                    className="form-input"
                    value={v.colorCode}
                    onChange={(e) => {
                      const hex = normalizeHexInput(e.target.value);
                      const suggested = colorNameFromHex(hex);
                      setVariant(idx, {
                        colorCode: hex,
                        ...(suggested
                          ? { color: suggested, colorAuto: true }
                          : { colorAuto: true }),
                      });
                    }}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Variant Images *</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setForm((prev) => ({
                      ...prev,
                      variants: prev.variants.map((v2, i2) =>
                        i2 === idx
                          ? {
                              ...v2,
                              imageFiles: [
                                ...(v2.imageFiles || []),
                                ...files,
                              ],
                            }
                          : v2,
                      ),
                    }));
                  }}
                />
                <button
                  type="button"
                  className="btn"
                  style={{
                    background:
                      "linear-gradient(90deg, #ff7a18 0%, #ffb347 50%, #ff7a18 100%)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    padding: "8px 16px",
                    boxShadow: "0 0 10px rgba(255, 122, 24, 0.6)",
                    transition: "transform 0.1s ease, box-shadow 0.1s ease",
                    cursor: "pointer",
                  }}
                  disabled={
                    uploadingVariantIndex === idx ||
                    !v.imageFiles ||
                    v.imageFiles.length === 0
                  }
                  onClick={async () => {
                    try {
                      if (!v.imageFiles || v.imageFiles.length === 0) return;
                      setUploadingVariantIndex(idx);
                      const uploaded = await uploadImagesToCloudinary(v.imageFiles);
                      const httpsUploaded = ensureHttpsUrls(uploaded);
                      setForm((prev) => ({
                        ...prev,
                        variants: prev.variants.map((v2, i2) =>
                          i2 === idx
                            ? {
                                ...v2,
                                images: ensureHttpsUrls([
                                  ...(v2.images || []),
                                  ...httpsUploaded,
                                ]),
                                imageFiles: [],
                              }
                            : v2,
                        ),
                      }));
                      showToast("success", `Uploaded ${uploaded.length} image(s)`);
                    } finally {
                      setUploadingVariantIndex(null);
                    }
                  }}
                >
                  {uploadingVariantIndex === idx ? "Uploading..." : "Add image"}
                </button>
              </div>
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {!!(v.imageFiles || []).length && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                      Pending uploads: {(v.imageFiles || []).length}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {(v.imageFiles || []).map((f) => {
                        const k = `${f?.name}|${f?.size}|${f?.lastModified}`;
                        return (
                          <div
                            key={k}
                            style={{
                              width: 86,
                              border: "1px solid var(--border)",
                              borderRadius: 10,
                              overflow: "hidden",
                              background: "var(--surface)",
                            }}
                          >
                            <div style={{ width: "100%", height: 64, background: "#111" }}>
                              <img
                                src={getPreviewUrl(f)}
                                alt={f?.name || "Pending upload"}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                            <div style={{ padding: 6, display: "grid", gap: 6 }}>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--muted)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={f?.name}
                              >
                                {f?.name || "image"}
                              </div>
                              <button
                                type="button"
                                className="btn btn-danger"
                                style={{ padding: "6px 8px", height: 30 }}
                                onClick={() => removePendingFile(idx, k)}
                                disabled={uploadingVariantIndex === idx}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!!(v.images || []).length && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                      Uploaded images: {(v.images || []).length}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {(v.images || []).map((url) => (
                        <div
                          key={url}
                          style={{
                            width: 86,
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            overflow: "hidden",
                            background: "var(--surface)",
                          }}
                          title={url}
                        >
                          <div style={{ width: "100%", height: 64, background: "#111" }}>
                            <img
                              src={url}
                              alt="Variant"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <div style={{ padding: 6, display: "grid", gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: "6px 8px", height: 30 }}
                              onClick={() => removeUploadedImage(idx, url)}
                              disabled={saving || uploadingVariantIndex === idx}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
                      Note: “Remove” only removes the URL from this product. Deleting from Cloudinary needs backend support (explained below).
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700 }}>
                Sizes{" "}
                <span style={{ fontWeight: 500, color: "var(--muted)" }}>(optional)</span>
              </div>
              <button className="btn btn-ghost" type="button" onClick={() => addSize(idx)}>
                + Add Size
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => addCommonSizes(idx, ["S", "M", "L", "XL"])}
              >
                + S M L XL
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => addCommonSizes(idx, ["XS", "S", "M", "L", "XL", "XXL"])}
              >
                + XS..XXL
              </button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  alignItems: "end",
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    {!Array.isArray(v.sizes) || v.sizes.length === 0
                      ? "Stock (no sizes)"
                      : "Stock for all sizes"}
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    value={v.stockAll}
                    onChange={(e) => setVariant(idx, { stockAll: e.target.value })}
                    placeholder={
                      !Array.isArray(v.sizes) || v.sizes.length === 0
                        ? "Quantity available for this color"
                        : "Apply to listed sizes only"
                    }
                  />
                </div>
                <button
                  className="btn btn-success"
                  type="button"
                  onClick={() => applyStockToAllSizes(idx)}
                  style={{ height: 38 }}
                  disabled={!Array.isArray(v.sizes) || v.sizes.length === 0}
                >
                  Apply to all
                </button>
              </div>
              {(!Array.isArray(v.sizes) || v.sizes.length === 0) && (
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>
                  No size rows — saved as internal “Free Size” in the database (not shown to
                  shoppers). Set “Stock (no sizes)” — stock is required.
                </div>
              )}
              {v.sizes.map((s, si) => (
                <div
                  key={si}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: 10,
                    alignItems: "end",
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Size label (optional)</label>
                    <input
                      className="form-input"
                      value={s.size}
                      onChange={(e) => setSize(idx, si, { size: e.target.value })}
                      placeholder="Leave blank for no public size "
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Stock</label>
                    <input
                      className="form-input"
                      type="number"
                      value={s.stock}
                      onChange={(e) =>
                        setSize(idx, si, { stock: e.target.value })
                      }
                    />
                  </div>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => removeSize(idx, si)}
                    disabled={!Array.isArray(v.sizes) || v.sizes.length === 0}
                    style={{ height: 38 }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <div />
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => removeVariant(idx)}
                disabled={form.variants.length === 1}
              >
                Remove Variant
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button className="btn btn-ghost" type="button" onClick={addVariant}>
            + Add Variant
          </button>
          <button className="btn btn-primary" type="button" onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : editingProductId ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

