import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  registerThunk,
  verifyOtpThunk,
  sendOtpThunk,
} from "../../redux/actions";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [localError, setLocalError] = useState("");

  // After OTP sent, pendingEmail is set → show OTP panel
  const showOtpPanel = Boolean(auth.pendingEmail) && !auth.user;

  // Redirect after successful verification / login
  useEffect(() => {
    if (auth.user && auth.token) navigate("/");
  }, [auth.user, auth.token, navigate]);

  const handleRegister = (e) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    dispatch(registerThunk({ firstName, lastName, email, phone, password }));
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    dispatch(verifyOtpThunk(auth.pendingEmail || email, otp));
  };

  const handleResendOtp = () => {
    dispatch(sendOtpThunk(auth.pendingEmail || email));
  };

  return (
    <>
      <main id="MainContent" role="main">
        <div className="shopify-section" id="shopify-section-template--16598221815913__main">
          <div className="m-page-header m-page-header--template-register m:text-center m-scroll-trigger animate--fade-in-up">
            <div className="container-fluid">
              <h1 className="m-page-header__title">Register</h1>
            </div>
            <nav aria-label="breadcrumbs" className="m-breadcrumb m:w-full" role="navigation">
              <div className="container-fluid">
                <div className="m-breadcrumb--wrapper m:flex m:items-center m:justify-center">
                  <Link className="m-breadcrumb--item" to="/" title="Back to the home page">Home</Link>
                  <span aria-hidden="true" className="m-breadcrumb--separator">
                    <svg className="m-svg-icon--small m-rlt-reverse-x" fill="currentColor" stroke="currentColor" viewBox="0 0 256 512" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.525 36.465l-7.071 7.07c-4.686 4.686-4.686 12.284 0 16.971L205.947 256 10.454 451.494c-4.686 4.686-4.686 12.284 0 16.971l7.071 7.07c4.686 4.686 12.284 4.686 16.97 0l211.051-211.05c4.686-4.686 4.686-12.284 0-16.971L34.495 36.465c-4.686-4.687-12.284-4.687-16.97 0z" />
                    </svg>
                  </span>
                  <span className="m-breadcrumb--item-current m-breadcrumb--item">Create Account</span>
                </div>
              </div>
            </nav>
          </div>

          <div className="m-register-form">
            <div className="m-register-form__wrapper">

              {/* ── Registration Form ── */}
              {!showOtpPanel && (
                <>
                  <h1>Register</h1>
                  {(localError || auth.error) && (
                    <p style={{ color: "red", marginBottom: 12 }}>{localError || auth.error}</p>
                  )}
                  <form onSubmit={handleRegister}>
                    <input
                      className="form-field form-field--input"
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                    <input
                      className="form-field form-field--input"
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    <input
                      className="form-field form-field--input"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <input
                      className="form-field form-field--input"
                      type="tel"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <input
                      className="form-field form-field--input"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <input
                      className="form-field form-field--input"
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <div className="m-register-form__description">
                      Sign up for early Sale access plus tailored new arrivals, trends and promotions.
                      To opt out, click unsubscribe in our emails.
                    </div>
                    <button className="m-button m-button--primary m:w-full" type="submit" disabled={auth.loading}>
                      {auth.loading ? "Creating account…" : "Register"}
                    </button>
                    <button
                      type="button"
                      className="m-button m-button--secondary m:w-full"
                      onClick={() => navigate("/login")}
                    >
                      Log In
                    </button>
                  </form>
                </>
              )}

              {/* ── OTP Verification Panel ── */}
              {showOtpPanel && (
                <>
                  <h1>Verify Email</h1>
                  <p style={{ color: "#555", marginBottom: 16 }}>
                    We sent a 6-digit OTP to <b>{auth.pendingEmail}</b>. Enter it below to activate your account.
                  </p>
                  {auth.error && <p style={{ color: "red", marginBottom: 12 }}>{auth.error}</p>}
                  {auth.successMessage && <p style={{ color: "green", marginBottom: 12 }}>{auth.successMessage}</p>}
                  <form onSubmit={handleVerifyOtp}>
                    <input
                      className="form-field form-field--input"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                      style={{ letterSpacing: 6, fontSize: 22, textAlign: "center" }}
                    />
                    <button className="m-button m-button--primary m:w-full" type="submit" disabled={auth.loading}>
                      {auth.loading ? "Verifying…" : "Verify OTP"}
                    </button>
                  </form>
                  <button
                    type="button"
                    className="m-button m-button--white m:w-full"
                    style={{ marginTop: 12 }}
                    onClick={handleResendOtp}
                    disabled={auth.loading}
                  >
                    Resend OTP
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Register;
