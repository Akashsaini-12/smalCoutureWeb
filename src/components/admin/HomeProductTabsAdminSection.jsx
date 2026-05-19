import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adminGetHomeBestSellers,
  adminGetHomeNewArrivals,
  adminUpdateHomeBestSellers,
  adminUpdateHomeNewArrivals,
  fetchCatalogProductsAdmin,
} from "../../redux/actions";

function firstImageFromCatalogProduct(p) {
  const v0 = Array.isArray(p?.variants) && p.variants[0] ? p.variants[0] : null;
  const img =
    (v0 && Array.isArray(v0.images) && v0.images[0]) ||
    p?.image ||
    "";
  return String(img || "");
}

function CuratedListEditor({
  title,
  subtitle,
  max = 40,
  getList,
  saveList,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedPreview, setSelectedPreview] = useState([]);

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const lastSearchRef = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getList();
      setSelectedIds(Array.isArray(res?.productIds) ? res.productIds.map(String) : []);
      setSelectedPreview(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e?.message || "Failed to load");
      setSelectedIds([]);
      setSelectedPreview([]);
    } finally {
      setLoading(false);
    }
  }, [getList]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const needle = String(q || "").trim();
    if (!needle) {
      setResults([]);
      return;
    }

    let mounted = true;
    const seq = Date.now();
    lastSearchRef.current = seq;
    setSearching(true);
    setError("");

    fetchCatalogProductsAdmin({
      page: 1,
      limit: 16,
      sortBy: "created-descending",
      search: needle,
    })
      .then((res) => {
        if (!mounted) return;
        if (lastSearchRef.current !== seq) return;
        setResults(Array.isArray(res?.items) ? res.items : []);
      })
      .catch((e) => {
        if (!mounted) return;
        if (lastSearchRef.current !== seq) return;
        setResults([]);
        setError(e?.message || "Search failed");
      })
      .finally(() => {
        if (!mounted) return;
        if (lastSearchRef.current !== seq) return;
        setSearching(false);
      });

    return () => {
      mounted = false;
    };
  }, [q]);

  const selectedSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);

  const previewById = useMemo(() => {
    const m = new Map();
    for (const p of Array.isArray(selectedPreview) ? selectedPreview : []) {
      const id = String(p?._id || "");
      if (id) m.set(id, p);
    }
    return m;
  }, [selectedPreview]);

  const addId = (id) => {
    const pid = String(id || "").trim();
    if (!pid) return;
    if (selectedSet.has(pid)) return;
    setSelectedIds((prev) => [...prev, pid].slice(0, max));
  };

  const removeId = (id) => {
    const pid = String(id || "").trim();
    setSelectedIds((prev) => prev.filter((x) => String(x) !== pid));
  };

  const move = (id, dir) => {
    const pid = String(id || "").trim();
    setSelectedIds((prev) => {
      const idx = prev.findIndex((x) => String(x) === pid);
      if (idx < 0) return prev;
      const nextIdx = idx + (dir === "up" ? -1 : 1);
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = prev.slice();
      const tmp = copy[idx];
      copy[idx] = copy[nextIdx];
      copy[nextIdx] = tmp;
      return copy;
    });
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await saveList(selectedIds);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa", color: "#64748b", fontWeight: 800 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 14 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ flex: "1 1 240px", color: "#64748b", fontWeight: 800, fontSize: 12 }}>
            {subtitle}
          </div>
        ) : null}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          disabled={saving}
          style={{ width: "auto", padding: "10px 14px", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {error ? (
        <div style={{ padding: 12, border: "1px solid #fecaca", borderRadius: 12, background: "#fef2f2", color: "#991b1b", fontWeight: 900 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13 }}>Selected ({selectedIds.length}/{max})</div>
        {!selectedIds.length ? (
          <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>No products selected yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {selectedIds.map((id, idx) => {
              const p = previewById.get(String(id));
              const name = String(p?.name || "Product");
              const img = firstImageFromCatalogProduct(p);
              return (
                <div
                  key={id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px minmax(0, 1fr) auto",
                    gap: 10,
                    alignItems: "center",
                    padding: 10,
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    background: idx % 2 === 0 ? "#fff" : "#fcfcff",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      color: "#64748b",
                      fontSize: 12,
                    }}
                  >
                    {img ? (
                      <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      "IMG"
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {idx + 1}. {name}
                    </div>
                    <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12, wordBreak: "break-all" }}>
                      {id}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button type="button" className="btn btn-ghost" style={{ width: "auto", padding: "8px 10px" }} onClick={() => move(id, "up")} disabled={idx === 0}>
                      ↑
                    </button>
                    <button type="button" className="btn btn-ghost" style={{ width: "auto", padding: "8px 10px" }} onClick={() => move(id, "down")} disabled={idx === selectedIds.length - 1}>
                      ↓
                    </button>
                    <button type="button" className="btn btn-danger" style={{ width: "auto", padding: "8px 10px" }} onClick={() => removeId(id)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13 }}>Search products</div>
          <div style={{ flex: "1 1 260px" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name / slug / brand / description"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                background: "#fff",
                fontWeight: 800,
                outline: "none",
              }}
            />
          </div>
          <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
            {searching ? "Searching…" : results.length ? `${results.length} results` : ""}
          </div>
        </div>

        {!q.trim() ? (
          <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
            Type something to search.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {results.map((p) => {
              const id = String(p?._id || "");
              const name = String(p?.name || "Product");
              const slug = String(p?.slug || "");
              const img = firstImageFromCatalogProduct(p);
              const inList = selectedSet.has(id);
              return (
                <div
                  key={id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px minmax(0, 1fr) auto",
                    gap: 10,
                    alignItems: "center",
                    padding: 10,
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      color: "#64748b",
                      fontSize: 12,
                    }}
                  >
                    {img ? (
                      <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      "IMG"
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name}
                    </div>
                    <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {slug ? `/products/${slug}` : "—"}
                    </div>
                    <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12, wordBreak: "break-all" }}>
                      {id}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={inList ? "btn btn-ghost" : "btn btn-primary"}
                    style={{ width: "auto", padding: "10px 12px" }}
                    onClick={() => addId(id)}
                    disabled={inList || selectedIds.length >= max}
                  >
                    {selectedIds.length >= max && !inList ? "Limit reached" : inList ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeProductTabsAdminSection() {
  const bestGet = useCallback(() => adminGetHomeBestSellers(), []);
  const bestSave = useCallback((ids) => adminUpdateHomeBestSellers(ids), []);
  const newGet = useCallback(() => adminGetHomeNewArrivals(), []);
  const newSave = useCallback((ids) => adminUpdateHomeNewArrivals(ids), []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>
        Home products (Best sellers & New arrivals)
      </div>
      <CuratedListEditor
        title="Best sellers"
        subtitle="Used on Home → Product tabs → Best sellers."
        max={40}
        getList={bestGet}
        saveList={bestSave}
      />
      <CuratedListEditor
        title="New arrivals"
        subtitle="Used on Home → Product tabs → New arrivals."
        max={40}
        getList={newGet}
        saveList={newSave}
      />
    </div>
  );
}

