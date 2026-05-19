import React from "react";
import { Link } from "react-router-dom";
import MixMatchAdminSection from "../components/admin/MixMatchAdminSection";

export default function AdminMixMatchListPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          <Link
            to="/admin"
            style={{
              fontWeight: 700,
              color: "#0f172a",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Back to admin home
          </Link>
          <Link
            to="/account"
            style={{
              fontWeight: 700,
              color: "#2563eb",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            My profile
          </Link>
        </div>
        <MixMatchAdminSection />
      </div>
    </div>
  );
}
