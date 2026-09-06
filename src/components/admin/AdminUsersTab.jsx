import React, { useEffect, useMemo, useState } from "react";

export default function AdminUsersTab({
  listOrders,
  adminListUsers,
  adminDeleteUser,
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
  const [deletingUserId, setDeletingUserId] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [adminIdentifier, setAdminIdentifier] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

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

  const removeUser = async (event, user) => {
    event.stopPropagation();
    const userId = String(user?._id || "");
    if (!userId || deletingUserId) return;
    setRemoveTarget(user);
    setAdminIdentifier("");
    setAdminPassword("");
  };

  const confirmRemoveUser = async (event) => {
    event.preventDefault();
    const userId = String(removeTarget?._id || "");
    if (!userId || deletingUserId || !adminIdentifier.trim() || !adminPassword) return;
    setDeletingUserId(userId);
    setError("");
    try {
      await adminDeleteUser(userId, { emailOrPhone: adminIdentifier.trim(), password: adminPassword });
      setUsers((current) => current.filter((item) => String(item?._id || "") !== userId));
      setRemoveTarget(null);
    } catch (e) {
      setError(e?.message || "Failed to remove user");
    } finally {
      setDeletingUserId("");
      setAdminPassword("");
    }
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
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 950, color: "#0f172a", fontSize: 12, textDecoration: "underline" }}>
                          View Orders →
                        </span>
                        <button
                          type="button"
                          onClick={(event) => removeUser(event, u)}
                          disabled={deletingUserId === id}
                          style={{
                            border: "1px solid #d6c7ba",
                            borderRadius: 999,
                            padding: "6px 11px",
                            background: "#f7f2ec",
                            color: "#705845",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: deletingUserId === id ? "wait" : "pointer",
                          }}
                        >
                          {deletingUserId === id ? "Removing…" : "Remove"}
                        </button>
                      </div>
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

      <Modal
        open={Boolean(removeTarget)}
        title="Confirm user removal"
        width="min(420px, calc(100% - 32px))"
        onClose={() => {
          if (!deletingUserId) setRemoveTarget(null);
        }}
      >
        <form onSubmit={confirmRemoveUser} style={{ display: "grid", gap: 9 }}>
          <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.4 }}>
            Enter your admin ID and password to remove this account. Existing orders will be preserved.
          </div>
          <div style={{ padding: "9px 11px", borderRadius: 9, background: "#f7f2ec", color: "#5b4637", fontSize: 12, lineHeight: 1.5 }}>
            <strong>{`${removeTarget?.firstName || ""} ${removeTarget?.lastName || ""}`.trim() || "User"}</strong>
            <div>Mobile: {removeTarget?.phone || "Unavailable"}</div>
          </div>
          <input
            value={adminIdentifier}
            onChange={(event) => setAdminIdentifier(event.target.value)}
            placeholder="Admin email or mobile"
            autoComplete="username"
            required
            style={{ padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: 9 }}
          />
          <input
            value={adminPassword}
            onChange={(event) => setAdminPassword(event.target.value)}
            placeholder="Admin password"
            type="password"
            autoComplete="current-password"
            required
            style={{ padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: 9 }}
          />
          <button
            type="submit"
            disabled={Boolean(deletingUserId)}
            style={{ justifySelf: "end", border: "1px solid #d6c7ba", borderRadius: 999, padding: "8px 15px", background: "#705845", color: "#fff", fontWeight: 800, cursor: "pointer" }}
          >
            {deletingUserId ? "Removing…" : "Confirm remove"}
          </button>
        </form>
      </Modal>

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
