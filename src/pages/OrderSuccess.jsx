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
  const orderNumber = orderId ? String(orderId).replace(/^#/, "").slice(-8) : "";

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
    <main className="order-success-page">
      <section className="order-success-card" aria-labelledby="order-success-title">
        <div className="order-success-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation">
            <path d="m5 12.5 4.2 4.2L19.5 6.5" />
          </svg>
        </div>
        <p className="order-success-kicker">SMAL COUTURE</p>
        <h1 id="order-success-title">Thank you for your order</h1>
        <p className="order-success-message">
          Your order has been placed successfully. We will keep you updated as it moves
          towards you.
        </p>

        {orderId ? (
          <div className="order-success-number">
            <span>ORDER NUMBER</span>
            <strong>#{orderNumber}</strong>
          </div>
        ) : null}

        <div className="order-success-steps" aria-label="Order progress">
          <div className="order-success-step is-active">
            <span>1</span>
            <strong>Placed</strong>
          </div>
          <i aria-hidden="true" />
          <div className="order-success-step">
            <span>2</span>
            <strong>Confirmed</strong>
          </div>
          <i aria-hidden="true" />
          <div className="order-success-step">
            <span>3</span>
            <strong>Delivered</strong>
          </div>
        </div>

        <div className="order-success-actions">
          <Link to="/orders" className="order-success-primary">View my orders</Link>
          <Link to="/" className="order-success-secondary">Continue shopping</Link>
        </div>
      </section>
    </main>
  );
}

const styles = `
  .order-success-page {
    min-height: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 34px 16px 58px;
    background: #fbfaf8;
  }
  .order-success-card {
    width: min(100%, 510px);
    box-sizing: border-box;
    padding: 34px 38px 30px;
    text-align: center;
    background: #fff;
    border: 1px solid #e5ddd3;
    border-radius: 4px;
    box-shadow: 0 16px 45px rgba(70, 48, 30, .08);
  }
  .order-success-mark {
    width: 52px;
    height: 52px;
    margin: 0 auto 17px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #5d432f;
    color: #fff;
  }
  .order-success-mark svg {
    width: 27px;
    height: 27px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .order-success-kicker {
    margin: 0 0 8px;
    color: #aa8354;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2.2px;
  }
  .order-success-card h1 {
    margin: 0;
    color: #35271e;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(25px, 4vw, 32px);
    font-weight: 500;
    line-height: 1.15;
  }
  .order-success-message {
    max-width: 370px;
    margin: 12px auto 20px;
    color: #76695e;
    font-size: 13px;
    line-height: 1.6;
  }
  .order-success-number {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 24px;
    padding: 12px 14px;
    text-align: left;
    background: #f8f4ef;
    border: 1px solid #eee4d9;
  }
  .order-success-number span {
    color: #9b8979;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.4px;
  }
  .order-success-number strong {
    color: #4d3828;
    font-size: 13px;
    letter-spacing: .5px;
  }
  .order-success-steps {
    display: flex;
    align-items: flex-start;
    margin: 0 0 27px;
  }
  .order-success-step {
    display: flex;
    min-width: 70px;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    color: #b8aaa0;
    font-size: 10px;
  }
  .order-success-step span {
    width: 23px;
    height: 23px;
    display: grid;
    place-items: center;
    border: 1px solid #d8cdc2;
    border-radius: 50%;
    font-size: 10px;
  }
  .order-success-step.is-active {
    color: #5d432f;
  }
  .order-success-step.is-active span {
    color: #fff;
    background: #5d432f;
    border-color: #5d432f;
  }
  .order-success-step strong {
    font-weight: 700;
  }
  .order-success-steps i {
    height: 1px;
    flex: 1;
    margin: 12px 5px 0;
    background: #e1d8cf;
  }
  .order-success-actions {
    display: flex;
    gap: 9px;
  }
  .order-success-actions a {
    flex: 1;
    padding: 12px 10px;
    border-radius: 2px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .3px;
    text-decoration: none;
    transition: opacity .2s ease, transform .2s ease;
  }
  .order-success-actions a:hover {
    opacity: .85;
    transform: translateY(-1px);
  }
  .order-success-primary {
    color: #fff;
    background: #5d432f;
  }
  .order-success-secondary {
    color: #5d432f;
    background: #fff;
    border: 1px solid #bda991;
  }
  @media (max-width: 480px) {
    .order-success-page { min-height: 420px; padding: 22px 12px 40px; }
    .order-success-card { padding: 28px 19px 23px; }
    .order-success-message { margin-bottom: 17px; }
    .order-success-actions { flex-direction: column; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("order-success-styles")) {
  const style = document.createElement("style");
  style.id = "order-success-styles";
  style.textContent = styles;
  document.head.appendChild(style);
}
