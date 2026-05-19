import React, { useEffect, useMemo, useState } from "react";
import { adminListContactMessages } from "../../redux/actions";

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
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

export default function ContactMessagesAdminSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListContactMessages({ limit: 200 });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = String(q || "").trim().toLowerCase();
    if (!s) return items;
    return items.filter((m) => {
      const name = String(m?.name || "").toLowerCase();
      const email = String(m?.email || "").toLowerCase();
      const phone = String(m?.phone || "").toLowerCase();
      const msg = String(m?.message || "").toLowerCase();
      return (
        name.includes(s) ||
        email.includes(s) ||
        phone.includes(s) ||
        msg.includes(s) ||
        String(m?._id || "").toLowerCase().includes(s)
      );
    });
  }, [items, q]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>Contact messages</div>
          <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>From the Contact Us form</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / email / phone / message"
            style={{
              height: 38,
              width: 320,
              maxWidth: "100%",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "0 12px",
              fontWeight: 700,
              outline: "none",
            }}
          />
          <button type="button" className="btn btn-ghost" style={{ height: 38 }} onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#991b1b", fontWeight: 800 }}>
          {error}
        </div>
      ) : null}

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 220px 160px 1fr 130px", gap: 0, padding: "10px 12px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontWeight: 950, color: "#0f172a", fontSize: 12 }}>
          <div>Name</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Message</div>
          <div>Date</div>
        </div>

        {loading ? (
          <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>Loading…</div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>No messages found.</div>
        ) : null}

        {!loading &&
          filtered.map((m) => (
            <div
              key={String(m?._id)}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 220px 160px 1fr 130px",
                padding: "10px 12px",
                borderBottom: "1px solid #f1f5f9",
                alignItems: "start",
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 900, color: "#0f172a" }}>{m?.name || "—"}</div>
              <div style={{ color: "#0f172a", fontWeight: 800, wordBreak: "break-all" }}>{m?.email || "—"}</div>
              <div style={{ color: "#334155", fontWeight: 800 }}>{m?.phone || "—"}</div>
              <div style={{ color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m?.message || "—"}</div>
              <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>{fmtDate(m?.createdAt)}</div>
            </div>
          ))}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .content .btn { white-space: nowrap; }
        }
        @media (max-width: 860px) {
          /* Stack rows into cards on smaller screens */
          .admin-contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

