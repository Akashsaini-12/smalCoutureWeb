import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listOrders } from "../redux/actions";
import { getUserId } from "../utils/userId";
import { formatSizeForCustomerDisplay } from "../utils/internalFreeSize";

const statusLabels = {
  created: "Order placed",
  confirmed: "Confirmed",
  processing: "Preparing",
  dispatched: "Dispatched",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const normalizeStatus = (status) => String(status || "created").toLowerCase();

function formatINR(value) {
  const amount = Number(value || 0);
  return `₹${Number.isFinite(amount) ? amount.toFixed(0) : "0"}`;
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getOrderTotal(order) {
  const storedTotal = Number(order?.total);
  if (Number.isFinite(storedTotal)) return storedTotal;
  const itemsTotal = (Array.isArray(order?.items) ? order.items : []).reduce(
    (sum, item) => sum + (Number(item?.price || 0) * Number(item?.quantity || 1)),
    0,
  );
  return Math.max(
    0,
    itemsTotal + Number(order?.shippingFee ?? order?.shipping ?? 0) +
      Number(order?.tax ?? 0) - Number(order?.discount ?? order?.couponDiscount ?? 0),
  );
}

function statusClass(status) {
  const key = normalizeStatus(status);
  if (key === "delivered") return "is-delivered";
  if (key === "cancelled") return "is-cancelled";
  if (key === "shipped" || key === "dispatched") return "is-shipped";
  return "is-active";
}

export default function Orders() {
  const userId = getUserId();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = () => {
    setLoading(true);
    setError("");
    listOrders({ userId })
      .then((response) => setOrders(Array.isArray(response?.items) ? response.items : []))
      .catch((loadError) => setError(loadError?.message || "We could not load your orders."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const counts = useMemo(() => ({
    all: orders.length,
    active: orders.filter((order) => !["delivered", "cancelled"].includes(normalizeStatus(order.status))).length,
    delivered: orders.filter((order) => normalizeStatus(order.status) === "delivered").length,
    cancelled: orders.filter((order) => normalizeStatus(order.status) === "cancelled").length,
  }), [orders]);

  const visibleOrders = useMemo(
    () => orders.filter((order) => {
      const status = normalizeStatus(order.status);
      if (filter === "active") return !["delivered", "cancelled"].includes(status);
      return filter === "all" || status === filter;
    }),
    [filter, orders],
  );

  return (
    <main className="orders-page">
      <section className="orders-hero">
        <div className="orders-shell">
          <div className="orders-hero__copy">
            <h1>Order history</h1>
            <p>Keep track of your SMALCOUTURE pieces, from our studio to your doorstep.</p>
          </div>
          <div className="orders-hero__actions">
            <Link to="/AllProducts" className="orders-button orders-button--primary">Continue shopping</Link>
            <a
              href="#get-in-touch"
              className="orders-button orders-button--light"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById("get-in-touch")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              Contact support
            </a>
          </div>
        </div>
      </section>

      <div className="orders-shell orders-content">
        <div className="orders-toolbar">
          <div>
            <h2>Your orders</h2>
            {loading && <p>Loading your order history...</p>}
          </div>
          <button type="button" className="orders-refresh" onClick={loadOrders} disabled={loading}>Refresh</button>
        </div>

        <nav className="orders-filters" aria-label="Filter orders">
          {[
            ["all", "All orders"],
            ["active", "In progress"],
            ["delivered", "Delivered"],
            ["cancelled", "Cancelled"],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={filter === key ? "is-selected" : ""}
              onClick={() => setFilter(key)}
            >
              {label}<span>{counts[key]}</span>
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="orders-state"><span className="orders-spinner" />Loading your orders...</div>
        ) : error ? (
          <div className="orders-state orders-state--error">
            <strong>Something went wrong</strong>
            <span>{error}</span>
            <button type="button" className="orders-button orders-button--primary" onClick={loadOrders}>Try again</button>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-state">
            <span className="orders-empty-icon">♡</span>
            <strong>{filter === "all" ? "No orders yet" : "No orders in this category"}</strong>
            <span>{filter === "all" ? "Your future favourites will appear here." : "Try another filter to view your order history."}</span>
            {filter === "all" && <Link to="/AllProducts" className="orders-button orders-button--primary">Start shopping</Link>}
          </div>
        ) : (
          <div className="orders-list">
            {visibleOrders.map((order) => (
              <OrderCard key={order._id} order={order} onOpen={() => setSelectedOrder(order)} />
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </main>
  );
}

function OrderCard({ order, onOpen }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const status = normalizeStatus(order.status);
  const preview = items.slice(0, 3);
  const itemCount = items.reduce((sum, item) => sum + Number(item?.quantity || 1), 0);

  return (
    <button type="button" className="order-card" onClick={onOpen}>
      <div className="order-card__top">
        <div>
          <span className="order-card__label">Order #{String(order.orderNumber || order.orderNo || order._id || "").slice(-8)}</span>
          <span className="order-card__date">Placed {formatDate(order.createdAt)}</span>
        </div>
        <span className={`order-status ${statusClass(status)}`}>{statusLabels[status] || status.replace(/_/g, " ")}</span>
      </div>
      <div className="order-card__body">
        <div className="order-card__products">
          {preview.map((item, index) => (
            <div className="order-product" key={item.cartItemId || `${item.productId}-${index}`}>
              <div className="order-product__image">
                {item.image ? <img src={item.image} alt="" /> : <span>SM</span>}
              </div>
              <div>
                <strong>{item.name || item.title || "Product"}</strong>
                <span>Qty {item.quantity || 1}{item.size ? ` · ${formatSizeForCustomerDisplay(item.size)}` : ""}</span>
              </div>
            </div>
          ))}
          {items.length > 3 && <span className="order-more">+{items.length - 3} more</span>}
        </div>
        <div className="order-card__total">
          <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
          <strong>{formatINR(getOrderTotal(order))}</strong>
          <span className="order-card__view">View details →</span>
        </div>
      </div>
    </button>
  );
}

function OrderDetails({ order, onClose }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.shippingAddress || order.address || {};
  const status = normalizeStatus(order.status);

  return (
    <div className="orders-modal" role="presentation" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="orders-modal__panel" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
        <header className="orders-modal__header">
          <div>
            <span className="orders-eyebrow">Order details</span>
            <h2 id="order-detail-title">#{String(order.orderNumber || order.orderNo || order._id || "").slice(-8)}</h2>
            <p>Placed on {formatDate(order.createdAt)}</p>
          </div>
          <button type="button" className="orders-modal__close" onClick={onClose} aria-label="Close order details">×</button>
        </header>
        <div className="orders-modal__status">
          <span className={`order-status ${statusClass(status)}`}>{statusLabels[status] || status}</span>
          <span>{order.paymentStatus === "paid" ? "Payment received" : `Payment: ${order.paymentStatus || "pending"}`}</span>
        </div>
        <div className="orders-modal__items">
          {items.length ? items.map((item, index) => (
            <div className="orders-modal__item" key={item.cartItemId || `${item.productId}-${index}`}>
              <div className="order-product__image">
                {item.image ? <img src={item.image} alt="" /> : <span>SM</span>}
              </div>
              <div className="orders-modal__item-copy">
                <strong>{item.name || item.title || "Product"}</strong>
                <span>Qty {item.quantity || 1}{item.color ? ` · ${item.color}` : ""}{item.size ? ` · ${formatSizeForCustomerDisplay(item.size)}` : ""}</span>
              </div>
              <strong>{formatINR(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
            </div>
          )) : <p>No items found for this order.</p>}
        </div>
        <div className="orders-modal__footer">
          <div><span>Shipping address</span><strong>{address.name || address.fullName || "Address not available"}</strong><p>{[address.address1, address.city, address.state, address.pincode].filter(Boolean).join(", ")}</p></div>
          <div className="orders-modal__amount"><span>Total paid</span><strong>{formatINR(getOrderTotal(order))}</strong></div>
        </div>
      </section>
    </div>
  );
}
