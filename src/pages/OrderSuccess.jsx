import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  readStashedPurchaseMeta,
  trackPurchaseOnOrderSuccess,
} from "../utils/metaPixel";

export default function OrderSuccess() {
  const location = useLocation();
  const purchaseTrackedRef = useRef(false);
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  useEffect(() => {
    if (purchaseTrackedRef.current || !orderId) return;
    purchaseTrackedRef.current = true;

    const fromState = location.state?.purchaseMeta;
    const fromStorage = readStashedPurchaseMeta(orderId);
    const orderIdStr = String(orderId);
    const purchaseMeta =
      fromState?.orderId === orderIdStr
        ? fromState
        : fromStorage?.orderId === orderIdStr
          ? fromStorage
          : null;

    if (!purchaseMeta?.orderId) return;

    trackPurchaseOnOrderSuccess(purchaseMeta);
  }, [orderId, location.state]);

  return (
    <main style={{ background: "#fff", padding: "44px 16px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", border: "1px solid #e5e7eb", borderRadius: 14, padding: 22, background: "#fafafa" }}>
        <h1 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 900, color: "#0f172a" }}>
          Order placed successfully
        </h1>
        {orderId ? (
          <div style={{ fontSize: 14, color: "#334155", marginBottom: 14 }}>
            Order ID: <strong>{orderId}</strong>
          </div>
        ) : null}
        <p style={{ margin: "0 0 18px", color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
          Your order is created.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/" style={btnStyle}>
            Continue shopping
          </Link>
          <Link to="/orders" style={{ ...btnStyle, background: "#111", color: "#fff" }}>
            View orders
          </Link>
          <Link to="/cart" style={{ ...btnStyle, background: "#fff", color: "#111", border: "1px solid #111" }}>
            View cart
          </Link>
        </div>
      </div>
    </main>
  );
}

const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: 10,
  background: "#111",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
};

