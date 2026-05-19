import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <main id="MainContent" role="main">
      <div className="shopify-section" id="shopify-section-template--static-privacy__main">
        <div className="m-page-header m-page-header--large m:text-center m-scroll-trigger animate--fade-in-up">
          <div className="container-fluid">
            <h1 className="m-page-header__title">Privacy Policy</h1>
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
                <span className="m-breadcrumb--item-current m-breadcrumb--item">Privacy Policy</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="container">
          <div className="m-login-form" style={{ maxWidth: 980, margin: "0 auto 48px" }}>
            <h3 style={{ marginBottom: 10 }}>Your privacy matters</h3>
            <p style={{ color: "#555", lineHeight: 1.8, marginBottom: 0 }}>
              Your submission of personal information through the store is used only for order processing and
              communication. We do not sell your personal data.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

