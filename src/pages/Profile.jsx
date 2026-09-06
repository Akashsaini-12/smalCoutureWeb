import React, { useEffect, useMemo, useRef, useState } from "react";
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
  minHeight: 52,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #dfe4ea",
  fontSize: 16,
  fontFamily: "inherit",
  boxSizing: "border-box",
  outline: "none",
  background: "#f8f9fa",
  color: "#333",
  transition: "box-shadow 0.15s ease, border-color 0.15s ease",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#75604f",
  marginBottom: 8,
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #eee9e3",
  borderRadius: 14,
  padding: "22px 20px",
  boxShadow: "0 12px 35px rgba(42, 33, 27, 0.04)",
};

const compactCardStyle = {
  ...cardStyle,
  padding: "18px 16px",
};

const compactInputStyle = {
  ...inputStyle,
  minHeight: 46,
  fontSize: 16,
};

const passwordInputStyle = {
  ...compactInputStyle,
  fontSize: 24,
  letterSpacing: "0.14em",
  lineHeight: 1,
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: 4,
  fontSize: 15,
  fontWeight: 800,
  color: "#171717",
  letterSpacing: "-0.01em",
};

const sectionSubStyle = {
  marginTop: 0,
  marginBottom: 18,
  fontSize: 12.5,
  color: "#766150",
};

function initialsOfUser(user) {
  const f = String(user?.firstName || "").trim();
  const l = String(user?.lastName || "").trim();
  const a = (f[0] || "U").toUpperCase();
  const b = (l[0] || "").toUpperCase();
  return `${a}${b}`.trim();
}

