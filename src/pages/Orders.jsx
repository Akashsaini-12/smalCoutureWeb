import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listOrders } from "../redux/actions";
import { getUserId } from "../utils/userId";
import { formatSizeForCustomerDisplay } from "../utils/internalFreeSize";

function formatINR(n) {
  const num = Number(n || 0);
  if (!isFinite(num)) return "₹0";
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

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "delivered") return "green";
  if (s === "cancelled") return "red";
  if (s === "shipped") return "blue";
  return "slate";
}

function paymentTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return "green";
  if (s === "failed") return "red";
  if (s === "cod") return "amber";
  return "slate";
}

const toneStyles = {
  slate: { bg: "#f1f5f9", border: "#e2e8f0", text: "#0f172a" },
  green: { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  red: { bg: "#fff1f2", border: "#fecdd3", text: "#9f1239" },
  blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  amber: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
};

export default function Orders() {
  const userId = getUserId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    listOrders({ userId })
      .then((res) => {
        if (!mounted) return;
        setItems(Array.isArray(res?.items) ? res.items : []);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || "Failed to load orders");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const empty = useMemo(() => !loading && !items.length, [loading, items]);

  return (
    <main style={{ background: "#fff" }}>
      {detailOpen && selectedOrder ? (
        <div
          role="dialog"
          aria-label="Order details"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailOpen(false);
              setSelectedOrder(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "min(980px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
            }}
          >
            <div
              style={{
                padding: 14,
                borderBottom: "1px solid #eef2f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 950, color: "#0f172a" }}>Order details</div>
              <button
                type="button"
                onClick={() => {
                  setDetailOpen(false);
                  setSelectedOrder(null);
                }}
                style={{ ...btn, ...btnGhost, height: 34, padding: "6px 12px" }}
              >
                Close
              </button>
            </div>
            <OrderDetailsLikeAdmin order={selectedOrder} />
          </div>
        </div>
      ) : null}

      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: "#64748b", textTransform: "uppercase" }}>
              Account
            </div>
            <h1 style={{ margin: "2px 0 0", fontSize: 26, fontWeight: 950, color: "#0f172a" }}>Your orders</h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link to="/" style={{ ...btn, ...btnGhost }}>
              Continue shopping
            </Link>
            <Link to="/cart" style={{ ...btn, ...btnGhost }}>
              View cart
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 16px 90px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ color: "#64748b", fontWeight: 800 }}>
            {loading ? "Loading…" : `${items.length} order${items.length === 1 ? "" : "s"}`}
          </div>
          <button type="button" onClick={() => window.location.reload()} style={{ ...btn, ...btnGhost }}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ ...panel, padding: 18, color: "#64748b", fontWeight: 800 }}>
            Loading your orders…
          </div>
        ) : error ? (
          <div style={{ ...panel, padding: 18, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b", fontWeight: 900 }}>
            {error}
          </div>
        ) : empty ? (
          <div style={{ ...panel, padding: 18, color: "#64748b", fontWeight: 800 }}>
            No orders yet.
            <div style={{ marginTop: 10 }}>
              <Link to="/AllProducts" style={{ ...btn, ...btnPrimary }}>
                Start shopping
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((o) => {
              const status = String(o.status || "created").toUpperCase();
              const pay = String(o.paymentStatus || "pending").toUpperCase();
              const statusStyle = toneStyles[statusTone(o.status)] || toneStyles.slate;
              const payStyle = toneStyles[paymentTone(o.paymentStatus)] || toneStyles.slate;
              const itemCount = Array.isArray(o.items) ? o.items.length : 0;
              const preview = (o.items || []).slice(0, 5);
              return (
                <button
                  key={o._id}
                  type="button"
                  onClick={() => {
                    setSelectedOrder(o);
                    setDetailOpen(true);
                  }}
                  style={{
                    ...panel,
                    padding: 10,
                    textAlign: "left",
                    cursor: "pointer",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 900, letterSpacing: 0.6 }}>
                        ORDER ID
                      </div>
                      <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13, wordBreak: "break-all" }}>
                        {o._id}
                      </div>
                      <div style={{ marginTop: 3, color: "#64748b", fontWeight: 800, fontSize: 11 }}>
                        Placed on {formatDate(o.createdAt)}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ ...badge(statusStyle), textTransform: "uppercase" }}>{status}</span>
                      <span style={{ ...badge(payStyle), textTransform: "uppercase" }}>{pay}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 900, letterSpacing: 0.6 }}>
                          TOTAL
                        </div>
                        <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 14 }}>
                          {formatINR(o.total)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                      {o.couponCode ? (
                        <span style={{ marginLeft: 10, fontWeight: 900, color: "#0f172a" }}>
                          Coupon: {o.couponCode}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                      Shipping: {formatINR(o.shipping)} • Discount: {formatINR(o.discount)}
                    </div>
                  </div>

                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {preview.slice(0, 3).map((it, idx) => (
                      <div key={it.cartItemId || `${it.productId}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: "#f1f5f9", overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}>
                          {it?.image ? <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                        </div>
                        <div style={{ minWidth: 0, maxWidth: 180 }}>
                          <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 12, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {it.name}
                          </div>
                          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Qty {it.quantity}
                            {formatSizeForCustomerDisplay(it.size)
                              ? ` • ${formatSizeForCustomerDisplay(it.size)}`
                              : ""}
                            {it.color ? ` • ${it.color}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                    {itemCount > 3 ? (
                      <div style={{ padding: "8px 10px", borderRadius: 999, border: "1px dashed #cbd5e1", color: "#64748b", fontWeight: 950, background: "#fafafa", fontSize: 12 }}>
                        +{itemCount - 3} more items
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function OrderDetailsLikeAdmin({ order }) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const ship = order?.shippingAddress || order?.address || {};
  const statusKey = String(order?.status || "created").toLowerCase();
  const paymentKey = String(order?.paymentStatus || "pending").toLowerCase();

  const subtotal =
    Number(
      order?.subtotal ??
        items.reduce(
          (sum, it) =>
            sum + (Number(it?.price || 0) || 0) * (Number(it?.quantity || 1) || 1),
          0,
        ),
    ) || 0;
  const discount = Number(order?.discount ?? order?.couponDiscount ?? 0) || 0;
  const shippingFee = Number(order?.shippingFee ?? order?.shipping ?? 0) || 0;
  const tax = Number(order?.tax ?? 0) || 0;
  const total =
    Number(order?.total) || Math.max(0, subtotal + shippingFee + tax - discount);

  const orderNumber = order?.orderNumber || order?.orderNo || order?._id || "-";

  const history = [
    { key: "delivered", label: "Delivered", at: order?.deliveredAt || null },
    { key: "shipped", label: "Shipped", at: order?.shippedAt || null },
    {
      key: "dispatched",
      label: "Dispatch from warehouse",
      at: order?.dispatchedAt || null,
    },
    { key: "processing", label: "Pickup being Prepared", at: order?.processingAt || null },
    { key: "created", label: "Order Created", at: order?.createdAt || null },
  ];

  const rank = {
    created: 0,
    confirmed: 1,
    processing: 2,
    dispatched: 3,
    shipped: 4,
    delivered: 5,
    cancelled: -1,
  };
  const currentRank = rank[statusKey] ?? 0;
  const topKey =
    statusKey === "delivered"
      ? "delivered"
      : statusKey === "shipped"
        ? "shipped"
        : statusKey === "processing"
          ? "processing"
          : statusKey === "confirmed"
            ? "confirmed"
            : statusKey === "cancelled"
              ? "cancelled"
              : "created";

  const stateFor = (key) => {
    const r = rank[key] ?? 0;
    if (statusKey === "cancelled") {
      if (key === "cancelled") return "current";
      if (key === "created") return "completed";
      return "upcoming";
    }
    if (key === topKey) return "current";
    if (r <= currentRank) return "completed";
    return "upcoming";
  };

  return (
    <div style={{ padding: 14 }}>
      <div style={{ background: "#f6f7fb", borderRadius: 14, padding: 14 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "baseline" }}>
            <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 15 }}>
              Order Number{" "}
              <span style={{ color: "#111827" }}>#{String(orderNumber).slice(-8)}</span>
            </div>
            <div style={{ fontWeight: 900, color: "#64748b", fontSize: 12 }}>
              {String(statusKey || "created")
                .replace(/_/g, " ")
                .toUpperCase()}
            </div>
            <div style={{ fontWeight: 900, color: "#94a3b8", fontSize: 12 }}>
              {order?.createdAt ? formatDate(order.createdAt) : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                background: paymentKey === "paid" ? "#dcfce7" : "#fff7ed",
                color: paymentKey === "paid" ? "#166534" : "#9a3412",
                fontWeight: 950,
                fontSize: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              Payment: {paymentKey.toUpperCase()}
            </span>
            <span
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                background: "#fff",
                border: "1px solid #e5e7eb",
                fontWeight: 950,
                color: "#0f172a",
                fontSize: 12,
              }}
            >
              Total: {formatINR(total)}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gridTemplateRows: "auto auto", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 12 }}>Customer Details</div>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    🔍
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, fontSize: 12 }}>
                    <div style={{ color: "#94a3b8", fontWeight: 900 }}>Name</div>
                    <div style={{ color: "#0f172a", fontWeight: 950 }}>{ship?.name || order?.userName || order?.customerName || "-"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, fontSize: 12 }}>
                    <div style={{ color: "#94a3b8", fontWeight: 900 }}>Email</div>
                    <div style={{ color: "#4f46e5", fontWeight: 950, wordBreak: "break-all" }}>{order?.email || ship?.email || "-"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, fontSize: 12 }}>
                    <div style={{ color: "#94a3b8", fontWeight: 900 }}>Phone</div>
                    <div style={{ color: "#0f172a", fontWeight: 950 }}>{order?.phone || ship?.phone || "-"}</div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 12 }}>Delivery Address</div>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    🧾
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                    <div style={{ color: "#94a3b8", fontWeight: 900 }}>Address Line</div>
                    <div style={{ color: "#0f172a", fontWeight: 950 }}>
                      {ship?.line1 || ship?.address1 || "-"}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                    <div style={{ color: "#94a3b8", fontWeight: 900 }}>Flat / Building</div>
                    <div style={{ color: "#0f172a", fontWeight: 950 }}>
                      {ship?.line2 || ship?.address2 || ship?.landmark || "-"}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                    <div style={{ color: "#94a3b8", fontWeight: 900 }}>City / State</div>
                    <div style={{ color: "#0f172a", fontWeight: 950 }}>
                      {[ship?.city, ship?.state].filter(Boolean).join(", ") || "-"}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                    <div style={{ color: "#94a3b8", fontWeight: 900 }}>Postcode</div>
                    <div style={{ color: "#0f172a", fontWeight: 950 }}>
                      {ship?.postalCode || ship?.pincode || ship?.zip || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #eef2f7",
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.3fr) 90px 110px 110px",
                  gap: 10,
                  color: "#64748b",
                  fontWeight: 950,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                <div>Item Summary</div>
                <div style={{ textAlign: "center" }}>Qty</div>
                <div style={{ textAlign: "right" }}>Price</div>
                <div style={{ textAlign: "right" }}>Total Price</div>
              </div>

              <div style={{ display: "grid" }}>
                {items.length ? (
                  items.map((it, idx) => {
                    const qty = Number(it?.quantity ?? it?.qty ?? 1) || 1;
                    const price = Number(it?.price || 0) || 0;
                    const lineTotal = price * qty;
                    return (
                      <div
                        key={String(it?.cartItemId || it?.variantId || idx)}
                        style={{
                          background: idx % 2 === 0 ? "#fff" : "#fbfcff",
                          padding: "12px 14px",
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1.3fr) 90px 110px 110px",
                          gap: 10,
                          alignItems: "center",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 10,
                              overflow: "hidden",
                              background: "#f1f5f9",
                              border: "1px solid #e5e7eb",
                              flexShrink: 0,
                            }}
                          >
                            {it?.image ? (
                              <img
                                src={it.image}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : null}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 950,
                                color: "#0f172a",
                                fontSize: 12,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {it?.name || it?.title || "Product"}
                            </div>
                            <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 11 }}>
                              {it?.color ? `Color: ${it.color}` : "Color: -"}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "center", fontWeight: 950, color: "#0f172a", fontSize: 12 }}>
                          x{qty}
                        </div>
                        <div style={{ textAlign: "right", fontWeight: 900, color: "#334155", fontSize: 12 }}>
                          {formatINR(price)}
                        </div>
                        <div style={{ textAlign: "right", fontWeight: 950, color: "#0f172a", fontSize: 12 }}>
                          {formatINR(lineTotal)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>
                    No items
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 12 }}>
                  Order History
                </div>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ⋮
                </div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {history.map((h, idx) => {
                  const state = stateFor(h.key);
                  const isCurrent = state === "current";
                  const isDone = state === "completed" || isCurrent;
                  const dotBg = isCurrent ? "#4f46e5" : isDone ? "#a5b4fc" : "#e2e8f0";
                  const dotRing = isCurrent ? "0 0 0 4px #eef2ff" : "none";
                  const lineColor = idx < history.length - 1 ? (isDone ? "#c7d2fe" : "#e2e8f0") : "transparent";

                  return (
                    <div
                      key={`${h.key}-${idx}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "18px 1fr",
                        gap: 12,
                        alignItems: "start",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div
                          style={{
                            width: isCurrent ? 12 : 10,
                            height: isCurrent ? 12 : 10,
                            borderRadius: "50%",
                            background: dotBg,
                            boxShadow: dotRing,
                            marginTop: 2,
                          }}
                        />
                        {idx < history.length - 1 ? (
                          <div
                            style={{
                              width: 2,
                              height: 26,
                              borderRadius: 2,
                              background: lineColor,
                              marginTop: 6,
                            }}
                          />
                        ) : null}
                      </div>
                      <div style={{ display: "grid", gap: 3 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div
                            style={{
                              fontWeight: 950,
                              color: isCurrent ? "#0f172a" : isDone ? "#334155" : "#94a3b8",
                              fontSize: 12,
                            }}
                          >
                            {h.label}
                          </div>
                          {isCurrent ? (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 950,
                                color: "#4f46e5",
                                background: "#eef2ff",
                                border: "1px solid #c7d2fe",
                                padding: "2px 8px",
                                borderRadius: 999,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                alignSelf: "start",
                              }}
                            >
                              Current
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontWeight: 800, color: "#94a3b8", fontSize: 11 }}>
                          {h.at ? formatDate(h.at) : isCurrent && order?.updatedAt ? formatDate(order.updatedAt) : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 12 }}>
                Order Summary
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>Payment</span>
                  <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 12 }}>
                    {order?.paymentMethod || order?.payment?.method || "-"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>Subtotal</span>
                  <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 12 }}>{formatINR(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>Discount</span>
                  <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 12 }}>
                    {discount ? `- ${formatINR(discount)}` : formatINR(0)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>Delivery Fee</span>
                  <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 12 }}>{formatINR(shippingFee)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>Tax</span>
                  <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 12 }}>{formatINR(tax)}</span>
                </div>
                <div style={{ borderTop: "1px solid #eef2f7", paddingTop: 10, display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 12 }}>Total</span>
                  <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 13 }}>{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const panel = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#fff",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

const btn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
  border: "1px solid transparent",
  cursor: "pointer",
};

const btnGhost = {
  background: "#fff",
  borderColor: "#e5e7eb",
  color: "#0f172a",
};

const btnPrimary = {
  background: "#111",
  borderColor: "#111",
  color: "#fff",
};

const badge = (tone) => ({
  padding: "4px 8px",
  borderRadius: 999,
  border: `1px solid ${tone.border}`,
  background: tone.bg,
  color: tone.text,
  fontWeight: 950,
  fontSize: 10,
  letterSpacing: 0.6,
});

