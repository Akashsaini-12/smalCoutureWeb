import React from "react";

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

function getProductSummary(order) {
  const names = (Array.isArray(order?.items) ? order.items : [])
    .map((item) => String(item?.name || item?.title || "").trim())
    .filter(Boolean);
  if (!names.length) return "Products unavailable";
  const shortNames = names.slice(0, 2).map((name) => (
    name.length > 24 ? `${name.slice(0, 24).trimEnd()}…` : name
  ));
  return names.length > 2
    ? `${shortNames.join(", ")} +${names.length - 2} more`
    : shortNames.join(", ");
}

export default function AdminOrdersList({
  query,
  onQueryChange,
  loading,
  error,
  items,
  onRowClick,
  onDeleteOrder,
  deletingOrderId,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const activeCount = safeItems.filter((order) => !["delivered", "cancelled"].includes(String(order?.status || "created").toLowerCase())).length;
  const deliveredCount = safeItems.filter((order) => String(order?.status || "").toLowerCase() === "delivered").length;

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-heading">
        <div>
          <div className="admin-orders-kicker">Commerce overview</div>
          <h2>Orders</h2>
          <p>Review recent purchases and update their fulfilment status.</p>
        </div>
        <div className="admin-orders-count">{safeItems.length} total</div>
      </div>

      <div className="admin-orders-metrics">
        <div><span>Total orders</span><strong>{safeItems.length}</strong></div>
        <div><span>In progress</span><strong>{activeCount}</strong></div>
        <div><span>Delivered</span><strong>{deliveredCount}</strong></div>
      </div>

      <div className="admin-orders-toolbar">
        <div>
          <input
            id="admin-orders-search"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search by order ID, user ID or customer"
          />
        </div>
      </div>

      <div className="admin-orders-table">
        {error ? (
          <div className="admin-orders-error">{error}</div>
        ) : null}

        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Order</th>
              <th>Payment</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="admin-orders-empty">
                  Loading orders…
                </td>
              </tr>
            ) : !safeItems.length ? (
              <tr>
                <td colSpan={6} className="admin-orders-empty">
                  No orders found.
                </td>
              </tr>
            ) : (
              safeItems.map((o, idx) => {
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
                return (
                <tr
                  key={String(o?._id || idx)}
                  onClick={() => onRowClick?.(o)}
                  className="admin-orders-row"
                >
                  <td className="admin-orders-customer">
                    <div className="admin-orders-name">
                      {name}
                    </div>
                    <div className="admin-orders-phone">
                      {phone}
                    </div>
                    <div className="admin-orders-address">
                      {addressLine || "Address: -"}
                    </div>
                  </td>
                  <td>
                    <div className="admin-orders-id" title={getProductSummary(o)}>
                      {getProductSummary(o)}
                    </div>
                    <div className="admin-orders-order-id">
                      Order ID: #{String(o?.orderNumber || o?.orderNo || o?._id || "-").slice(-8)}
                    </div>
                    <div className="admin-orders-date">
                      Placed: {formatDate(o?.createdAt)}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-orders-payment ${String(o?.paymentStatus || "pending").toLowerCase() === "paid" ? "is-paid" : ""}`}>
                      {String(o?.paymentStatus || "pending").toLowerCase() === "paid"
                        ? "PAID"
                        : String(o?.paymentStatus || "pending").toLowerCase() === "cod"
                          ? "CASH"
                          : String(o?.paymentStatus || "pending")}
                    </span>
                  </td>
                  <td className="admin-orders-total">
                    {formatINR(o?.total)}
                  </td>
                  <td>
                    <span className="admin-orders-status">{String(o?.status || "created").replace(/_/g, " ")}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-orders-delete"
                      disabled={deletingOrderId === String(o?._id || "")}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteOrder?.(o);
                      }}
                    >
                      {deletingOrderId === String(o?._id || "") ? "Deleting…" : "Delete"}
                    </button>
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