function ProfileFloatingField({ id, label, value, onChange, type = "text", style, ...props }) {
  const [focused, setFocused] = useState(false);
  const active = focused || String(value ?? "").length > 0;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <label
        htmlFor={id}
        style={{
          position: "absolute",
          left: 12,
          top: active ? 0 : "50%",
          zIndex: 1,
          padding: "0 3px",
          color: active ? "#685343" : "#75604f",
          background: active ? "#fff" : "transparent",
          fontSize: active ? 11 : 15,
          pointerEvents: "none",
          transform: active ? "translateY(-50%)" : "translateY(-50%)",
          transition: "top 0.2s ease, font-size 0.2s ease, color 0.2s ease",
        }}
      >
        {label}
      </label>
      <input
        {...props}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={{
          ...compactInputStyle,
          ...style,
          borderColor: focused ? "#b88a58" : "#dfe4ea",
          background: focused ? "#fff" : "#f8f9fa",
          boxShadow: focused ? "0 0 0 2px rgba(184,138,88,0.12)" : "none",
        }}
      />
    </div>
  );
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
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

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
    if (!/^\d{10}$/.test(String(phone || "").trim())) {
      toast.error("Phone number must contain exactly 10 digits");
      return;
    }
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
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast.error("Password must contain at least one letter and one number");
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
      setNewPasswordTouched(false);
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

  return (
    <main id="MainContent" role="main">
      <div className="shopify-section" id="shopify-section-profile">
        <div
          style={{
            background: "#ffffff",
            color: "#5b3a1d",
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
                    style={{ color: "#8a6338", textDecoration: "none", fontWeight: 700, fontSize: 13 }}
                  >
                    Home
                  </Link>
                  <span style={{ opacity: 0.35 }}>›</span>
                  <span style={{ color: "#5b3a1d", fontWeight: 800, fontSize: 13 }}>Account</span>
                </div>
                {user?.role === 0 && (
                  <Link
                    to="/admin"
                    style={{ color: "#8a6338", fontWeight: 800, textDecoration: "underline", fontSize: 13, whiteSpace: "nowrap" }}
                  >
                    ← Back to admin panel
                  </Link>
                )}
              </div>
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "#fff",
                    border: "1px solid #b79160",
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
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", color: "#5b3a1d" }}>{user.firstName || "Account"}</h1>
                <div style={{ marginTop: 4, color: "#8a6338", fontSize: 13.5, fontWeight: 600 }}>
                  {user.email}
                  {user?.role === 0 ? " • Admin" : ""}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  handleAvatarPick(e.target.files?.[0]);
                  e.target.value = "";
                }}
                disabled={avatarUploading}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 38,
                  padding: 0,
                  borderRadius: 14,
                  background: "#fff",
                  border: "1px solid #b79160",
                  color: "#5b3a1d",
                  cursor: avatarUploading ? "wait" : "pointer",
                }}
                aria-label="Edit profile photo"
                title="Edit profile photo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </button>
              <Link
                to="/orders"
                className="profile-orders-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "#fff",
                  border: "1px solid #b79160",
                  color: "#5b3a1d",
                  textDecoration: "none",
                  cursor: "pointer",
                  userSelect: "none",
                  fontWeight: 900,
                  fontSize: 13,
                  minWidth: 132,
                }}
              >
                My orders
              </Link>

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
                  background: "#fff",
                  border: "1px solid #b79160",
                  color: "#5b3a1d",
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
              <section style={compactCardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={sectionTitleStyle}>Profile details</h2>
                    <p style={sectionSubStyle}>Update your contact information for orders and support.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: "grid", gap: 14 }}>
                    <div>
                      <ProfileFloatingField
                        id="profile-email"
                        label="Email"
                        type="email"
                        value={user.email || ""}
                        readOnly
                        style={{ background: "#f8f9fa", color: "#333" }}
                      />
                      <p style={{ fontSize: 12, color: "rgba(15,23,42,0.55)", marginTop: 8, marginBottom: 0 }}>
                        Email can’t be changed here.
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <ProfileFloatingField
                          id="profile-first"
                          label="First name"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          autoComplete="given-name"
                        />
                      </div>
                      <div>
                        <ProfileFloatingField
                          id="profile-last"
                          label="Last name"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    <div>
                      <ProfileFloatingField
                        id="profile-phone"
                        label="Phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        autoComplete="tel"
                        inputMode="numeric"
                        minLength={10}
                        maxLength={10}
                        pattern="[0-9]{10}"
                        title="Enter exactly 10 digits"
                      />
                    </div>

                    <div className="profile-action-wrap" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <button
                        type="submit"
                        disabled={loading || !dirtyProfile}
                        style={{
                          padding: "10px 14px",
                          background: "#fff",
                          color: "#5b3a1d",
                          border: "1px solid #b79160",
                          borderRadius: 14,
                          fontSize: 13,
                          fontWeight: 900,
                          cursor: loading ? "wait" : "pointer",
                          fontFamily: "inherit",
                          opacity: 1,
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        {loading ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </div>
                </form>
              </section>

              <section style={compactCardStyle}>
                <h2 style={sectionTitleStyle}>Security</h2>
                <p style={sectionSubStyle}>Please use a 6 digits alphanumeric password to keep your account safe.</p>

                <form onSubmit={handleChangePassword}>
                  <div style={{ display: "grid", gap: 14 }}>
                    <div>
                      <ProfileFloatingField
                        id="pw-current"
                        label="Current password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        minLength={6}
                        required
                        style={passwordInputStyle}
                      />
                    </div>

                    <div>
                      <ProfileFloatingField
                        id="pw-new"
                        label="New password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewPassword(value);
                          setNewPasswordTouched(value.length >= 6);
                        }}
                        onBlur={() => setNewPasswordTouched(true)}
                        autoComplete="new-password"
                        minLength={6}
                        pattern="(?=.*[A-Za-z])(?=.*\d).+"
                        title="Password must contain at least one letter and one number"
                        required
                        style={passwordInputStyle}
                      />
                      {newPasswordTouched && newPassword.length > 0 && (
                        newPassword.length < 6 ? (
                          <p className="profile-password__hint">Please enter at least 6 characters</p>
                        ) : (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) ? (
                          <p className="profile-password__hint">Password must contain at least one letter and one number</p>
                        ) : null
                      )}
                    </div>

                    <div>
                      <ProfileFloatingField
                        id="pw-confirm"
                        label="Confirm new password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        pattern="(?=.*[A-Za-z])(?=.*\d).+"
                        title="Password must contain at least one letter and one number"
                        required
                        style={passwordInputStyle}
                      />
                    </div>

                    <div className="profile-action-wrap" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <button
                        type="submit"
                        disabled={loading || !currentPassword || !newPassword}
                        style={{
                          padding: "10px 14px",
                          background: "#fff",
                          color: "#5b3a1d",
                          border: "1px solid #b79160",
                          borderRadius: 14,
                          fontSize: 13,
                          fontWeight: 900,
                          cursor: loading ? "wait" : "pointer",
                          fontFamily: "inherit",
                          opacity: 1,
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        Update password
                      </button>
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
                          padding: "16px",
                          border: active ? "2px solid #b79160" : "1px solid #d8a45f",
                          background: "#fff",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 950, color: "#0f172a" }}>
                            {a?.label || "Address"} {a?.isDefault ? <span style={{ color: "#8a6338" }}>• Default</span> : null}
                          </div>
                          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <span
                              title="Edit address"
                              aria-label="Edit address"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startEditAddress(String(a._id));
                              }}
                              style={{
                                width: 38,
                                height: 38,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid #30251f",
                                borderRadius: 11,
                                background: "#fff",
                                color: "#5b3a1d",
                                cursor: "pointer",
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                              </svg>
                            </span>
                            <span
                              title="Delete address"
                              aria-label="Delete address"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedAddressId(String(a._id));
                                handleDeleteAddress();
                              }}
                              style={{
                                width: 38,
                                height: 38,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid #30251f",
                                borderRadius: 11,
                                background: "#fff",
                                color: "#5b3a1d",
                                cursor: "pointer",
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                                <path d="M6 6l12 12M18 6 6 18" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, color: "rgba(15,23,42,0.72)", fontWeight: 700, fontSize: 13 }}>
                          {a?.name || "-"} • {a?.phone || "-"}
                        </div>
                        <div style={{ marginTop: 6, color: "rgba(15,23,42,0.62)", fontSize: 13, lineHeight: 1.4 }}>
                          {a?.address1}
                          <br />
                          {[a?.city, a?.state].filter(Boolean).join(", ")} {a?.pincode ? `- ${a.pincode}` : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <button
                  type="button"
                  onClick={startNewAddress}
                  style={{
                    padding: "10px 18px",
                    background: "#fff",
                    color: "#5b3a1d",
                    border: "1px solid #b79160",
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

              {addrError ? (
                <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 800 }}>{addrError}</div>
              ) : null}

              {showAddressForm && (
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 950, color: "#5b3a1d" }}>
                      {selectedAddressId ? "Edit address" : "Add new address"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      style={{
                        border: "none",
                        background: "#f1ede5",
                        padding: "10px 12px",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: 900,
                        color: "#5b3a1d",
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
