import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  loginThunk,
  forgotPasswordSendOtpThunk,
  forgotPasswordResetThunk,
} from "../../redux/actions";
import logo from "../../assets/ba-removebg-preview.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const [tab, setTab] = useState("login"); // "login" | "forgot"
  const [loginId, setLoginId] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  /** Forgot password: 1 = email, 2 = OTP, 3 = new password */
  const [forgotStep, setForgotStep] = useState(1);
  const [localError, setLocalError] = useState("");
  const passwordRef = useRef(null);

  useEffect(() => {
    dispatch({ type: "AUTH_CLEAR_MESSAGES" });
  }, [dispatch]);

  const resetForgotFlow = () => {
    setForgotStep(1);
    setForgotEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setLocalError("");
  };

  // Redirect when login succeeds.
  // Preserve the original destination when the user was sent to login from checkout/buy-now.
  useEffect(() => {
    if (!auth.user || !auth.token) return;

    const redirectTo = location?.state?.returnTo || "/";
    const buyNowItem = location?.state?.buyNowItem || null;

    if (auth.user.role === 0) {
      navigate("/admin", { replace: true });
      return;
    }

    if (redirectTo === "/checkout") {
      navigate("/checkout", {
        replace: true,
        state: buyNowItem ? { buyNowItem } : undefined,
      });
      return;
    }

    navigate(redirectTo, { replace: true });
  }, [auth.user, auth.token, navigate, location]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLocalError("");
    dispatch(loginThunk({ emailOrPhone: loginId, password }));
  };

  const handleLoginInputChange = (setter) => (e) => {
    setter(e.target.value);
    setLocalError("");
    dispatch({ type: "AUTH_CLEAR_MESSAGES" });
  };

  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setLocalError("");
    const normalizedEmail = String(forgotEmail || "").trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setLocalError("Please enter a valid email address");
      return;
    }
    try {
      await dispatch(forgotPasswordSendOtpThunk(normalizedEmail));
      setForgotStep(2);
    } catch {
      // error shown via auth.error
    }
  };

  const handleForgotResend = () => {
    setLocalError("");
    const normalizedEmail = String(forgotEmail || "").trim().toLowerCase();
    if (!normalizedEmail) {
      setLocalError("Go back to step 1 and enter your email.");
      return;
    }
    dispatch(forgotPasswordSendOtpThunk(normalizedEmail));
  };

  const handleForgotContinueToPassword = (e) => {
    e.preventDefault();
    setLocalError("");
    if (!resetOtp || String(resetOtp).trim().length < 4) {
      setLocalError("Please enter the OTP sent to your email");
      return;
    }
    setForgotStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLocalError("");
    const normalizedEmail = String(forgotEmail || "").trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setLocalError("Please enter a valid email address");
      return;
    }
    if (!resetOtp || String(resetOtp).trim().length < 4) {
      setLocalError("Please enter the OTP sent to your email");
      return;
    }
    if (String(newPassword || "").length < 6) {
      setLocalError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    try {
      await dispatch(
        forgotPasswordResetThunk({
          email: normalizedEmail,
          otp: resetOtp,
          newPassword,
        }),
      );
      setTab("login");
      resetForgotFlow();
    } catch {
      // error shown via auth.error
    }
  };

  return (
    <>
      <main id="MainContent" className="login-page" role="main">
        <div className="shopify-section" id="shopify-section-template--16598221750377__main">
          <div className="m-page-header m-page-header--template-login m-page-header--large m:text-center m-scroll-trigger animate--fade-in-up">
            <div className="container-fluid">
              <h1 className="m-page-header__title">Log In</h1>
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
                  <span className="m-breadcrumb--item-current m-breadcrumb--item">Account</span>
                </div>
              </div>
            </nav>
          </div>

          <div
            className={`m-customer-forms${tab === "forgot" ? " show-recover-password-form" : ""}`}
          >
            <div className="container">

              {/* ── Forgot Password Panel ── */}
              {tab === "forgot" && (
                <div className="m-recover-form" id="recover">
                  <h3>Reset your password</h3>
                  <p>OTP will be sent on your registered email only.</p>
                  {(localError || auth.error) && <p style={{ color: "red", marginBottom: 12 }}>{localError || auth.error}</p>}
                  {auth.successMessage && <p style={{ color: "green", marginBottom: 12 }}>{auth.successMessage}</p>}

                  {/* Step 1 — email only */}
                  {forgotStep === 1 && (
                    <form onSubmit={handleForgotSendOtp}>
                      <input
                        className="form-field form-field--input"
                        type="email"
                        placeholder="Registered Email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                      <div className="m-recover-form__action">
                        <button className="m-button m-button--primary" type="submit" disabled={auth.loading}>
                          {auth.loading ? "Sending…" : "Send OTP"}
                        </button>
                        <button
                          type="button"
                          className="m-recover-form__cancel-btn m-button m-button--white"
                          onClick={() => {
                            setTab("login");
                            resetForgotFlow();
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Step 2 — OTP + resend */}
                  {forgotStep === 2 && (
                    <form onSubmit={handleForgotContinueToPassword}>
                      <p style={{ color: "#555", marginBottom: 12 }}>Enter the OTP sent to <b>{forgotEmail}</b>.</p>
                      <input
                        className="form-field form-field--input"
                        type="text"
                        placeholder="Enter OTP"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        maxLength={6}
                        required
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        style={{ letterSpacing: 4, textAlign: "center" }}
                      />
                      <div className="m-recover-form__action">
                        <button className="m-button m-button--primary" type="submit" disabled={auth.loading}>
                          Continue
                        </button>
                        <button
                          type="button"
                          className="m-recover-form__cancel-btn m-button m-button--white"
                          onClick={handleForgotResend}
                          disabled={auth.loading}
                        >
                          Resend OTP
                        </button>
                        <button
                          type="button"
                          className="m-recover-form__cancel-btn m-button m-button--white"
                          onClick={() => {
                            setForgotStep(1);
                            setResetOtp("");
                            setLocalError("");
                          }}
                        >
                          Back
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Step 3 — new password */}
                  {forgotStep === 3 && (
                    <form onSubmit={handleResetPassword}>
                      <input
                        className="form-field form-field--input"
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <input
                        className="form-field form-field--input"
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                      />
                      <div className="m-recover-form__action">
                        <button className="m-button m-button--primary" type="submit" disabled={auth.loading}>
                          {auth.loading ? "Resetting…" : "Reset Password"}
                        </button>
                        <button
                          type="button"
                          className="m-recover-form__cancel-btn m-button m-button--white"
                          onClick={() => {
                            setForgotStep(2);
                            setLocalError("");
                          }}
                        >
                          Back
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ── Login Panel ── */}
              {tab === "login" && (
                <div className="m-login-form" id="login">
                  <p className="login-form__eyebrow">WELCOME BACK</p>
                  <h3>Sign in to your account</h3>
                  <p className="login-form__intro">Access your saved styles, orders and faster checkout.</p>
                  {(localError || auth.error) && <p style={{ color: "red", marginBottom: 12 }}>{localError || auth.error}</p>}
                  {auth.successMessage && <p style={{ color: "green", marginBottom: 12 }}>{auth.successMessage}</p>}
                  <form onSubmit={handleLogin}>
                    <div className="login-field">
                      <input
                        className="form-field form-field--input"
                        type="text"
                        placeholder=" "
                        value={loginId}
                        onChange={handleLoginInputChange(setLoginId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            passwordRef.current?.focus();
                          }
                        }}
                        required
                      />
                      <label>Email or mobile number</label>
                    </div>
                    <div className="login-field">
                      <input
                        className="form-field form-field--input"
                        type="password"
                        ref={passwordRef}
                        placeholder=" "
                        value={password}
                        onChange={handleLoginInputChange(setPassword)}
                        required
                      />
                      <label>Password</label>
                    </div>
                    <button
                      type="button"
                      className="m-reset-password-btn"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      onClick={() => {
                        setTab("forgot");
                        resetForgotFlow();
                      }}
                    >
                      Forgot your password?
                    </button>
                    <button className="m-button m-button--primary" type="submit" disabled={auth.loading}>
                      {auth.loading ? "Signing in…" : "Sign In"}
                    </button>
                  </form>
                </div>
              )}

              {/* ── New Customer ── */}
              <div className="m-sign-up">
                  <p className="login-signup__eyebrow">YOUR STYLE, YOUR STORY</p>
                  <img className="login-signup__logo" src={logo} alt="SMal Couture" />
                  <h3>New customer?</h3>
                  <p>Create an account for early sale access, tailored new arrivals and a smoother shopping experience.</p>
                  <button
                    type="button"
                    className="m-button m-button--primary"
                    onClick={() => navigate("/register")}
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
      </main>
    </>
  );
};

export default Login;
