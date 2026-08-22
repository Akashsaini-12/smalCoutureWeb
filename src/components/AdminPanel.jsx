import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { adminListOrders, adminListUsers, adminUpdateOrder, listOrders, logoutThunk } from "../redux/actions";
import SlidesAdminSection from "./admin/SlidesAdminSection";
import ProductsAdminSection from "./admin/ProductsAdminSection";
import CategoriesAdminSection from "./admin/CategoriesAdminSection";
import CatalogProductAdminSection from "./admin/CatalogProductAdminSection";
import CouponsAdminSection from "./admin/CouponsAdminSection";
import FilterPromoAdminSection from "./admin/FilterPromoAdminSection";
import MixMatchAdminSection from "./admin/MixMatchAdminSection";
import SiteBrandingAdminSection from "./admin/SiteBrandingAdminSection";
import ContactMessagesAdminSection from "./admin/ContactMessagesAdminSection";
import HappyCustomersAdminSection from "./admin/HappyCustomersAdminSection";
import HomeSuggestionsAdminSection from "./admin/HomeSuggestionsAdminSection";
import HomeProductTabsAdminSection from "./admin/HomeProductTabsAdminSection";
import CollectionHeaderAdminSection from "./admin/CollectionHeaderAdminSection";
import AdminOrdersList from "./admin/AdminOrdersList";
import AdminUsersTabComponent from "./admin/AdminUsersTab";
import { formatSizeForCustomerDisplay } from "../utils/internalFreeSize";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 99999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

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

function Modal({ open, title, onClose, children, width = "min(860px, 100%)" }) {
  if (!open) return null;
  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-label={title}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          background: "#fff",
          borderRadius: 12,
          padding: 18,
          boxShadow: "0 14px 48px rgba(0,0,0,0.25)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "#f1f5f9",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            Close
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

function ProductDetail({ item }) {
  const image = item?.image || "";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14 }}>
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#fff",
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 220,
        }}
      >
        {image ? (
          <img src={image} alt={item?.name || "Product"} style={{ maxWidth: "100%", maxHeight: 260, objectFit: "contain" }} />
        ) : (
          <div style={{ color: "#64748b", fontWeight: 800 }}>No image</div>
        )}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 15 }}>{item?.name || "Product"}</div>
        <div style={{ color: "#334155", fontWeight: 800, fontSize: 13 }}>
          {item?.color ? `Color: ${item.color}` : "Color: -"}{" "}
          {formatSizeForCustomerDisplay(item?.size)
            ? `• Size: ${formatSizeForCustomerDisplay(item.size)}`
            : ""}
        </div>
        <div style={{ display: "grid", gap: 8, border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fafafa" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#64748b", fontWeight: 900 }}>Quantity</span>
            <span style={{ color: "#0f172a", fontWeight: 950 }}>{item?.quantity ?? 1}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#64748b", fontWeight: 900 }}>Price</span>
            <span style={{ color: "#0f172a", fontWeight: 950 }}>{formatINR(item?.price)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#64748b", fontWeight: 900 }}>Line Total</span>
            <span style={{ color: "#0f172a", fontWeight: 950 }}>
              {formatINR((Number(item?.price || 0) || 0) * (Number(item?.quantity || 1) || 1))}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#64748b", fontWeight: 900 }}>Product ID</span>
            <span style={{ color: "#0f172a", fontWeight: 800, wordBreak: "break-all" }}>{item?.productId || "-"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#64748b", fontWeight: 900 }}>Variant ID</span>
            <span style={{ color: "#0f172a", fontWeight: 800, wordBreak: "break-all" }}>{item?.variantId || "-"}</span>
          </div>
          {item?.slug ? (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span style={{ color: "#64748b", fontWeight: 900 }}>Slug</span>
              <span style={{ color: "#0f172a", fontWeight: 800, wordBreak: "break-all" }}>{item.slug}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderDetail({ order, onItemClick }) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const shipping = order?.shippingAddress || {};
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

  return (
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
            Order Number <span style={{ color: "#111827" }}>#{String(orderNumber).slice(-8)}</span>
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
          {order?._id ? (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ height: 34 }}
                onClick={() => order?.onAdminAction?.("picked")}
                title="Mark as Picked (processing)"
              >
                Picked
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ height: 34 }}
                onClick={() => order?.onAdminAction?.("shipped")}
                title="Mark as Shipped"
              >
                Shipped
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ height: 34 }}
                onClick={() => order?.onAdminAction?.("delivered")}
                title="Mark as Delivered"
              >
                Delivered
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ height: 34 }}
                onClick={() => order?.onAdminAction?.("cancel")}
                title="Cancel Order"
              >
                Cancel
              </button>
            </>
          ) : null}
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
                  <div style={{ color: "#0f172a", fontWeight: 950 }}>{shipping?.name || order?.userName || order?.customerName || "-"}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 900 }}>Email</div>
                  <div style={{ color: "#4f46e5", fontWeight: 950, wordBreak: "break-all" }}>{order?.email || shipping?.email || "-"}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 900 }}>Phone</div>
                  <div style={{ color: "#0f172a", fontWeight: 950 }}>{order?.phone || shipping?.phone || "-"}</div>
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
                    {shipping?.line1 || shipping?.address1 || "-"}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 900 }}>Flat / Building</div>
                  <div style={{ color: "#0f172a", fontWeight: 950 }}>
                    {shipping?.line2 || shipping?.address2 || shipping?.landmark || "-"}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 900 }}>City / State</div>
                  <div style={{ color: "#0f172a", fontWeight: 950 }}>
                    {[shipping?.city, shipping?.state].filter(Boolean).join(", ") || "-"}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 900 }}>Postcode</div>
                  <div style={{ color: "#0f172a", fontWeight: 950 }}>
                    {shipping?.postalCode || shipping?.pincode || shipping?.zip || "-"}
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
                    <button
                      key={String(it?.cartItemId || it?.variantId || idx)}
                      type="button"
                      onClick={() => onItemClick?.(it)}
                      style={{
                        border: "none",
                        background: idx % 2 === 0 ? "#fff" : "#fbfcff",
                        padding: "12px 14px",
                        cursor: "pointer",
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1.3fr) 90px 110px 110px",
                        gap: 10,
                        alignItems: "center",
                        borderBottom: "1px solid #f1f5f9",
                        textAlign: "left",
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
                    </button>
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
              {(() => {
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

                return history.map((h, idx) => {
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
                });
              })()}
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
  );
}

