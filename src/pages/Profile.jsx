import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  fetchCurrentUser,
  logoutThunk,
  updateProfileThunk,
  changePasswordThunk,
} from "../redux/actions";
import {
  deleteAddress,
  listAddresses,
  saveAddress,
  uploadImageToCloudinary,
} from "../redux/actions";
import { getUserId } from "../utils/userId";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(15, 23, 42, 0.14)",
  fontSize: 15,
  fontFamily: "inherit",
  boxSizing: "border-box",
  outline: "none",
  background: "#fff",
  transition: "box-shadow 0.15s ease, border-color 0.15s ease",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15, 23, 42, 0.6)",
  marginBottom: 8,
};

const cardStyle = {
  background: "#fff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 18,
  padding: "22px 20px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: 4,
  fontSize: 16,
  fontWeight: 850,
  color: "#0f172a",
  letterSpacing: "-0.01em",
};

const sectionSubStyle = {
  marginTop: 0,
  marginBottom: 18,
  fontSize: 13.5,
  color: "rgba(15, 23, 42, 0.62)",
};

function initialsOfUser(user) {
  const f = String(user?.firstName || "").trim();
  const l = String(user?.lastName || "").trim();
  const a = (f[0] || "U").toUpperCase();
  const b = (l[0] || "").toUpperCase();
  return `${a}${b}`.trim();
}

