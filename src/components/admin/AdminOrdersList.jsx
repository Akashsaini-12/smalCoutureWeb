import React, { useEffect, useMemo, useRef, useState } from "react";

function formatINR(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return "₹0";
  return `₹${num.toFixed(0)}`;
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
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

const DATE_FILTER_OPTIONS = [
  { value: "all", label: "All dates" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last 1 year" },
  { value: "custom", label: "Custom date" },
];

export default function AdminOrdersList({
  query,
  onQueryChange,
  loading,
  error,
  items,
  onRowClick,
}) {
  const colSpan = 5;
  const safeItems = Array.isArray(items) ? items : [];
  const [dateSortDirection, setDateSortDirection] = useState("desc");
  const [dateFilter, setDateFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const filterRef = useRef(null);

  useEffect(() => {
    if (!filterOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!filterRef.current?.contains(event.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [filterOpen]);

  const visibleItems = useMemo(() => {
    if (dateFilter === "all") return safeItems;

    const now = new Date();
    let from = null;
    let to = now;
    if (dateFilter === "custom") {
      from = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
      to = customTo ? new Date(`${customTo}T23:59:59.999`) : null;
    } else if (dateFilter === "7d" || dateFilter === "30d") {
      from = new Date(now.getTime() - Number(dateFilter.slice(0, -1)) * 24 * 60 * 60 * 1000);
    } else {
      from = new Date(now);
      const monthCount = dateFilter === "1y" ? 12 : Number(dateFilter.slice(0, -1));
      from.setMonth(from.getMonth() - monthCount);
    }

    const fromTime = from?.getTime();
    const toTime = to?.getTime();
    return safeItems.filter((order) => {
      const createdTime = new Date(order?.createdAt || 0).getTime();
      return (
        Number.isFinite(createdTime) &&
        (!Number.isFinite(fromTime) || createdTime >= fromTime) &&
        (!Number.isFinite(toTime) || createdTime <= toTime)
      );
    });
  }, [customFrom, customTo, dateFilter, safeItems]);
  const sortedItems = useMemo(() => {
    return [...visibleItems].sort((first, second) => {
      const firstTime = new Date(first?.createdAt || 0).getTime();
      const secondTime = new Date(second?.createdAt || 0).getTime();
      return dateSortDirection === "asc" ? firstTime - secondTime : secondTime - firstTime;
    });
  }, [dateSortDirection, visibleItems]);

  const selectedFilterLabel =
    DATE_FILTER_OPTIONS.find((option) => option.value === dateFilter)?.label || "Filter";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", position: "relative" }}>
        <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>Orders</div>
        <div ref={filterRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
            style={{
              padding: "10px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              background: dateFilter === "all" ? "#fff" : "#f3f4f6",
              color: "#111827",
              fontWeight: 900,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {selectedFilterLabel} ▾
          </button>
          {filterOpen ? (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 10,
                width: 220,
                padding: 12,
                border: "1px solid #dbe3ee",
                borderRadius: 12,
                background: "#fff",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.14)",
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                {DATE_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDateFilter(option.value)}
                    style={{
                      padding: "8px 10px",
                      border: 0,
                      borderRadius: 8,
                      background: dateFilter === option.value ? "#f3f4f6" : "transparent",
                      color: "#0f172a",
                      textAlign: "left",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {dateFilter === "custom" ? (
                <div style={{ display: "grid", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid #e5e7eb" }}>
                  <label style={{ display: "grid", gap: 4, color: "#475569", fontSize: 12, fontWeight: 800 }}>
                    From
                    <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
                  </label>
                  <label style={{ display: "grid", gap: 4, color: "#475569", fontSize: 12, fontWeight: 800 }}>
                    To
                    <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div
          style={{
            flex: "1 1 280px",
            display: "flex",
            alignItems: "center",
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            background: "#fff",
            overflow: "hidden",
          }}
        >
          <input
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search by Order ID / User ID / Mobile number"
            style={{
              flex: 1,
              minWidth: 0,
              padding: "12px 14px",
              border: 0,
              background: "transparent",
              fontWeight: 800,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => onQueryChange?.("")}
            aria-label="Clear search"
            title="Clear search"
            style={{
              marginRight: 6,
              width: 30,
              height: 30,
              border: 0,
              borderRadius: 7,
              background: query ? "#f3f4f6" : "transparent",
              color: query ? "#111827" : "#9ca3af",
              fontSize: 20,
              lineHeight: 1,
              cursor: query ? "pointer" : "default",
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div className="table-wrap">
        {error ? (
          <div
            style={{
              padding: 12,
              borderBottom: "1px solid var(--border)",
              color: "#991b1b",
              fontWeight: 900,
            }}
          >
            {error}
          </div>
        ) : null}

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>User</th>
              <th>
                <button
                  type="button"
                  onClick={() => setDateSortDirection((direction) => (direction === "asc" ? "desc" : "asc"))}
                  title={`Sort by placed date and time (${dateSortDirection === "desc" ? "oldest first" : "newest first"})`}
                  style={{
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    color: "inherit",
                    font: "inherit",
                    fontWeight: "inherit",
                    textTransform: "inherit",
                    letterSpacing: "inherit",
                    cursor: "pointer",
                  }}
                >
                  Order {dateSortDirection === "desc" ? "↓" : "↑"}
                </button>
              </th>
              <th>Payment</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={colSpan}
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    fontWeight: 800,
                    padding: 22,
                  }}
                >
                  Loading orders…
                </td>
              </tr>
            ) : !sortedItems.length ? (
              <tr>
                <td
                  colSpan={colSpan}
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    fontWeight: 800,
                    padding: 22,
                  }}
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              sortedItems.map((o, idx) => {
                const ship = o?.shippingAddress || o?.address || {};
                const name = ship?.name || o?.userName || o?.customerName || o?.name || "-";
                const phone = ship?.phone || o?.phone || "-";
                const addressLine = [
                  ship?.line1 || ship?.address1,
                  ship?.line2 || ship?.address2,
                  ship?.landmark,
                  ship?.city,
                  ship?.state,
                  ship?.postalCode || ship?.pincode || ship?.zip,
                ]
                  .filter(Boolean)
                  .join(", ");
                const productNames = (Array.isArray(o?.items) ? o.items : [])
                  .map((item) => item?.name || item?.title)
                  .filter(Boolean);
                return (
                <tr
                  key={String(o?._id || idx)}
                  onClick={() => onRowClick?.(o)}
                  style={{ cursor: "pointer" }}
                >
                  <td
                    style={{
                      fontWeight: 900,
                      color: "#334155",
                      wordBreak: "break-word",
                      fontSize: 12,
                    }}
                  >
                    {productNames.length ? productNames.join(", ") : "-"}
                  </td>
                  <td>
                    <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13 }}>
                      {name}
                    </div>
                    <div style={{ color: "#64748b", fontWeight: 800, marginTop: 3 }}>
                      {phone}
                    </div>
                    <div style={{ color: "#94a3b8", fontWeight: 800, marginTop: 3 }}>
                      {addressLine || "Address: -"}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        fontWeight: 950,
                        color: "#0f172a",
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o?._id || "-"}
                    </div>
                    <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                      Placed: {formatDate(o?.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 12 }}>
                      {String(o?.paymentStatus || "pending").toUpperCase()}
                      <div style={{ color: "#64748b", fontWeight: 800, marginTop: 4 }}>
                        {String(o?.status || "created").toUpperCase()}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 950, color: "#0f172a", fontSize: 13, textAlign: "right" }}>
                    {formatINR(o?.total)}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

