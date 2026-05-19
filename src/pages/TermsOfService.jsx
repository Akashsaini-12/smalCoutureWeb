import React from "react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <main id="MainContent" role="main">
      <div className="shopify-section" id="shopify-section-template--static-terms__main">
        <div className="m-page-header m-page-header--large m:text-center m-scroll-trigger animate--fade-in-up">
          <div className="container-fluid">
            <h1 className="m-page-header__title">Terms and Conditions</h1>
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
                  Terms &amp; Conditions
                </span>
              </div>
            </div>
          </nav>
        </div>

        <div className="container">
          <div className="m-login-form" style={{ maxWidth: 980, margin: "0 auto 48px" }}>
            <h3 style={{ marginBottom: 10 }}>Welcome to our website</h3>
            <p style={{ color: "#555", lineHeight: 1.8 }}>
              By browsing and using this website, you are agreeing to comply with and be bound by the following
              terms and conditions of use.
            </p>

            <div style={{ height: 12 }} />
            <div style={{ display: "grid", gap: 12, color: "#555", lineHeight: 1.8 }}>
              <div>
                <strong style={{ color: "#111827" }}>1. General Overview</strong>
                <div>
                  This website is operated by our team. Throughout the site, the terms “we”, “us” and “our” refer to
                  our brand. By purchasing something from us, you engage in our “Service” and agree to be bound by
                  the terms mentioned here.
                </div>
              </div>

              <div>
                <strong style={{ color: "#111827" }}>2. Product Information &amp; Accuracy</strong>
                <div>
                  We make every effort to display the colors and textures of our fabrics as accurately as possible.
                  However, due to photographic lighting and different screen resolutions, a 5–10% color variation may
                  occur. Please read the product description carefully before placing an order.
                </div>
              </div>

              <div>
                <strong style={{ color: "#111827" }}>3. Pricing and Payments</strong>
                <div>
                  Prices for our products are subject to change without notice. We reserve the right to cancel any
                  order in case of a pricing error. All payments must be made through the provided secure payment
                  gateways. Orders will only be processed once the payment is confirmed.
                </div>
              </div>

              <div>
                <strong style={{ color: "#111827" }}>4. Shipping and Delivery</strong>
                <div>
                  As per our policy, orders are dispatched within 2–3 business days. Delivery across India usually
                  takes 7–10 business days. We are not responsible for delays caused by courier partners or unforeseen
                  circumstances (weather, strikes, etc.).
                </div>
              </div>

              <div>
                <strong style={{ color: "#111827" }}>5. Cancellation and Modifications</strong>
                <div>
                  Once an order is placed and payment is made, it cannot be cancelled or modified. Please ensure your
                  shipping address and contact details are 100% correct before finalizing the order.
                </div>
              </div>

              <div>
                <strong style={{ color: "#111827" }}>6. Returns and Claims (Strict Policy)</strong>
                <div>
                  We follow a Strict No-Return and No-Exchange Policy. Any claim regarding damages or missing items
                  will only be entertained if accompanied by a 360-degree unboxing video (No cuts, no edits) sent
                  within 24 hours of delivery via WhatsApp.
                </div>
              </div>

              <div>
                <strong style={{ color: "#111827" }}>7. Personal Information</strong>
                <div>
                  Your submission of personal information through the store is governed by our Privacy Policy. We
                  ensure your data is used only for order processing and communication.
                </div>
              </div>
            </div>

            <div style={{ height: 18 }} />
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", marginTop: 18, paddingTop: 18 }}>
              <h3 style={{ marginBottom: 10 }}>Order Fulfillment &amp; Return Terms</h3>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 900, color: "#111827", marginBottom: 6 }}>Shipping Policy</div>
                  <div style={{ color: "#555", lineHeight: 1.8 }}>
                    We strive to deliver your favorite outfits to you as quickly and safely as possible. Please go
                    through our shipping timelines:
                    <ul style={{ margin: "10px 0 0 18px" }}>
                      <li>
                        <strong>Dispatch Timeline:</strong> All orders are processed and dispatched within 2–3 business
                        days after order confirmation.
                      </li>
                      <li>
                        <strong>Delivery Timeline:</strong> Once dispatched, your package will reach you within 7–10
                        business days across India.
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 900, color: "#111827", marginBottom: 6 }}>
                    Returns, Exchanges &amp; Claims
                  </div>
                  <div style={{ color: "#555", lineHeight: 1.8 }}>
                    Thank you for shopping with us! Please note our policy regarding returns and damages to ensure a
                    smooth experience:
                    <ol style={{ margin: "10px 0 0 18px" }}>
                      <li style={{ marginBottom: 10 }}>
                        <strong>No Return Policy</strong>
                        <div>
                          We follow a Strict No-Return and No-Exchange Policy. We request you to check the product
                          descriptions and size guides carefully before placing an order.
                        </div>
                      </li>
                      <li>
                        <strong>Mandatory Unboxing Video for Claims</strong>
                        <div>
                          We take great care in packaging your orders. However, in the rare event of a manufacturing
                          defect or damage during transit, a claim can ONLY be processed if you provide a 360-degree
                          unboxing video.
                        </div>

                        <div style={{ marginTop: 10, fontWeight: 800, color: "#111827" }}>
                          Video Requirements (Strictly Follow):
                        </div>
                        <ul style={{ margin: "8px 0 0 18px" }}>
                          <li>
                            <strong>No Cuts, No Edits:</strong> The video must be a single, continuous shot from start
                            to finish.
                          </li>
                          <li>
                            <strong>Start to Finish:</strong> The video must start from the moment you receive the
                            parcel from the delivery partner.
                          </li>
                          <li>
                            <strong>Clear View:</strong> Show the uncut original packaging/label, the process of
                            opening the package, taking out the suit, and highlighting the specific defect.
                          </li>
                          <li>
                            <strong>Timeline:</strong> The video must be sent to us on WhatsApp within 24 hours of
                            delivery.
                          </li>
                        </ul>
                        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.20)", color: "#7f1d1d" }}>
                          <strong>Note:</strong> If the video has any cuts, edits, or if the package was already opened
                          before starting the video, the claim will be immediately rejected.
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 900, color: "#111827", marginBottom: 6 }}>How to Report a Defect?</div>
                  <div style={{ color: "#555", lineHeight: 1.8 }}>
                    If you meet the above criteria, please WhatsApp us your order number and the unboxing video. Our
                    team will review it and get back to you within 48 hours.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