function AdminOrdersTab({ adminListOrders }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [productOpen, setProductOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListOrders();
      const list = Array.isArray(res?.items) ? res.items : [];
      setOrders(list);
    } catch (e) {
      setError(e?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminListOrders]);

  const applyAdminAction = async (action, order) => {
    const id = order?._id;
    if (!id) return;
    const ok =
      action === "cancel"
        ? window.confirm("Cancel this order?")
        : true;
    if (!ok) return;

    const patch = {};
    if (action === "picked") patch.status = "processing";
    if (action === "shipped") patch.status = "shipped";
    if (action === "delivered") patch.status = "delivered";
    if (action === "cancel") patch.status = "cancelled";

    try {
      setUpdatingOrderId(id);
      const res = await adminUpdateOrder(id, patch);
      const updated = res?.item || null;
      setOrders((prev) =>
        prev.map((o) => (String(o?._id) === String(id) ? (updated || { ...o, ...patch }) : o)),
      );
      setSelectedOrder((prev) =>
        prev && String(prev?._id) === String(id) ? (updated || { ...prev, ...patch }) : prev,
      );
    } catch (e) {
      setError(e?.message || "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
      // Keep list in sync in case server sets timestamps
      await loadOrders();
    }
  };

  const filtered = useMemo(() => {
    const q = String(query || "").toLowerCase().trim();
    if (!q) return orders;
    return orders.filter((o) => {
      const oid = String(o?._id || "").toLowerCase();
      const uid = String(o?.userId || "").toLowerCase();
      const mail = String(o?.shippingAddress?.name || "").toLowerCase(); // fallback
      return oid.includes(q) || uid.includes(q) || mail.includes(q);
    });
  }, [orders, query]);

  const openOrder = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
    setProductOpen(false);
    setSelectedItem(null);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <AdminOrdersList
        query={query}
        onQueryChange={setQuery}
        loading={loading}
        error={error}
        items={filtered}
        onRowClick={openOrder}
      />

      <Modal
        open={detailOpen}
        title="Order details"
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrder(null);
        }}
      >
        {selectedOrder ? (
          <OrderDetail
            order={{
              ...selectedOrder,
              onAdminAction: (a) => {
                if (updatingOrderId) return;
                applyAdminAction(a, selectedOrder);
              },
            }}
            onItemClick={(it) => {
              setSelectedItem(it);
              setProductOpen(true);
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={productOpen}
        title="Product details"
        width="min(720px, 100%)"
        onClose={() => {
          setProductOpen(false);
          setSelectedItem(null);
        }}
      >
        {selectedItem ? <ProductDetail item={selectedItem} /> : null}
      </Modal>
    </div>
  );
}

function AdminUsersTab({ listOrders, adminListUsers }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [ordersOpen, setOrdersOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [productOpen, setProductOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    adminListUsers()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.users) ? res.users : [];
        setUsers(list);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || "Failed to load users");
        setUsers([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [adminListUsers]);

  const filtered = useMemo(() => {
    const q = String(query || "").toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const name = `${u?.firstName || ""} ${u?.lastName || ""}`.toLowerCase();
      const email = String(u?.email || "").toLowerCase();
      const phone = String(u?.phone || "").toLowerCase();
      const id = String(u?._id || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
    });
  }, [users, query]);

  const openUserOrders = async (u) => {
    setSelectedUser(u);
    setOrdersOpen(true);
    setOrdersLoading(true);
    setOrdersError("");
    setUserOrders([]);
    setDetailOpen(false);
    setSelectedOrder(null);
    setProductOpen(false);
    setSelectedItem(null);

    try {
      const res = await listOrders({ userId: u?._id || "" });
      setUserOrders(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setOrdersError(e?.message || "Failed to load orders for user");
    } finally {
      setOrdersLoading(false);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
    setProductOpen(false);
    setSelectedItem(null);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>Users</div>
        <div style={{ flex: "1 1 280px" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name / email / phone / userId"
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
      </div>

      {loading ? (
        <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa", color: "#64748b", fontWeight: 800 }}>
          Loading users…
        </div>
      ) : error ? (
        <div style={{ padding: 16, border: "1px solid #fecaca", borderRadius: 12, background: "#fef2f2", color: "#991b1b", fontWeight: 900 }}>
          {error}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((u, idx) => {
            const id = String(u?._id || "");
            const name = `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "User";
            return (
              <button
                key={id || idx}
                type="button"
                onClick={() => openUserOrders(u)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: 14,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  background: idx % 2 === 0 ? "#fff" : "#fcfcff",
                  cursor: "pointer",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {name}
                  </div>
                  <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u?.email || "—"} {u?.phone ? `• ${u.phone}` : ""}
                  </div>
                  <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 12, marginTop: 6, wordBreak: "break-all" }}>
                    ID: {id || "-"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontWeight: 950, color: u?.isVerified ? "#166534" : "#b91c1c", background: u?.isVerified ? "#dcfce7" : "#fef2f2", border: `1px solid ${u?.isVerified ? "#bbf7d0" : "#fecaca"}`, padding: "4px 10px", borderRadius: 999, fontSize: 12 }}>
                    {u?.isVerified ? "Verified" : "Not verified"}
                  </span>
                  <span style={{ fontWeight: 950, color: "#0f172a", fontSize: 12, textDecoration: "underline" }}>View Orders →</span>
                </div>
              </button>
            );
          })}
          {!filtered.length ? <div style={{ color: "#64748b", fontWeight: 800 }}>No users found.</div> : null}
        </div>
      )}

      {/* User Orders modal */}
      <Modal
        open={ordersOpen}
        title={selectedUser ? `Orders for ${selectedUser.firstName || "User"}` : "User orders"}
        width="min(820px, 100%)"
        onClose={() => {
          setOrdersOpen(false);
          setSelectedUser(null);
          setUserOrders([]);
        }}
      >
        {ordersLoading ? (
          <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>Loading orders…</div>
        ) : ordersError ? (
          <div style={{ padding: 16, color: "#991b1b", fontWeight: 900 }}>{ordersError}</div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)",
                gap: 10,
                padding: "12px 12px",
                background: "#f8fafc",
                fontWeight: 950,
                color: "#334155",
                fontSize: 12,
              }}
            >
              <div>Order</div>
              <div>Payment</div>
              <div style={{ textAlign: "right" }}>Total</div>
            </div>

            {userOrders.map((o, idx) => (
              <button
                key={String(o?._id || idx)}
                type="button"
                onClick={() => openOrderDetail(o)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)",
                  gap: 10,
                  padding: 12,
                  cursor: "pointer",
                  borderBottom: "1px solid #e5e7eb",
                  background: idx % 2 === 0 ? "#fff" : "#fcfcff",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o?._id || "-"}
                  </div>
                  <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>Placed: {formatDate(o?.createdAt)}</div>
                </div>
                <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 12 }}>
                  {String(o?.paymentStatus || "pending").toUpperCase()}
                  <div style={{ color: "#64748b", fontWeight: 800, marginTop: 4 }}>{String(o?.status || "created").toUpperCase()}</div>
                </div>
                <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13, textAlign: "right" }}>{formatINR(o?.total)}</div>
              </button>
            ))}

            {!userOrders.length ? <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>No orders yet.</div> : null}
          </div>
        )}
      </Modal>

      {/* Order detail modal */}
      <Modal
        open={detailOpen}
        title="Order details"
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrder(null);
        }}
      >
        {selectedOrder ? (
          <OrderDetail
            order={selectedOrder}
            onItemClick={(it) => {
              setSelectedItem(it);
              setProductOpen(true);
            }}
          />
        ) : null}
      </Modal>

      {/* Product detail modal */}
      <Modal
        open={productOpen}
        title="Product details"
        width="min(720px, 100%)"
        onClose={() => {
          setProductOpen(false);
          setSelectedItem(null);
        }}
      >
        {selectedItem ? <ProductDetail item={selectedItem} /> : null}
      </Modal>
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("slides");
  const [catalogEditProductId, setCatalogEditProductId] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth || {});

  const user = auth.user;
  const token = auth.token;
  useEffect(() => {
    // Protect admin route: only verified admin (role === 0) can stay here.
    if (!token || !user || user.role !== 0) {
      navigate("/login");
    }
  }, [token, user, navigate]);

  const initials = useMemo(() => {
    const f = String(user?.firstName || "").trim();
    const l = String(user?.lastName || "").trim();
    const i = (f[0] || l[0] || "A").toUpperCase();
    return i;
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/account");
  };


  const navItems = [
    { id: "slides", icon: "🖼️", label: "Slides" },
    { id: "collection-header", icon: "🧾", label: "Collection header" },
    { id: "products", icon: "📦", label: "Products" },
    { id: "categories", icon: "🏷️", label: "Categories & nav" },
    { id: "branding", icon: "🏷️", label: "Branding (logo)" },
    { id: "contact-messages", icon: "✉️", label: "Contact messages" },
    { id: "happy-customers", icon: "⭐", label: "Happy customers" },
    { id: "home-suggestions", icon: "✨", label: "Home suggestions" },
    { id: "home-product-tabs", icon: "🛍️", label: "Home products" },
    { id: "users", icon: "👥", label: "Users" },
    { id: "orders", icon: "🧾", label: "Orders" },
    { id: "add-product", icon: "➕", label: "Add Product" },
    { id: "mixmatch", icon: "🧩", label: "Mix & Match" },
    { id: "coupons", icon: "🎟️", label: "Coupons" },
    { id: "filter-promo", icon: "🏷️", label: "Filters promo" },
  ];

  const currentLabel =
    navItems.find((n) => n.id === activeTab)?.label || "Slides";

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            AdminX
            <span>Control Panel</span>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section">Content</div>
            {navItems.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  // If user navigates away from the editor, drop any "load for edit" trigger.
                  if (item.id !== "add-product") setCatalogEditProductId(null);
                }}
              >
                <span className="nav-icon">{item.icon}</span> {item.label}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="avatar">{initials}</div>
              <div>
                <div className="user-info">
                  {String(user?.firstName || "Admin").trim()}
                  {user?.lastName ? ` ${String(user.lastName).trim()}` : ""}
                </div>
                <div className="user-role">
                  {String(user?.email || "Admin").trim()}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "9px 12px", width: "auto" }}
                onClick={goToProfile}
              >
                My profile
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: "9px 12px", width: "auto" }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">{currentLabel}</div>
            </div>
            <div className="topbar-actions" />
          </div>

          <div className="content">
            {activeTab === "slides" && (
              <SlidesAdminSection />
            )}

            {activeTab === "collection-header" && <CollectionHeaderAdminSection />}

            {activeTab === "products" && (
              <ProductsAdminSection
                onEditProduct={(id) => {
                  setCatalogEditProductId(id);
                  setActiveTab("add-product");
                }}
              />
            )}

            {activeTab === "categories" && <CategoriesAdminSection />}

            {activeTab === "branding" && <SiteBrandingAdminSection />}

            {activeTab === "contact-messages" && <ContactMessagesAdminSection />}

            {activeTab === "happy-customers" && <HappyCustomersAdminSection />}

            {activeTab === "home-suggestions" && <HomeSuggestionsAdminSection />}

            {activeTab === "home-product-tabs" && <HomeProductTabsAdminSection />}

            {activeTab === "users" && (
              <AdminUsersTabComponent
                listOrders={listOrders}
                adminListUsers={adminListUsers}
                Modal={Modal}
                OrderDetail={OrderDetail}
                ProductDetail={ProductDetail}
                formatDate={formatDate}
                formatINR={formatINR}
              />
            )}

            {activeTab === "orders" && (
              <AdminOrdersTab adminListOrders={adminListOrders} />
            )}

            {activeTab === "add-product" && (
              <CatalogProductAdminSection
                initialProductIdToEdit={catalogEditProductId}
                onEditCancel={() => setCatalogEditProductId(null)}
              />
            )}

            {activeTab === "mixmatch" && <MixMatchAdminSection />}

            {activeTab === "coupons" && <CouponsAdminSection />}

            {activeTab === "filter-promo" && <FilterPromoAdminSection />}
          </div>
        </main>
      </div>

    </>
  );
}
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #f5f5f7;
    --surface: #ffffff;
    --surface2: #f3f4f6;
    --border: #e5e7eb;
    --accent: #2563eb;
    --accent2: #f97373;
    --accent3: #16a34a;
    --text: #111827;
    --muted: #6b7280;
    --radius: 12px;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

  .shopify-section {
    background: var(--bg);
  }

  .app { display: flex; min-height: 100vh; background: var(--bg); }

  /* SIDEBAR */
  .sidebar {
    width: 240px; min-height: 100vh; background: #ffffff;
    border-right: 1px solid #e5e7eb; padding: 24px 0;
    display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
    overflow: hidden;
  }
  .sidebar-logo {
    padding: 0 24px 32px; font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 22px; letter-spacing: -0.5px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .sidebar-logo span { display: block; font-size: 10px; font-weight: 400; letter-spacing: 3px; color: #6b7280; -webkit-text-fill-color: #6b7280; text-transform: uppercase; margin-top: 2px; }
  .sidebar-nav {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 12px;
  }
  .nav-section { padding: 8px 16px 4px; font-size: 10px; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; font-weight: 500; margin-top: 8px; }
  .nav-item {
    display: flex; align-items: center; gap: 12px; padding: 10px 24px;
    cursor: pointer; transition: all 0.2s; color: #4b5563; font-size: 14px;
    border-left: 2px solid transparent; margin: 2px 0;
  }
  .nav-item:hover { color: var(--accent); background: #eff6ff; }
  .nav-item.active { color: #111827; border-left-color: var(--accent); background: #dbeafe; }
  .nav-icon { font-size: 18px; width: 20px; text-align: center; }
  .sidebar-footer { padding: 16px 24px; border-top: 1px solid #e5e7eb; }
  .user-chip { display: flex; align-items: center; gap: 10px; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: white; }
  .user-info { font-size: 13px; font-weight: 500; color: #111827; }
  .user-role { font-size: 11px; color: #6b7280; }

  /* MAIN */
  .main { margin-left: 240px; flex: 1; min-height: 100vh; }
  .topbar {
    position: sticky; top: 0; z-index: 50; background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    padding: 16px 32px; display: flex; align-items: center; justify-content: space-between;
  }
  .topbar-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 20px; color: #111827; }
  .topbar-actions { display: flex; gap: 10px; align-items: center; }
  .badge { background: rgba(37,99,235,0.1); color: var(--accent); font-size: 11px; padding: 2px 8px; border-radius: 20px; border: 1px solid rgba(37,99,235,0.25); }

  .content { padding: 32px; }

  /* SECTION */
  .section { margin-bottom: 32px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .section-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; }
  .section-desc { font-size: 13px; color: #9ca3af; margin-top: 2px; }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px;
    border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
    border: none; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #5a52d5; transform: translateY(-1px); }
  .btn-danger { background: rgba(255,101,132,0.15); color: var(--accent2); border: 1px solid rgba(255,101,132,0.3); }
  .btn-danger:hover { background: rgba(255,101,132,0.25); }
  .btn-ghost { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-success { background: rgba(67,233,123,0.15); color: var(--accent3); border: 1px solid rgba(67,233,123,0.3); }

  /* TABLE */
  .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  th {
    padding: 14px 16px;
    text-align: left;
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #111827;
    border-bottom: 1px solid var(--border);
    background: #e5e7eb;
    font-weight: 600;
  }
  td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid var(--border); vertical-align: middle; color: var(--text); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(108,99,255,0.04); }

  .status-pill {
    display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500;
  }
  .status-open { background: rgba(108,99,255,0.15); color: var(--accent); }
  .status-closed { background: rgba(67,233,123,0.15); color: var(--accent3); }
  .status-escalated { background: rgba(255,101,132,0.15); color: var(--accent2); }
  .status-active { background: rgba(67,233,123,0.15); color: var(--accent3); }
  .status-inactive { background: rgba(107,114,128,0.2); color: var(--muted); }
  .status-oos { background: rgba(255,101,132,0.15); color: var(--accent2); }

  .action-btn { padding: 6px 8px; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s; font-size: 14px; }
  .action-edit { background: rgba(108,99,255,0.15); color: var(--accent); }
  .action-edit:hover { background: var(--accent); color: white; }
  .action-del { background: rgba(255,101,132,0.15); color: var(--accent2); }
  .action-del:hover { background: var(--accent2); color: white; }

  /* SLIDES GRID */
  .slides-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .slide-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden; transition: transform 0.2s, border-color 0.2s;
  }
  .slide-card:hover { transform: translateY(-3px); border-color: var(--accent); }
  .slide-img { width: 100%; height: 140px; object-fit: cover; }
  .slide-body { padding: 14px; }
  .slide-title { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
  .slide-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .slide-order { font-size: 11px; color: var(--muted); }
  .slide-card.add-card {
    border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 8px; cursor: pointer; min-height: 220px; color: var(--muted);
    transition: all 0.2s;
  }
  .slide-card.add-card:hover { border-color: var(--accent); color: var(--accent); background: rgba(108,99,255,0.04); }
  .add-icon { font-size: 36px; }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.2s;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
    animation: slideUp 0.25s;
  }
  @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .modal-header { padding: 24px 24px 0; display: flex; align-items: center; justify-content: space-between; }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; }
  .modal-close { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; width: 32px; height: 32px; cursor: pointer; color: var(--muted); font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .modal-close:hover { color: var(--text); border-color: var(--accent); }
  .modal-body { padding: 24px; }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .form-input, .form-select, .form-textarea {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px 14px; color: var(--text); font-size: 14px;
    font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent); }
  /* Native dropdown arrow + list — appearance:none looked like a plain text box */
  .form-select {
    appearance: auto;
    -webkit-appearance: menulist;
    cursor: pointer;
    min-height: 42px;
  }
  .form-textarea { resize: vertical; min-height: 80px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 0 24px 24px; }

  /* RESPONSIVE LAYOUT */
  @media (max-width: 1024px) {
    .app {
      flex-direction: column;
    }

    .sidebar {
      position: static;
      width: 100%;
      min-height: auto;
      flex-direction: column;
      align-items: stretch;
      padding: 12px 16px;
      gap: 16px;
    }

    .sidebar-logo {
      padding: 0;
      font-size: 18px;
    }

    .sidebar-nav {
      flex: 1;
      display: flex;
      align-items: center;
      overflow-x: auto;
    }

    .nav-section {
      display: none;
    }

    .nav-item {
      padding: 8px 12px;
      font-size: 13px;
      white-space: nowrap;
    }

    .sidebar-footer {
      display: block;
      padding: 16px 0 0;
      border-top: 1px solid #e5e7eb;
    }

    .user-chip {
      justify-content: flex-start;
    }

    .main {
      margin-left: 0;
    }

    .topbar {
      padding: 12px 16px;
    }

    .content {
      padding: 16px;
    }

    .slides-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    table {
      font-size: 12px;
    }

    /* On mobile/tablet the actions column can be pushed off-screen.
       Allow horizontal scroll instead of clipping it. */
    .table-wrap {
      overflow-x: auto;
    }
    table {
      min-width: 720px;
    }

    th,
    td {
      padding: 10px 8px;
    }
  }

  @media (max-width: 640px) {
    .slides-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .topbar-actions {
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .btn {
      padding: 7px 12px;
      font-size: 12px;
    }

    .section-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
    .section-header > div:last-child {
      justify-content: flex-start;
    }

    .search-bar {
      font-size: 13px;
    }
  }
`;