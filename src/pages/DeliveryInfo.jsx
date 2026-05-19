import React from "react";
import { Link } from "react-router-dom";

export default function DeliveryInfo() {
  return (
    <main id="MainContent" role="main">
      <div className="shopify-section" id="shopify-section-template--static-delivery__main">
        <div className="m-page-header m-page-header--large m:text-center m-scroll-trigger animate--fade-in-up">
          <div className="container-fluid">
            <h1 className="m-page-header__title">Order Fulfillment &amp; Return Terms</h1>
          </div>
          <nav aria-label="breadcrumbs" className="m-breadcrumb m:w-full" role="navigation">
            <div className="container-fluid">
              <div className="m-breadcrumb--wrapper m:flex m:items-center m:justify-center">
                <Link className="m-breadcrumb--item" to="/" title="Back to the home page">
                  Home
                </Link>
                <span aria-hidden="true" className="m-breadcrumb--separator">
                  <svg
                    className="m-svg-icon--small m-rlt-reverse-x"
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 256 512"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
                  </svg>
                </span>
                <span className="m-breadcrumb--item-current m-breadcrumb--item">
                  Order Fulfillment &amp; Return Terms
                </span>
              </div>
            </div>
          </nav>
        </div>

        <div className="container">
          <div className="m-login-form" style={{ maxWidth: 980, margin: "0 auto 48px" }}>
            <h2 style={{ marginBottom: 10 }}>Shipping Policy</h2>
            <p style={{ color: "#555", lineHeight: 1.8 }}>
              We strive to deliver your favorite outfits to you as quickly and safely as possible. Please go through our
              shipping timelines:
            </p>
            <ul style={{ margin: "0 0 18px 18px", color: "#555", lineHeight: 1.8 }}>
              <li>
                <strong>Dispatch Timeline:</strong> All orders are processed and dispatched within 2-3 business days after
                order confirmation.
              </li>
              <li>
                <strong>Delivery Timeline:</strong> Once dispatched, your package will reach you within 7-10 business days
                across India.
              </li>
            </ul>

            <h2 style={{ marginBottom: 10 }}>Returns, Exchanges &amp; Claims</h2>
            <p style={{ color: "#555", lineHeight: 1.8 }}>
              Thank you for shopping with us! Please note our policy regarding returns and damages to ensure a smooth
              experience:
            </p>
            <ol style={{ margin: "0 0 18px 18px", color: "#555", lineHeight: 1.8 }}>
              <li style={{ marginBottom: 12 }}>
                <strong>No Return Policy</strong>
                <div>
                  We follow a Strict No-Return and No-Exchange Policy. We request you to check the product descriptions and
                  size guides carefully before placing an order.
                </div>
              </li>
              <li style={{ marginBottom: 12 }}>
                <strong>Mandatory Unboxing Video for Claims</strong>
                <div style={{ marginTop: 6 }}>
                  We take great care in packaging your orders. However, in the rare event of a manufacturing defect or damage
                  during transit, a claim can ONLY be processed if you provide a 360-degree unboxing video.
                </div>

                <div style={{ marginTop: 10, fontWeight: 700, color: "#111" }}>
                  Video Requirements (Strictly Follow):
                </div>
                <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.8 }}>
                  <li>
                    <strong>No Cuts, No Edits:</strong> The video must be a single, continuous shot from start to finish.
                  </li>
                  <li>
                    <strong>Start to Finish:</strong> The video must start from the moment you receive the parcel from the
                    delivery partner.
                  </li>
                  <li>
                    <strong>Clear View:</strong> Show the uncut original packaging/label, the process of opening the package,
                    taking out the suit, and highlighting the specific defect.
                  </li>
                  <li>
                    <strong>Timeline:</strong> The video must be sent to us on WhatsApp within 24 hours of delivery.
                  </li>
                </ul>

                <div style={{ marginTop: 10, padding: "10px 12px", border: "1px solid #eee", borderRadius: 8 }}>
                  <strong>Note:</strong> If the video has any cuts, edits, or if the package was already opened before
                  starting the video, the claim will be immediately rejected.
                </div>
              </li>
            </ol>

            <h3 style={{ marginBottom: 8 }}>How to Report a Defect?</h3>
            <p style={{ color: "#555", lineHeight: 1.8, margin: 0 }}>
              If you meet the above criteria, please WhatsApp us your order number and the unboxing video. Our team will
              review it and get back to you within 48 hours.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

