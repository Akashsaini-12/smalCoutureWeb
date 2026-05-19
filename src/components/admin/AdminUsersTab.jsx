import React, { useEffect, useMemo, useState } from "react";

export default function AdminUsersTab({
  listOrders,
  adminListUsers,
  Modal,
  OrderDetail,
  ProductDetail,
  formatDate,
  formatINR,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [ordersOpen, setOrdersOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [productOpen, setProductOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    adminListUsers()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.users) ? res.users : [];
        setUsers(list);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || "Failed to load users");
        setUsers([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [adminListUsers]);

  const filtered = useMemo(() => {
    const q = String(query || "").toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const name = `${u?.firstName || ""} ${u?.lastName || ""}`.toLowerCase();
      const email = String(u?.email || "").toLowerCase();
      const phone = String(u?.phone || "").toLowerCase();
      const id = String(u?._id || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
    });
  }, [users, query]);

  const openUserOrders = async (u) => {
    setSelectedUser(u);
    setOrdersOpen(true);
    setOrdersLoading(true);
    setOrdersError("");
    setUserOrders([]);
    setDetailOpen(false);
    setSelectedOrder(null);
    setProductOpen(false);
    setSelectedItem(null);

    try {
      const res = await listOrders({ userId: u?._id || "" });
      setUserOrders(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setOrdersError(e?.message || "Failed to load orders for user");
    } finally {
      setOrdersLoading(false);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
    setProductOpen(false);
    setSelectedItem(null);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 16 }}>Users</div>
        <div style={{ flex: "1 1 280px" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name / email / phone / userId"
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              background: "#fff",
              fontWeight: 800,
              outline: "none",
            }}
          />
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#fafafa",
            color: "#64748b",
            fontWeight: 800,
          }}
        >
          Loading users…
        </div>
      ) : error ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #fecaca",
            borderRadius: 12,
            background: "#fef2f2",
            color: "#991b1b",
            fontWeight: 900,
          }}
        >
          {error}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>ID</th>
                <th>Verified</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => {
                const id = String(u?._id || "");
                const name = `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "User";
                const verified = Boolean(u?.isVerified);
                return (
                  <tr
                    key={id || idx}
                    onClick={() => openUserOrders(u)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                      {u?.email || "—"} {u?.phone ? `• ${u.phone}` : ""}
                    </td>
                    <td style={{ color: "#0f172a", fontWeight: 800, fontSize: 12 }}>
                      {id || "-"}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 950,
                          color: verified ? "#166534" : "#b91c1c",
                          background: verified ? "#dcfce7" : "#fef2f2",
                          border: `1px solid ${verified ? "#bbf7d0" : "#fecaca"}`,
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          display: "inline-block",
                        }}
                      >
                        {verified ? "Verified" : "Not verified"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 950, color: "#0f172a", fontSize: 12, textDecoration: "underline" }}>
                        View Orders →
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#64748b", fontWeight: 800, padding: 22 }}>
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {/* User Orders modal */}
      <Modal
        open={ordersOpen}
        title={selectedUser ? `Orders for ${selectedUser.firstName || "User"}` : "User orders"}
        width="min(820px, 100%)"
        onClose={() => {
          setOrdersOpen(false);
          setSelectedUser(null);
          setUserOrders([]);
        }}
      >
        {ordersLoading ? (
          <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>Loading orders…</div>
        ) : ordersError ? (
          <div style={{ padding: 16, color: "#991b1b", fontWeight: 900 }}>{ordersError}</div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)",
                gap: 10,
                padding: "12px 12px",
                background: "#f8fafc",
                fontWeight: 950,
                color: "#334155",
                fontSize: 12,
              }}
            >
              <div>Order</div>
              <div>Payment</div>
              <div style={{ textAlign: "right" }}>Total</div>
            </div>

            {userOrders.map((o, idx) => (
              <button
                key={String(o?._id || idx)}
                type="button"
                onClick={() => openOrderDetail(o)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)",
                  gap: 10,
                  padding: 12,
                  cursor: "pointer",
                  borderBottom: "1px solid #e5e7eb",
                  background: idx % 2 === 0 ? "#fff" : "#fcfcff",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o?._id || "-"}
                  </div>
                  <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>Placed: {formatDate(o?.createdAt)}</div>
                </div>
                <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 12 }}>
                  {String(o?.paymentStatus || "pending").toUpperCase()}
                  <div style={{ color: "#64748b", fontWeight: 800, marginTop: 4 }}>{String(o?.status || "created").toUpperCase()}</div>
                </div>
                <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13, textAlign: "right" }}>{formatINR(o?.total)}</div>
              </button>
            ))}

            {!userOrders.length ? <div style={{ padding: 16, color: "#64748b", fontWeight: 800 }}>No orders yet.</div> : null}
          </div>
        )}
      </Modal>

      {/* Order detail modal */}
      <Modal
        open={detailOpen}
        title="Order details"
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrder(null);
        }}
      >
        {selectedOrder ? (
          <OrderDetail
            order={selectedOrder}
            onItemClick={(it) => {
              setSelectedItem(it);
              setProductOpen(true);
            }}
          />
        ) : null}
      </Modal>

      {/* Product detail modal */}
      <Modal
        open={productOpen}
        title="Product details"
        width="min(720px, 100%)"
        onClose={() => {
          setProductOpen(false);
          setSelectedItem(null);
        }}
      >
        {selectedItem ? <ProductDetail item={selectedItem} /> : null}
      </Modal>
    </div>
  );
}

