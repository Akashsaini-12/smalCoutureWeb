import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { adminDeleteOrder, adminDeleteUser, adminListOrders, adminListUsers, adminUpdateOrder, listOrders, logoutThunk } from "../redux/actions";
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

function formatAmount(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return "0";
  return num.toFixed(0);
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

function Modal({ open, title, onClose, children, width = "min(860px, 100%)", fullPage = false, closeLabel = "Close" }) {
  if (!open) return null;
  return (
    <div className={`modal-overlay${fullPage ? " order-detail-overlay" : ""}`} style={overlayStyle} onClick={onClose} role="dialog" aria-label={title}>
      <div
        className={`modal${fullPage ? " modal-full-page" : ""}`}
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
        <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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
            {closeLabel}
          </button>
        </div>
        <div className="modal-content" style={{ marginTop: 12 }}>{children}</div>
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
          <div className="order-summary-row" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#64748b", fontWeight: 900 }}>Quantity</span>
            <span style={{ color: "#0f172a", fontWeight: 950 }}>{item?.quantity ?? 1}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#64748b", fontWeight: 900 }}>Price</span>
            <span style={{ color: "#0f172a", fontWeight: 950 }}>{formatAmount(item?.price)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: "#64748b", fontWeight: 900 }}>Line Total</span>
            <span style={{ color: "#0f172a", fontWeight: 950 }}>
              {formatAmount((Number(item?.price || 0) || 0) * (Number(item?.quantity || 1) || 1))}
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
  const promoCode = String(
    order?.couponCode ||
      order?.promoCode ||
      order?.discountCode ||
      order?.coupon?.code ||
      order?.appliedCoupon?.code ||
      "",
  ).trim();
  const shippingFee = Number(order?.shippingFee ?? order?.shipping ?? 0) || 0;
  const tax = Number(order?.tax ?? 0) || 0;
  const total =
    Number(order?.total) || Math.max(0, subtotal + shippingFee + tax - discount);

  const orderNumber = order?.orderNumber || order?.orderNo || order?._id || "-";

  const history = [
    { key: "delivered", label: "Delivered", at: order?.deliveredAt || null },
    {
      key: "out_for_delivery",
      label: "Out for delivery",
      at: order?.outForDeliveryAt || order?.out_for_deliveryAt || null,
    },
    { key: "shipped", label: "Shipped", at: order?.shippedAt || null },
    { key: "processing", label: "Picked", at: order?.processingAt || null },
    { key: "created", label: "Order Created", at: order?.createdAt || null },
  ];

  return (
    <div className="order-detail-view" style={{ background: "#f6f7fb", borderRadius: 14, padding: 14 }}>
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
        <div className="order-detail-heading-meta" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "baseline" }}>
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
                className={`btn btn-ghost ${statusKey === "processing" ? "is-current-status" : ""}`}
                style={{ height: 34 }}
                onClick={() => order?.onAdminAction?.("picked")}
                title="Mark as Picked (processing)"
              >
                Picked
              </button>
              <button
                type="button"
                className={`btn btn-ghost ${statusKey === "shipped" ? "is-current-status" : ""}`}
                style={{ height: 34 }}
                onClick={() => order?.onAdminAction?.("shipped")}
                title="Mark as Shipped"
              >
                Shipped
              </button>
              <button
                type="button"
                className={`btn btn-ghost ${statusKey === "delivered" ? "is-current-status" : ""}`}
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
            {paymentKey.toUpperCase()}
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
            Total: {formatAmount(total)}
          </span>
        </div>
      </div>

      <div className="order-detail-columns"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 12,
        }}
      >
        <div className="order-detail-main" style={{ display: "grid", gridTemplateRows: "auto auto", gap: 12 }}>
          <div className="order-detail-info-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <div className="order-detail-items-card"
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 14,
              }}
            >
              <div className="order-summary-row" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 900 }}>Alternate phone</div>
                  <div style={{ color: "#0f172a", fontWeight: 950 }}>
                    {order?.alternatePhone || shipping?.alternatePhone || "-"}
                  </div>
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
              <div className="delivery-address-heading" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 12 }}>Delivery Address</div>
                <span className="delivery-address-type">
                  {shipping?.label || shipping?.addressLabel || order?.addressLabel || "Home"}
                </span>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  🧾
                </div>
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 900 }}>Flat/House/building name</div>
                  <div style={{ color: "#0f172a", fontWeight: 950 }}>
                    {shipping?.address1 || shipping?.line1 || "-"}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 900 }}>Area / Sector / Locality</div>
                  <div style={{ color: "#0f172a", fontWeight: 950 }}>
                    {shipping?.city || shipping?.area || shipping?.locality || "-"}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 900 }}>Pincode</div>
                  <div style={{ color: "#0f172a", fontWeight: 950 }}>
                    {shipping?.pincode || shipping?.postalCode || shipping?.zip || "-"}
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
                        {formatAmount(price)}
                      </div>
                      <div style={{ textAlign: "right", fontWeight: 950, color: "#0f172a", fontSize: 12 }}>
                        {formatAmount(lineTotal)}
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

        <div className="order-detail-sidebar" style={{ display: "grid", gap: 12 }}>
          <div className="order-detail-history-card"
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
                  out_for_delivery: 5,
                  delivered: 6,
                  cancelled: -1,
                };
                const currentRank = rank[statusKey] ?? 0;
                const topKey =
                  statusKey === "delivered"
                    ? "delivered"
                    : statusKey === "out_for_delivery"
                      ? "out_for_delivery"
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

                const timeline = [...history].reverse();
                return (
                  <div className="order-history-horizontal">
                    {timeline.map((h, idx) => {
                  const state = stateFor(h.key);
                  const isCurrent = state === "current";
                  const isDone = state === "completed" || isCurrent;
                  const dotBg = isCurrent ? "#4f46e5" : isDone ? "#a5b4fc" : "#e2e8f0";
                  const dotRing = isCurrent ? "0 0 0 4px #eef2ff" : "none";
                  const lineColor = idx < timeline.length - 1 ? (isDone ? "#c7d2fe" : "#e2e8f0") : "transparent";

                  return (
                    <div
                      key={`${h.key}-${idx}`}
                      className={`order-history-step ${isCurrent ? "is-current" : ""}`}
                      style={{
                        minWidth: 0,
                        position: "relative",
                      }}
                    >
                      <div className="order-history-marker">
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
                        {idx < timeline.length - 1 ? (
                          <div
                            className="order-history-connector"
                            style={{
                              height: 2,
                              width: "100%",
                              borderRadius: 2,
                              background: lineColor,
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="order-history-step-content" style={{ display: "grid", gap: 3 }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                          <div
                            style={{
                              fontWeight: 950,
                              color: isCurrent ? "#0f172a" : isDone ? "#334155" : "#94a3b8",
                              fontSize: 12,
                            }}
                          >
                            {h.label}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: "#94a3b8", fontSize: 11 }}>
                          {h.at ? formatDate(h.at) : isCurrent && order?.updatedAt ? formatDate(order.updatedAt) : ""}
                        </div>
                      </div>
                    </div>
                  );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          <div
            className="order-detail-summary-card"
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>Promo code</span>
                {promoCode ? (
                  <span
                    style={{
                      padding: "4px 9px",
                      borderRadius: 999,
                      background: "#f3efe9",
                      border: "1px dashed #cdbba9",
                      color: "#6c4b32",
                      fontWeight: 950,
                      fontSize: 11,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {promoCode}
                  </span>
                ) : (
                  <span style={{ color: "#94a3b8", fontWeight: 800, fontSize: 12 }}>Not applied</span>
                )}
              </div>
              <div className="order-summary-row" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>Subtotal</span>
                <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 12 }}>{formatAmount(subtotal)}</span>
              </div>
              <div className="order-summary-row" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>Discount</span>
                <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 12 }}>
                  {discount ? `- ${formatAmount(discount)}` : formatAmount(0)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>Delivery Fee</span>
                <span style={{ color: "#0f172a", fontWeight: 950, fontSize: 12 }}>{formatAmount(shippingFee)}</span>
              </div>
              <div className="order-summary-row order-summary-total" style={{ borderTop: "1px solid #eef2f7", paddingTop: 10, display: "flex", justifyContent: "space-between", gap: 10 }}>
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

function AdminOrdersTab({ adminListOrders, adminDeleteOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [adminIdentifier, setAdminIdentifier] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

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
      const orderNumber = `#${String(o?.orderNumber || o?.orderNo || o?._id || "").slice(-8)}`.toLowerCase();
      const uid = String(o?.userId || "").toLowerCase();
      const mail = String(o?.shippingAddress?.name || "").toLowerCase(); // fallback
      return oid.includes(q) || orderNumber.includes(q) || uid.includes(q) || mail.includes(q);
    });
  }, [orders, query]);

  const openOrder = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
    setProductOpen(false);
    setSelectedItem(null);
  };

  const deleteOrder = async (order) => {
    const id = String(order?._id || "");
    if (!id || deletingOrderId) return;
    setDeleteTarget(order);
    setAdminIdentifier("");
    setAdminPassword("");
  };

  const confirmDeleteOrder = async (event) => {
    event.preventDefault();
    const id = String(deleteTarget?._id || "");
    if (!id || deletingOrderId || !adminIdentifier.trim() || !adminPassword) return;
    try {
      setDeletingOrderId(id);
      await adminDeleteOrder(id, { emailOrPhone: adminIdentifier.trim(), password: adminPassword });
      setOrders((prev) => prev.filter((item) => String(item?._id || "") !== id));
      if (selectedOrder && String(selectedOrder?._id || "") === id) {
        setDetailOpen(false);
        setSelectedOrder(null);
      }
      setDeleteTarget(null);
    } catch (e) {
      setError(e?.message || "Failed to delete order");
    } finally {
      setDeletingOrderId(null);
      setAdminPassword("");
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {detailOpen && selectedOrder ? (
        <div className="admin-order-inline-detail">
          <button
            type="button"
            className="admin-order-back-button"
            onClick={() => {
              setDetailOpen(false);
              setSelectedOrder(null);
            }}
          >
            ← Back to orders
          </button>
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
        </div>
      ) : (
        <AdminOrdersList
          query={query}
          onQueryChange={setQuery}
          loading={loading}
          error={error}
          items={filtered}
          onRowClick={openOrder}
          onDeleteOrder={deleteOrder}
          deletingOrderId={deletingOrderId}
        />
      )}

      <Modal
        open={Boolean(deleteTarget)}
        title="Confirm order deletion"
        width="min(420px, calc(100% - 32px))"
        onClose={() => {
          if (!deletingOrderId) setDeleteTarget(null);
        }}
      >
        <form onSubmit={confirmDeleteOrder} style={{ display: "grid", gap: 9 }}>
          <div style={{ color: "#111", fontSize: 12, lineHeight: 1.4 }}>
            This permanently deletes the order. Enter your admin ID and password to continue.
          </div>
          <div style={{ padding: "9px 11px", border: "1px solid #d9d9d9", borderRadius: 9, background: "#fff", color: "#111", fontSize: 12, lineHeight: 1.5 }}>
            <strong>Order total: {formatINR(deleteTarget?.total)}</strong>
            <div>Customer: {deleteTarget?.shippingAddress?.name || deleteTarget?.customerName || "Unavailable"}</div>
          </div>
          <input value={adminIdentifier} onChange={(event) => setAdminIdentifier(event.target.value)} placeholder="Admin email or mobile" autoComplete="username" required style={{ padding: "9px 11px", border: "1px solid #d9d9d9", borderRadius: 9 }} />
          <input value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Admin password" type="password" autoComplete="current-password" required style={{ padding: "9px 11px", border: "1px solid #d9d9d9", borderRadius: 9 }} />
          <button type="submit" disabled={Boolean(deletingOrderId)} style={{ justifySelf: "end", border: "1px solid #d9d9d9", borderRadius: 999, padding: "8px 15px", background: "#fff", color: "#111", fontWeight: 800, cursor: "pointer" }}>
            {deletingOrderId ? "Deleting…" : "Confirm delete"}
          </button>
        </form>
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth || {});

  const user = auth.user;
  const token = auth.token;
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

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
    navigate("/", { replace: true });
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
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
        {mobileNavOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close admin navigation"
            onClick={() => setMobileNavOpen(false)}
          />
        )}
        {/* SIDEBAR */}
        <aside className={`sidebar ${mobileNavOpen ? "is-open" : ""}`}>
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
                  setMobileNavOpen(false);
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
            <div className="topbar-heading">
              <button
                type="button"
                className="mobile-menu-button"
                aria-label="Open admin navigation"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(true)}
              >
                <span />
                <span />
                <span />
              </button>
              <div>
              <div className="topbar-title">{currentLabel}</div>
                <div className="topbar-subtitle">Manage your storefront</div>
              </div>
            </div>
            <div className="topbar-actions">
              <button type="button" className="topbar-profile" onClick={goToProfile}>
                <span className="topbar-profile-avatar">{initials}</span>
                <span className="topbar-profile-name">View store profile</span>
              </button>
            </div>
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
                adminDeleteUser={adminDeleteUser}
                Modal={Modal}
                OrderDetail={OrderDetail}
                ProductDetail={ProductDetail}
                formatDate={formatDate}
                formatINR={formatINR}
              />
            )}

            {activeTab === "orders" && (
              <AdminOrdersTab adminListOrders={adminListOrders} adminDeleteOrder={adminDeleteOrder} />
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
  .main { min-width: 0; }

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
  .topbar-heading { display: flex; align-items: center; gap: 14px; }
  .topbar-subtitle { margin-top: 3px; color: #6b7280; font-size: 12px; }
  .mobile-menu-button {
    display: none; width: 40px; height: 40px; padding: 9px; border: 1px solid #e5e7eb;
    border-radius: 12px; background: #fff; cursor: pointer;
  }
  .mobile-menu-button span { display: block; height: 2px; margin: 4px 0; border-radius: 2px; background: #111827; }
  .topbar-profile {
    display: inline-flex; align-items: center; gap: 8px; border: 1px solid #e5e7eb;
    border-radius: 999px; padding: 5px 10px 5px 5px; background: #fff; color: #374151;
    font: inherit; font-size: 12px; cursor: pointer;
  }
  .topbar-profile:hover { border-color: var(--accent); color: var(--accent); }
  .topbar-profile-avatar { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; font-size: 12px; font-weight: 800; }
  .sidebar-backdrop { display: none; }
  .topbar-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 20px; color: #111827; }
  .topbar-actions { display: flex; gap: 10px; align-items: center; }
  .badge { background: rgba(37,99,235,0.1); color: var(--accent); font-size: 11px; padding: 2px 8px; border-radius: 20px; border: 1px solid rgba(37,99,235,0.25); }

  .content { padding: 32px; }
  .content > * { min-width: 0; max-width: 100%; }
  .content img { max-width: 100%; }
  .content input, .content select, .content textarea, .content button { max-width: 100%; }

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

  /* Orders workspace */
  .admin-orders-page { display: grid; gap: 18px; }
  .admin-orders-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
  .admin-orders-kicker { color: #111; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
  .admin-orders-heading h2 { margin: 5px 0 4px; color: #302820; font-size: 26px; font-weight: 600; letter-spacing: -.03em; }
  .admin-orders-heading p { margin: 0; color: #111; font-size: 13px; }
  .admin-orders-count { padding: 7px 12px; border: 1px solid #d9d9d9; border-radius: 999px; background: #fff; color: #111; font-size: 12px; font-weight: 800; }
  .admin-orders-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: hidden; border: 1px solid #e8dfd7; border-radius: 14px; background: #fff; }
  .admin-orders-metrics div { display: grid; gap: 5px; padding: 15px 18px; border-right: 1px solid #eee7e1; }
  .admin-orders-metrics div:last-child { border-right: 0; }
  .admin-orders-metrics span { color: #111; font-size: 11px; }
  .admin-orders-metrics strong { color: #111; font-size: 22px; font-weight: 600; }
  .admin-orders-toolbar { display: grid; gap: 7px; }
  .admin-orders-toolbar label { color: #111; font-size: 12px; font-weight: 800; }
  .admin-orders-toolbar input { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1px solid #d9d9d9; border-radius: 10px; background: #fff; color: #111; font: inherit; font-size: 13px; outline: none; }
  .admin-orders-toolbar input:focus { border-color: #999; box-shadow: 0 0 0 3px rgba(0,0,0,.06); }
  .admin-orders-table { overflow-x: auto; border: 1px solid #e8dfd7; border-radius: 14px; background: #fff; }
  .admin-orders-table table { min-width: 980px; table-layout: fixed; }
  .admin-orders-table th:nth-child(1), .admin-orders-table td:nth-child(1) { width: 25%; }
  .admin-orders-table th:nth-child(2), .admin-orders-table td:nth-child(2) { width: 24%; }
  .admin-orders-table th:nth-child(3), .admin-orders-table td:nth-child(3) { width: 13%; }
  .admin-orders-table th:nth-child(4), .admin-orders-table td:nth-child(4) { width: 14%; }
  .admin-orders-table th:nth-child(5), .admin-orders-table td:nth-child(5) { width: 14%; }
  .admin-orders-table th:nth-child(6), .admin-orders-table td:nth-child(6) { width: 10%; }
  .admin-orders-table th { padding: 12px 16px; border-bottom: 1px solid #eee7e1; background: #faf7f3; color: #111; font-size: 10px; letter-spacing: .12em; }
  .admin-orders-table td { padding: 15px 18px; border-bottom: 1px solid #f1ebe6; vertical-align: middle; }
  .admin-orders-row { cursor: pointer; transition: background .15s ease; }
  .admin-orders-row:hover td { background: #fdfaf7; }
  .admin-orders-id, .admin-orders-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #111; font-size: 13px; font-weight: 800; }
  .admin-orders-order-id { margin-top: 4px; overflow: hidden; color: #111; font-size: 10px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
  .admin-orders-date, .admin-orders-phone { margin-top: 4px; color: #111; font-size: 11px; }
  .admin-orders-address { max-width: 260px; margin-top: 4px; overflow: hidden; color: #111; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .admin-orders-payment, .admin-orders-status { display: inline-flex; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: capitalize; }
  .admin-orders-payment { background: #eee; color: #111; }
  .admin-orders-payment.is-paid { border-color: #245b38; background: #245b38; color: #fff; }
  .admin-orders-status { background: #fff; border: 1px solid #d9d9d9; color: #111; }
  .admin-orders-total { color: #111; font-size: 14px; font-weight: 800; text-align: left; }
  .admin-orders-delete { border: 1px solid #d9d9d9; border-radius: 999px; padding: 6px 10px; background: #fff; color: #111; font: inherit; font-size: 11px; font-weight: 800; cursor: pointer; }
  .admin-orders-delete:hover { background: #f3f3f3; }
  .admin-orders-delete:disabled { cursor: wait; opacity: .55; }
  .admin-orders-empty { padding: 34px !important; color: #111; font-size: 13px; text-align: center; }
  .admin-orders-error { padding: 12px 16px; border-bottom: 1px solid #d9d9d9; background: #fff; color: #111; font-size: 13px; font-weight: 700; }

  /* Full-page order workspace */
  .order-detail-overlay { align-items: stretch !important; justify-content: stretch !important; padding: 0 !important; background: #f4f1ed !important; }
  .admin-order-inline-detail {
    display: grid;
    gap: 12px;
    width: 100%;
  }
  .admin-order-back-button {
    justify-self: start;
    border: 1px solid #ded5cc;
    border-radius: 999px;
    padding: 8px 13px;
    background: #fff;
    color: #5f5045;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .admin-order-back-button:hover {
    border-color: #9d7957;
    color: #805b3b;
  }
  .modal-full-page {
    width: 100% !important;
    max-width: none !important;
    height: 100vh;
    max-height: none !important;
    padding: 0 !important;
    border-radius: 0 !important;
    display: flex;
    flex-direction: column;
    overflow: hidden !important;
    background: #f8f6f3 !important;
    box-shadow: none !important;
  }
  .modal-full-page .modal-header {
    flex: 0 0 auto;
    min-height: 72px;
    padding: 0 32px;
    border-bottom: 1px solid #e7dfd7;
    background: rgba(255,255,255,.96);
  }
  .modal-full-page .modal-header > div:first-child {
    color: #241d18 !important;
    font-family: 'Syne', sans-serif;
    font-size: 19px !important;
    letter-spacing: -.02em;
  }
  .modal-full-page .modal-header button {
    border: 1px solid #ded5cc !important;
    border-radius: 999px !important;
    padding: 9px 15px !important;
    background: #fff !important;
    color: #5d5148 !important;
    font-size: 12px;
    transition: border-color .2s ease, color .2s ease, transform .2s ease;
  }
  .modal-full-page .modal-header button:hover { border-color: #241d18 !important; color: #241d18 !important; transform: translateX(-2px); }
  .modal-full-page .modal-content {
    flex: 1 1 auto;
    min-height: 0;
    margin-top: 0 !important;
    overflow-y: auto;
    padding: 28px 32px 48px;
  }
  .modal-full-page .modal-content > div {
    max-width: 1420px;
    margin: 0 auto;
    border-radius: 0 !important;
    background: transparent !important;
    padding: 0 !important;
  }
  .modal-full-page .modal-content > div > div:first-child {
    padding: 0 0 22px !important;
    margin-bottom: 22px !important;
    border-bottom: 1px solid #e3dad1;
  }
  .modal-full-page .modal-content .btn {
    border-radius: 999px;
    min-height: 38px;
    padding: 9px 14px;
  }
  .modal-full-page .modal-content [style*="background: #fff"] {
    border-color: #e7dfd7 !important;
    box-shadow: 0 8px 24px rgba(58, 43, 31, .045);
  }
  .modal-full-page .modal-content [style*="background: #f6f7fb"] {
    background: transparent !important;
  }
  .order-detail-view {
    color: #332a24;
    font-family: 'DM Sans', sans-serif;
  }
  .order-detail-view * {
    box-sizing: border-box;
  }
  .order-detail-view [style*="fontWeight: 950"],
  .order-detail-view [style*="fontWeight: 900"],
  .order-detail-view [style*="fontWeight: 800"] {
    font-weight: 600 !important;
  }
  .order-detail-view [style*="color: #0f172a"],
  .order-detail-view [style*="color: #111827"] {
    color: #332a24 !important;
  }
  .order-detail-view [style*="color: #94a3b8"] {
    color: #84766c !important;
  }
  .order-detail-view [style*="color: #64748b"],
  .order-detail-view [style*="color: #334155"] {
    color: #665950 !important;
  }
  .order-detail-view > div:first-child {
    align-items: flex-start !important;
    padding-bottom: 20px !important;
  }
  .order-detail-view > div:first-child > div:first-child {
    display: flex !important;
    align-items: baseline !important;
    gap: 14px !important;
    flex-wrap: wrap;
  }
  .order-detail-heading-meta {
    display: flex !important;
    align-items: baseline !important;
    gap: 14px !important;
    flex-wrap: wrap;
  }
  .order-detail-view > div:first-child > div:first-child > div:first-child {
    font-size: 20px !important;
    font-weight: 650 !important;
    letter-spacing: -.025em;
  }
  .order-detail-view > div:first-child > div:first-child > div:nth-child(2) {
    color: #8b6a4a !important;
    font-size: 11px !important;
    letter-spacing: .08em;
  }
  .order-detail-view > div:first-child > div:first-child > div:nth-child(3) {
    color: #84766c !important;
    font-size: 12px !important;
  }
  .order-detail-heading-meta > div:nth-child(2),
  .order-detail-heading-meta > div:nth-child(3) {
    white-space: nowrap;
  }
  .order-detail-view > div:first-child > div:last-child {
    gap: 6px !important;
  }
  .order-detail-view > div:first-child > div:last-child .btn {
    border-color: #ddd2c8 !important;
    background: #fff !important;
    color: #5f5045 !important;
    font-weight: 600 !important;
  }
  .order-detail-view > div:first-child > div:last-child .btn-danger {
    border-color: #e5c7c0 !important;
    background: #fff8f6 !important;
    color: #a24e40 !important;
  }
  .order-detail-view > div:first-child > div:last-child .btn.is-current-status {
    border-color: #9d7957 !important;
    background: #9d7957 !important;
    color: #fff !important;
    box-shadow: 0 3px 8px rgba(125, 87, 52, .18);
  }
  .order-detail-view > div:first-child > div:last-child {
    gap: 6px !important;
  }
  .order-detail-view > div:first-child > div:last-child .btn,
  .order-detail-view > div:first-child > div:last-child > span {
    height: 30px !important;
    min-height: 30px !important;
    padding: 5px 10px !important;
    border-radius: 999px !important;
    font-size: 11px !important;
    line-height: 1 !important;
    white-space: nowrap;
  }
  .order-detail-view > div:first-child > div:last-child > span {
    display: inline-flex !important;
    align-items: center;
  }
  .order-detail-view > div:first-child > div:last-child > span:last-child {
    border-color: #ded5cc !important;
    background: #fff !important;
    color: #40342c !important;
  }
  .order-detail-view > div:first-child > div:last-child > span:nth-last-child(2) {
    border-color: #245b38 !important;
    background: #245b38 !important;
    color: #fff !important;
  }
  .order-detail-view > div:nth-child(2) {
    gap: 18px !important;
  }
  .order-detail-view > div:nth-child(2) > div:first-child > div:first-child {
    gap: 18px !important;
  }
  .order-detail-view > div:nth-child(2) > div > div,
  .order-detail-view > div:nth-child(2) > div:first-child > div:nth-child(2),
  .order-detail-view > div:nth-child(2) > div:nth-child(2) > div {
    border-color: #e5dbd2 !important;
    border-radius: 10px !important;
    box-shadow: none !important;
  }
  .order-detail-view > div:nth-child(2) > div > div {
    padding: 18px !important;
  }
  .order-detail-view > div:nth-child(2) > div:first-child > div:first-child > div > div:first-child,
  .order-detail-view > div:nth-child(2) > div:nth-child(2) > div > div:first-child {
    font-size: 13px !important;
    font-weight: 650 !important;
    letter-spacing: -.01em;
  }
  .order-detail-view > div:nth-child(2) > div:first-child > div:first-child > div > div:first-child > div:last-child,
  .order-detail-view > div:nth-child(2) > div:nth-child(2) > div > div:first-child > div:last-child {
    display: none !important;
  }
  .order-detail-view button[style*="grid-template-columns: minmax(0, 1.3fr)"] {
    color: #332a24 !important;
    transition: background .15s ease;
  }
  .order-detail-view button[style*="grid-template-columns: minmax(0, 1.3fr)"]:hover {
    background: #fbf7f3 !important;
  }
  .order-detail-view [style*="text-transform: uppercase"] {
    color: #9a887b !important;
    font-size: 10px !important;
    letter-spacing: .08em !important;
  }
  .order-detail-view [style*="background: #f1f5f9"] {
    background: #f7f3ef !important;
  }
  .order-detail-view [style*="background: #eef2ff"] {
    background: #f4ede5 !important;
    border-color: #dfcdbb !important;
    color: #805b3b !important;
  }
  .order-detail-view [style*="background: #dcfce7"] {
    background: #edf7ef !important;
  }
  .order-detail-view [style*="background: #fff7ed"] {
    background: #fff7ef !important;
  }
  .order-detail-view [style*="border-top: 1px solid #eef2f7"] {
    border-color: #e8ded6 !important;
  }
  .order-detail-view {
    font-size: 13px;
    line-height: 1.45;
  }
  .order-detail-view .order-detail-info-grid > div,
  .order-detail-view .order-detail-items-card,
  .order-detail-view .order-detail-history-card,
  .order-detail-view .order-detail-summary-card {
    color: #332a24;
  }
  .order-detail-view .order-detail-info-grid > div > div:first-child,
  .order-detail-view .order-detail-history-card > div:first-child,
  .order-detail-view .order-detail-summary-card > div:first-child {
    color: #3a2d25 !important;
    font-size: 13px !important;
    font-weight: 650 !important;
    line-height: 1.25;
  }
  .order-detail-view .order-detail-info-grid > div > div:first-child > div:first-child,
  .order-detail-view .order-detail-history-card > div:first-child > div:first-child,
  .order-detail-view .order-detail-summary-card > div:first-child {
    color: #3a2d25 !important;
    font-size: 13px !important;
    font-weight: 650 !important;
  }
  .order-detail-view .order-detail-info-grid > div > div:nth-child(2) > div > div:first-child,
  .order-detail-view .order-detail-summary-card > div:nth-child(2) > div > span:first-child {
    color: #3a2d25 !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    letter-spacing: .01em;
  }
  .order-detail-view .order-detail-info-grid > div > div:nth-child(2) > div > div:last-child,
  .order-detail-view .order-detail-summary-card > div:nth-child(2) > div > span:last-child {
    color: #40342c !important;
    font-size: 12px !important;
    font-weight: 600 !important;
  }
  .order-detail-view .order-detail-items-card > div:first-child {
    color: #9a887b !important;
    font-size: 10px !important;
    font-weight: 650 !important;
    letter-spacing: .08em;
  }
  .order-detail-view .order-detail-items-card button > div:first-child > div:last-child > div:first-child {
    color: #40342c !important;
    font-size: 12px !important;
    font-weight: 600 !important;
  }
  .order-detail-view .order-detail-items-card button > div:first-child > div:last-child > div:last-child {
    color: #8b7a6e !important;
    font-size: 11px !important;
    font-weight: 500 !important;
  }
  .order-detail-view .order-detail-items-card button > div:not(:first-child) {
    color: #55473e !important;
    font-size: 12px !important;
    font-weight: 600 !important;
  }
  .order-detail-view .order-detail-history-card > div:nth-child(2) > div > div:last-child {
    color: #8b7a6e !important;
    font-size: 11px !important;
    font-weight: 500 !important;
  }
  .order-detail-view .order-detail-history-card > div:nth-child(2) > div > div:nth-child(2) > div:first-child {
    color: #40342c !important;
    font-size: 12px !important;
    font-weight: 600 !important;
  }
  .order-detail-view .order-detail-summary-card > div:nth-child(2) > div:last-child {
    color: #2f251f !important;
    font-weight: 700 !important;
  }
  .order-detail-view .order-summary-row {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    min-height: 24px;
    gap: 16px !important;
  }
  .order-detail-view .order-summary-row > span:first-child {
    justify-self: start;
    text-align: left;
  }
  .order-detail-view .order-summary-row > span:last-child {
    justify-self: end;
    min-width: 72px;
    text-align: right;
  }
  .order-detail-view .order-summary-row.order-summary-total {
    margin-top: 2px;
    padding-top: 10px !important;
  }
  .delivery-address-heading {
    position: relative;
  }
  .delivery-address-type {
    margin-left: auto;
    padding: 4px 9px;
    border: 1px solid #dfcdbb;
    border-radius: 999px;
    background: #f8f0e8;
    color: #805b3b;
    font-size: 10px;
    font-weight: 650;
    line-height: 1;
    letter-spacing: .04em;
    text-transform: capitalize;
  }
  .order-history-horizontal {
    display: grid;
    grid-template-columns: repeat(5, minmax(96px, 1fr));
    gap: 0;
    min-width: 520px;
    padding: 2px 0 0;
    overflow-x: auto;
  }
  .order-history-step {
    text-align: center;
  }
  .order-history-marker {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 18px;
  }
  .order-history-marker > div:first-child {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
  }
  .order-history-connector {
    position: absolute !important;
    z-index: 0;
    left: 50% !important;
    right: -50% !important;
    width: auto !important;
    top: 8px;
  }
  .order-history-step:last-child .order-history-connector {
    display: none;
  }
  .order-history-step-content {
    justify-items: center;
    margin-top: 4px;
  }
  .order-history-step-content > div:first-child > div:first-child {
    max-width: 112px;
    color: #40342c !important;
    font-size: 11px !important;
    line-height: 1.3;
  }
  .order-detail-history-card {
    padding-top: 11px !important;
    padding-bottom: 10px !important;
  }
  .order-history-step:not(.is-current) .order-history-step-content > div:last-child {
    min-height: 15px;
  }
  .order-history-current {
    position: absolute;
    top: -22px;
    right: 2px;
    padding: 3px 6px !important;
    font-size: 8px !important;
  }
  .order-detail-columns {
    grid-template-columns: minmax(0, 1.55fr) minmax(280px, .75fr) !important;
    align-items: start;
    gap: 14px !important;
  }
  .order-detail-main {
    grid-column: 1;
    grid-row: 2;
  }
  .order-detail-sidebar {
    display: contents !important;
  }
  .order-detail-history-card {
    grid-column: 1 / -1;
    grid-row: 1;
  }
  .order-detail-summary-card {
    grid-column: 2;
    grid-row: 2;
    align-self: start;
  }
  .order-detail-main,
  .order-detail-sidebar {
    gap: 14px !important;
  }
  .order-detail-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 14px !important;
  }
  .order-detail-info-grid > div,
  .order-detail-items-card,
  .order-detail-history-card,
  .order-detail-summary-card {
    padding: 14px !important;
  }
  .order-detail-info-grid > div > div:nth-child(2),
  .order-detail-history-card > div:nth-child(2),
  .order-detail-summary-card > div:nth-child(2) {
    margin-top: 9px !important;
    gap: 7px !important;
  }
  .order-detail-info-grid > div > div:nth-child(2) > div {
    grid-template-columns: 112px minmax(0, 1fr) !important;
    gap: 7px !important;
    line-height: 1.35;
  }
  .order-detail-info-grid > div > div:first-child {
    min-height: 0 !important;
  }
  .order-detail-items-card > div:first-child {
    padding: 0 0 10px !important;
  }
  .order-detail-items-card button {
    padding: 9px 0 !important;
  }
  .order-detail-history-card > div:nth-child(2) {
    gap: 4px !important;
  }
  .order-detail-summary-card > div:nth-child(2) {
    gap: 8px !important;
  }
  .order-detail-summary-card > div:nth-child(2) > div {
    min-height: 0 !important;
  }
  .order-detail-view [style*="minHeight: 220"] {
    min-height: 0 !important;
  }

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
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: min(300px, 86vw);
      min-height: 100vh;
      padding: 20px 0;
      transform: translateX(-105%);
      transition: transform .25s ease;
      box-shadow: 18px 0 45px rgba(15, 23, 42, .14);
      z-index: 120;
    }
    .sidebar.is-open {
      transform: translateX(0);
    }
    .sidebar-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 110;
      border: 0;
      background: rgba(15, 23, 42, .42);
      backdrop-filter: blur(2px);
    }
    .sidebar-logo {
      padding: 0 22px 24px;
    }
    .sidebar-nav {
      display: block;
      overflow-y: auto;
    }
    .nav-section {
      display: block;
    }
    .nav-item {
      padding: 12px 22px;
      font-size: 13px;
    }
    .sidebar-footer {
      padding: 16px 22px;
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
    .mobile-menu-button { display: block; }
    .slides-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    table {
      font-size: 12px;
    }
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
    .content {
      padding: 12px;
      overflow-x: hidden;
    }
    .content [style*="grid-template-columns"] {
      grid-template-columns: minmax(0, 1fr) !important;
    }
    .content [style*="min-width"] {
      min-width: 0 !important;
    }
    .content [style*="white-space"] {
      white-space: normal !important;
    }
    .content .table-wrap,
    .content .admin-orders-table {
      max-width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .content .table-wrap table,
    .content .admin-orders-table table {
      min-width: 640px;
    }
    .modal-overlay {
      align-items: flex-start;
      padding: 10px;
      overflow-y: auto;
    }
    .modal {
      width: 100% !important;
      max-width: 100% !important;
      max-height: calc(100vh - 20px) !important;
      overflow-x: hidden;
    }
    .order-detail-overlay {
      padding: 0 !important;
    }
    .modal-full-page {
      width: 100% !important;
      max-width: 100% !important;
      height: 100vh;
      max-height: none !important;
    }
    .modal-full-page .modal-header {
      min-height: 62px;
      padding: 0 14px;
    }
    .modal-full-page .modal-header > div:first-child {
      font-size: 16px !important;
    }
    .modal-full-page .modal-header button {
      padding: 8px 11px !important;
      font-size: 11px;
    }
    .modal-full-page .modal-content {
      padding: 20px 14px 32px;
    }
    .order-detail-view > div:first-child {
      display: grid !important;
      gap: 12px !important;
      min-width: 0;
      overflow: hidden;
      padding: 0 0 14px !important;
    }
    .order-detail-view > div:first-child > div:first-child {
      display: flex !important;
      width: 100%;
      min-width: 0;
      gap: 7px !important;
      align-items: baseline !important;
      flex-wrap: wrap;
    }
    .order-detail-view > div:first-child > div:first-child > div:first-child {
      width: 100%;
      font-size: 17px !important;
      line-height: 1.2;
    }
    .order-detail-view .order-detail-heading-meta {
      display: flex !important;
      align-items: baseline !important;
      gap: 7px !important;
      width: 100%;
      flex-wrap: wrap;
    }
    .order-detail-view > div:first-child > div:last-child {
      width: 100%;
      justify-content: flex-start !important;
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px !important;
      min-width: 0;
    }
    .order-detail-view > div:first-child > div:last-child .btn,
    .order-detail-view > div:first-child > div:last-child > span {
      width: 100%;
      min-width: 0;
      justify-content: center;
      padding-left: 6px !important;
      padding-right: 6px !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .order-detail-view > div:first-child > div:last-child > span:nth-last-child(2) {
      grid-column: span 1;
    }
    .order-detail-columns {
      grid-template-columns: minmax(0, 1fr) !important;
    }
    .order-detail-main {
      grid-column: 1;
      grid-row: 2;
    }
    .order-detail-history-card {
      grid-column: 1;
      grid-row: 1;
    }
    .order-detail-summary-card {
      grid-column: 1;
      grid-row: 3;
    }
    .order-detail-info-grid {
      grid-template-columns: minmax(0, 1fr) !important;
    }
    .order-detail-info-grid > div > div:nth-child(2) > div {
      grid-template-columns: 105px minmax(0, 1fr) !important;
      min-width: 0;
    }
    .order-detail-info-grid > div > div:nth-child(2) > div > div:last-child {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .order-detail-items-card {
      min-width: 0;
      width: 100%;
      overflow: hidden;
    }
    .order-detail-items-card > div:first-child {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) 32px 48px 58px !important;
      min-width: 0 !important;
      gap: 5px !important;
      padding: 0 0 8px !important;
      font-size: 9px !important;
    }
    .order-detail-items-card > div:nth-child(2) {
      min-width: 0 !important;
      width: 100%;
    }
    .order-detail-items-card button {
      width: 100%;
      min-width: 0 !important;
      grid-template-columns: minmax(0, 1fr) 32px 48px 58px !important;
      gap: 5px !important;
      padding: 8px 0 !important;
    }
    .order-detail-items-card button > div:first-child {
      min-width: 0;
    }
    .order-detail-items-card button > div:first-child > div:last-child {
      min-width: 0;
    }
    .order-detail-items-card button > div:first-child > div:last-child > div:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 10px !important;
    }
    .order-detail-items-card button > div:first-child > div:last-child > div:last-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 9px !important;
    }
    .order-detail-items-card button > div:not(:first-child) {
      font-size: 10px !important;
    }
    .order-detail-history-card {
      padding: 10px !important;
    }
    .order-detail-history-card > div:nth-child(2) {
      margin-top: 8px !important;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .order-history-horizontal {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      min-width: 0;
      width: 100%;
      overflow: visible;
      padding: 0;
    }
    .order-history-step-content {
      margin-top: 4px;
      min-width: 0;
    }
    .order-history-step-content > div:first-child > div:first-child {
      max-width: 100%;
      min-width: 0;
      overflow-wrap: anywhere;
      font-size: 9px !important;
      line-height: 1.2;
    }
    .order-history-step-content > div:last-child {
      max-width: 100%;
      overflow-wrap: anywhere;
      font-size: 8px !important;
      line-height: 1.2;
    }
    .order-history-marker {
      height: 14px;
    }
    .order-history-connector {
      top: 6px;
    }
    .order-detail-history-card,
    .order-detail-summary-card {
      min-width: 0;
      overflow: hidden;
    }
    .order-history-horizontal {
      max-width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 3px;
    }
    .order-detail-summary-card .order-summary-row {
      grid-template-columns: minmax(0, 1fr) minmax(72px, auto) !important;
      gap: 8px !important;
    }
    .content [role="status"] {
      right: 10px !important;
      left: 10px !important;
      min-width: 0 !important;
      max-width: none !important;
    }
    .topbar-title { font-size: 17px; }
    .topbar-subtitle { font-size: 11px; }
    .topbar-profile-name { display: none; }
    .topbar-profile { padding: 4px; }
    .topbar-profile-avatar { width: 30px; height: 30px; }
    .admin-orders-heading { align-items: flex-start; flex-direction: column; }
    .admin-orders-metrics div { padding: 13px 12px; }
    .admin-orders-metrics span { font-size: 10px; }
    .admin-orders-metrics strong { font-size: 19px; }

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