export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);
  const loading = useSelector((s) => s.auth?.loading);
  const error = useSelector((s) => s.auth?.error);
  const userId = getUserId();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setPhone(user.phone || "");
  }, [user]);

  useEffect(() => {
    let mounted = true;
    setAddrLoading(true);
    setAddrError("");
    listAddresses({ userId })
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.items) ? res.items : [];
        setSavedAddresses(list);
        const def = list.find((a) => a?.isDefault) || list[0];
        if (def && def._id) {
          setSelectedAddressId(String(def._id));
          setAddressLabel(def.label || "Home");
          setAddrName(def.name || "");
          setAddrPhone(def.phone || "");
          setAddress1(def.address1 || "");
          setCity(def.city || "");
          setState(def.state || "");
          setPincode(def.pincode || "");
          setIsDefaultAddress(Boolean(def.isDefault));
        } else {
          setSelectedAddressId("");
        }
      })
      .catch((e) => {
        if (!mounted) return;
        setAddrError(e?.message || "Failed to load addresses");
      })
      .finally(() => {
        if (!mounted) return;
        setAddrLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const startNewAddress = () => {
    setSelectedAddressId("");
    setAddressLabel("Home");
    setAddrName(`${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim());
    setAddrPhone(String(phone || "").trim());
    setAddress1("");
    setCity("");
    setState("");
    setPincode("");
    setIsDefaultAddress(savedAddresses.length === 0);
    setShowAddressForm(true);
    setAddrError("");
  };

  const selectAddress = (id) => {
    const found = savedAddresses.find((a) => String(a?._id) === String(id));
    setSelectedAddressId(String(id || ""));
    if (!found) return;
    setAddressLabel(found.label || "Home");
    setAddrName(found.name || "");
    setAddrPhone(found.phone || "");
    setAddress1(found.address1 || "");
    setCity(found.city || "");
    setState(found.state || "");
    setPincode(found.pincode || "");
    setIsDefaultAddress(Boolean(found.isDefault));
    setShowAddressForm(false);
    setAddrError("");
  };

  const startEditAddress = (id) => {
    selectAddress(id);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    setAddrError("");
    if (!addrName || !addrPhone || !address1 || !city || !state || !pincode) {
      setAddrError("Please fill all required fields");
      return;
    }
    try {
      await saveAddress({
        userId,
        addressId: selectedAddressId || undefined,
        label: addressLabel,
        name: addrName,
        phone: addrPhone,
        address1,
        city,
        state,
        pincode,
        isDefault: isDefaultAddress,
      });
      const listRes = await listAddresses({ userId });
      const list = Array.isArray(listRes?.items) ? listRes.items : [];
      setSavedAddresses(list);
      const def = list.find((a) => a?.isDefault) || list[0];
      if (def && def._id) setSelectedAddressId(String(def._id));
      setShowAddressForm(false);
      toast.success("Address saved");
    } catch (e) {
      setAddrError(e?.message || "Failed to save address");
    }
  };

  const handleDeleteAddress = async () => {
    if (!selectedAddressId) return;
    try {
      await deleteAddress({ userId, addressId: selectedAddressId });
      const listRes = await listAddresses({ userId });
      const list = Array.isArray(listRes?.items) ? listRes.items : [];
      setSavedAddresses(list);
      const def = list.find((a) => a?.isDefault) || list[0];
      if (def && def._id) selectAddress(String(def._id));
      else startNewAddress();
      toast.success("Address deleted");
    } catch (e) {
      setAddrError(e?.message || "Failed to delete address");
    }
  };

  const handleAvatarPick = async (file) => {
    if (!file) return;
    try {
      setAvatarUploading(true);
      const url = await uploadImageToCloudinary(file);
      await dispatch(updateProfileThunk({ avatarUrl: url }));
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(e?.message || "Failed to update photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const dirtyProfile = useMemo(() => {
    if (!user) return false;
    const fn = String(firstName || "").trim();
    const ln = String(lastName || "").trim();
    const ph = String(phone || "").trim();
    return (
      fn !== String(user.firstName || "").trim() ||
      ln !== String(user.lastName || "").trim() ||
      ph !== String(user.phone || "").trim()
    );
  }, [firstName, lastName, phone, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        updateProfileThunk({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }),
      );
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.message || "Could not update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await dispatch(
        changePasswordThunk({ currentPassword, newPassword }),
      );
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err?.message || "Could not change password");
    }
  };

  if (!user) {
    return (
      <main
        id="MainContent"
        role="main"
        style={{
          padding: "64px 20px",
          textAlign: "center",
          color: "rgba(15,23,42,0.72)",
          fontWeight: 600,
        }}
      >
        <p style={{ margin: 0 }}>Loading…</p>
      </main>
    );
  }

  const avatarInitials = initialsOfUser(user);
  const avatarUrl = String(user?.avatarUrl || "").trim();

  const handleLogout = () => {
    const ok = window.confirm("Confirm logout?");
    if (!ok) return;
    dispatch(logoutThunk());
    window.location.href = "/";
  };

  return (
    <main id="MainContent" role="main">
      <div className="shopify-section" id="shopify-section-profile">
        <div
          style={{
            background: "linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 55%, rgba(51,65,85,1) 100%)",
            color: "#fff",
            padding: "38px 0 26px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="container-fluid" style={{ maxWidth: 980, margin: "0 auto", padding: "0 20px" }}>
            <nav aria-label="breadcrumbs" role="navigation" style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Link
                    to="/"
                    style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", fontWeight: 700, fontSize: 13 }}
                  >
                    Home
                  </Link>
                  <span style={{ opacity: 0.35 }}>›</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>Account</span>
                </div>
                {user?.role === 0 && (
                  <Link
                    to="/admin"
                    style={{ color: "#fff", fontWeight: 800, textDecoration: "underline", fontSize: 13, whiteSpace: "nowrap" }}
                  >
                    ← Back to admin panel
                  </Link>
                )}
              </div>
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span aria-hidden="true">{avatarInitials || "U"}</span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>My profile</h1>
                <div style={{ marginTop: 4, color: "rgba(255,255,255,0.72)", fontSize: 13.5, fontWeight: 600 }}>
                  {user.email}
                  {user?.role === 0 ? " • Admin" : ""}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  cursor: avatarUploading ? "wait" : "pointer",
                  userSelect: "none",
                  fontWeight: 900,
                  fontSize: 13,
                  minWidth: 132,
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleAvatarPick(e.target.files?.[0])}
                  disabled={avatarUploading}
                />
                {avatarUploading ? "Uploading…" : "Change photo"}
              </label>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgba(239,68,68,0.14)",
                  border: "1px solid rgba(239,68,68,0.28)",
                  color: "#fff",
                  fontWeight: 950,
                  fontSize: 13,
                  cursor: "pointer",
                  userSelect: "none",
                  minWidth: 132,
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="container-fluid" style={{ maxWidth: 980, margin: "0 auto", padding: "22px 20px 72px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            {/* Responsive 2-col layout on larger screens */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              <section style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={sectionTitleStyle}>Profile details</h2>
                    <p style={sectionSubStyle}>Update your contact information for orders and support.</p>
                  </div>
                  {dirtyProfile && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "rgba(37, 99, 235, 0.10)",
                        border: "1px solid rgba(37, 99, 235, 0.22)",
                        color: "#1d4ed8",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Unsaved changes
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: "grid", gap: 14 }}>
                    <div>
                      <label htmlFor="profile-email" style={labelStyle}>
                        Email
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        value={user.email || ""}
                        disabled
                        style={{ ...inputStyle, background: "rgba(15,23,42,0.04)", color: "rgba(15,23,42,0.55)" }}
                      />
                      <p style={{ fontSize: 12, color: "rgba(15,23,42,0.55)", marginTop: 8, marginBottom: 0 }}>
                        Email can’t be changed here.
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label htmlFor="profile-first" style={labelStyle}>
                          First name
                        </label>
                        <input
                          id="profile-first"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          autoComplete="given-name"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label htmlFor="profile-last" style={labelStyle}>
                          Last name
                        </label>
                        <input
                          id="profile-last"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="profile-phone" style={labelStyle}>
                        Phone
                      </label>
                      <input
                        id="profile-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <button
                        type="submit"
                        disabled={loading || !dirtyProfile}
                        style={{
                          padding: "14px 18px",
                          background: "#111827",
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          fontSize: 14.5,
                          fontWeight: 800,
                          cursor: loading ? "wait" : dirtyProfile ? "pointer" : "not-allowed",
                          fontFamily: "inherit",
                          opacity: loading ? 0.7 : dirtyProfile ? 1 : 0.55,
                          minWidth: 180,
                          boxShadow: "0 10px 24px rgba(17,24,39,0.18)",
                        }}
                      >
                        {loading ? "Saving…" : "Save changes"}
                      </button>
                      <span style={{ fontSize: 12.5, color: "rgba(15,23,42,0.60)", fontWeight: 600 }}>
                        Tip: your name is used on invoices and order emails.
                      </span>
                    </div>
                  </div>
                </form>
              </section>

              <section style={cardStyle}>
                <h2 style={sectionTitleStyle}>Security</h2>
                <p style={sectionSubStyle}>Change your password to keep your account safe.</p>

                <form onSubmit={handleChangePassword}>
                  <div style={{ display: "grid", gap: 14 }}>
                    <div>
                      <label htmlFor="pw-current" style={labelStyle}>
                        Current password
                      </label>
                      <input
                        id="pw-current"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label htmlFor="pw-new" style={labelStyle}>
                        New password
                      </label>
                      <input
                        id="pw-new"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label htmlFor="pw-confirm" style={labelStyle}>
                        Confirm new password
                      </label>
                      <input
                        id="pw-confirm"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <button
                        type="submit"
                        disabled={loading || !currentPassword || !newPassword}
                        style={{
                          padding: "14px 18px",
                          background: "#fff",
                          color: "#0f172a",
                          border: "1px solid rgba(15,23,42,0.18)",
                          borderRadius: 12,
                          fontSize: 14.5,
                          fontWeight: 850,
                          cursor: loading ? "wait" : currentPassword && newPassword ? "pointer" : "not-allowed",
                          fontFamily: "inherit",
                          opacity: loading ? 0.7 : currentPassword && newPassword ? 1 : 0.55,
                          minWidth: 180,
                        }}
                      >
                        Update password
                      </button>
                      <span style={{ fontSize: 12.5, color: "rgba(15,23,42,0.60)", fontWeight: 600 }}>
                        Minimum 6 characters.
                      </span>
                    </div>
                  </div>
                </form>
              </section>
            </div>

            {/* Address book */}
            <section style={{ ...cardStyle, marginTop: 2 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 style={sectionTitleStyle}>Address book</h2>
                  <p style={sectionSubStyle}>Save shipping addresses for faster checkout.</p>
                </div>
                <button
                  type="button"
                  onClick={startNewAddress}
                  style={{
                    padding: "10px 14px",
                    background: "#fff",
                    color: "#0f172a",
                    border: "1px solid rgba(15,23,42,0.18)",
                    borderRadius: 12,
                    fontSize: 13.5,
                    fontWeight: 850,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  + Add new
                </button>
              </div>

              {addrLoading ? (
                <div style={{ color: "rgba(15,23,42,0.65)", fontWeight: 700 }}>Loading addresses…</div>
              ) : savedAddresses.length ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  {savedAddresses.map((a) => {
                    const active = String(a?._id) === String(selectedAddressId);
                    return (
                      <button
                        key={String(a?._id)}
                        type="button"
                        onClick={() => selectAddress(String(a._id))}
                        style={{
                          textAlign: "left",
                          borderRadius: 16,
                          padding: "14px 14px",
                          border: active ? "2px solid rgba(37,99,235,0.55)" : "1px solid rgba(15,23,42,0.10)",
                          background: active ? "rgba(37,99,235,0.06)" : "#fff",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 950, color: "#0f172a" }}>
                            {a?.label || "Address"} {a?.isDefault ? <span style={{ color: "#1d4ed8" }}>• Default</span> : null}
                          </div>
                          <span style={{ color: "rgba(15,23,42,0.55)", fontWeight: 800, fontSize: 12 }}>Select</span>
                        </div>
                        <div style={{ marginTop: 6, color: "rgba(15,23,42,0.72)", fontWeight: 700, fontSize: 13 }}>
                          {a?.name || "-"} • {a?.phone || "-"}
                        </div>
                        <div style={{ marginTop: 6, color: "rgba(15,23,42,0.62)", fontSize: 13, lineHeight: 1.4 }}>
                          {a?.address1}
                          <br />
                          {[a?.city, a?.state].filter(Boolean).join(", ")} {a?.pincode ? `- ${a.pincode}` : ""}
                        </div>
                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <span
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              startEditAddress(String(a._id));
                            }}
                            style={{ color: "#111827", fontWeight: 900, fontSize: 13, textDecoration: "underline" }}
                          >
                            Edit
                          </span>
                          <span
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedAddressId(String(a._id));
                              handleDeleteAddress();
                            }}
                            style={{ color: "#e11d48", fontWeight: 900, fontSize: 13, textDecoration: "underline" }}
                          >
                            Delete
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: "rgba(15,23,42,0.65)", fontWeight: 700 }}>
                  No saved addresses yet. Add one to speed up checkout.
                </div>
              )}

              {addrError ? (
                <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 800 }}>{addrError}</div>
              ) : null}

              {showAddressForm && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>
                      {selectedAddressId ? "Edit address" : "Add new address"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      style={{
                        border: "none",
                        background: "rgba(15,23,42,0.06)",
                        padding: "10px 12px",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: 900,
                        color: "#0f172a",
                        fontFamily: "inherit",
                      }}
                    >
                      Close
                    </button>
                  </div>

                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Label</label>
                      <input value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} placeholder="Home/Office" style={inputStyle} />
                      <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontWeight: 800, color: "rgba(15,23,42,0.72)" }}>
                        <input type="checkbox" checked={isDefaultAddress} onChange={(e) => setIsDefaultAddress(e.target.checked)} />
                        Set as default
                      </label>
                    </div>
                    <div>
                      <label style={labelStyle}>Full name</label>
                      <input value={addrName} onChange={(e) => setAddrName(e.target.value)} placeholder="Name" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>Address</label>
                      <input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="Address line" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>State</label>
                      <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Pincode</label>
                      <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      style={{
                        padding: "14px 18px",
                        background: "#111827",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        fontSize: 14.5,
                        fontWeight: 850,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        minWidth: 180,
                      }}
                    >
                      {selectedAddressId ? "Update address" : "Save address"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAddress}
                      disabled={!selectedAddressId}
                      style={{
                        padding: "14px 18px",
                        background: "#fff",
                        color: "#e11d48",
                        border: "1px solid rgba(225,29,72,0.25)",
                        borderRadius: 12,
                        fontSize: 14.5,
                        fontWeight: 900,
                        cursor: selectedAddressId ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                        opacity: selectedAddressId ? 1 : 0.5,
                        minWidth: 180,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
