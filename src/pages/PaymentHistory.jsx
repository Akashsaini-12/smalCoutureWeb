import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

export default function PaymentHistory() {
  const userId = useSelector((s) => s?.userId) || "";
  const API_BASE =
    process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:4000`;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rows = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/payment-events/list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, limit: 100 }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to load payment history");
        if (!mounted) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load payment history");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    if (userId) load();
    else {
      setItems([]);
      setLoading(false);
      setError("Not logged in");
    }
    return () => {
      mounted = false;
    };
  }, [API_BASE, userId]);

  return (
    <main style={{ background: "#fff", padding: "28px 16px 80px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#0f172a" }}>
          Payment history
        </h1>
        <p style={{ marginTop: 8, marginBottom: 18, color: "#64748b", fontWeight: 700 }}>
          Shows cancelled / failed / verified Razorpay attempts for your account.
        </p>

        {loading ? (
          <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa" }}>
            Loading…
          </div>
        ) : error ? (
          <div style={{ padding: 14, border: "1px solid #fecaca", borderRadius: 12, background: "#fff1f2", color: "#991b1b", fontWeight: 800 }}>
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa", color: "#334155", fontWeight: 800 }}>
            No payment events yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead style={{ background: "#fafafa" }}>
                <tr>
                  {["Time", "Provider", "Event", "Status", "Amount", "Order ID", "Payment ID", "Reason"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 12px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#0f172a",
                        fontWeight: 900,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((it) => {
                  const amountInr =
                    it?.currency === "INR" ? (Number(it?.amount || 0) / 100).toFixed(2) : String(it?.amount || 0);
                  return (
                    <tr key={it?._id || `${it?.createdAt}_${it?.razorpayOrderId}`}>
                      <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", color: "#334155", fontWeight: 800, whiteSpace: "nowrap" }}>
                        {it?.createdAt ? new Date(it.createdAt).toLocaleString() : "-"}
                      </td>
                      <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontWeight: 900 }}>
                        {(it?.provider || "-").toUpperCase()}
                      </td>
                      <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontWeight: 900 }}>
                        {it?.eventType || "-"}
                      </td>
                      <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontWeight: 900 }}>
                        {it?.status || "-"}
                      </td>
                      <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontWeight: 900, whiteSpace: "nowrap" }}>
                        {it?.currency === "INR" ? `₹${amountInr}` : `${amountInr} ${it?.currency || ""}`}
                      </td>
                      <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", color: "#334155", fontWeight: 800 }}>
                        {it?.razorpayOrderId || "-"}
                      </td>
                      <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", color: "#334155", fontWeight: 800 }}>
                        {it?.razorpayPaymentId || "-"}
                      </td>
                      <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", color: "#334155", fontWeight: 800, maxWidth: 320 }}>
                        {it?.reason || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

