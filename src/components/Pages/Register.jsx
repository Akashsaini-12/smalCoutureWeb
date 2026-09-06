import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  registerThunk,
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
  const [localError, setLocalError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showPasswordMismatch, setShowPasswordMismatch] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const passwordRef = useRef(null);

  // Redirect after successful verification / login
  useEffect(() => {
    if (auth.user && auth.token) navigate("/");
  }, [auth.user, auth.token, navigate]);

  const handleRegister = (e) => {
    e.preventDefault();
    setLocalError("");
    setShowPasswordMismatch(false);

    if (password !== confirmPassword) {
      setShowPasswordMismatch(true);
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setLocalError("Password must contain at least one letter and one number");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setPhoneTouched(true);
      setLocalError("Phone number must contain exactly 10 digits");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setLocalError("Please enter correct email address");
      return;
    }

    setShowEmailConfirmation(true);
  };

  const confirmRegister = () => {
    setShowEmailConfirmation(false);
    dispatch(registerThunk({ firstName, lastName, email: email.trim(), phone, password }));
  };

  const handleFieldKeyDown = (event) => {
    if (event.key !== "Enter") return;

    const fields = Array.from(event.currentTarget.form.querySelectorAll("input"));
    const currentIndex = fields.indexOf(event.currentTarget);
    const nextField = fields[currentIndex + 1];

    if (nextField) {
      event.preventDefault();
      nextField.focus();
    }
  };

  return (
    <>
      <main id="MainContent" className="register-page" role="main">
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
                  <span className="m-breadcrumb--item-current m-breadcrumb--item">Register</span>
                </div>
              </div>
            </nav>
          </div>

          <div className="m-register-form">
            <div className="m-register-form__wrapper">

              {/* ── Registration Form ── */}
              <>
                  <div className="register-form__intro">
                    <h2>Create your account</h2>
                    <p>Join SMal Couture for a more personal shopping experience.</p>
                  </div>
                  {(localError || auth.error) && (
                    <p className="register-form__error">{localError || auth.error}</p>
                  )}
                  <form onSubmit={handleRegister}>
                    <div className="register-field">
                      <input onKeyDown={handleFieldKeyDown} className="form-field form-field--input" type="text" placeholder=" " value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                      <label>First Name</label>
                    </div>
                    <div className="register-field">
                      <input onKeyDown={handleFieldKeyDown} className="form-field form-field--input" type="text" placeholder=" " value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      <label>Last Name</label>
                    </div>
                    <div className="register-field">
                      <input
                        className="form-field form-field--input"
                        type="tel"
                        onKeyDown={handleFieldKeyDown}
                        placeholder=" "
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        onFocus={() => setPhoneTouched(false)}
                        onBlur={() => setPhoneTouched(true)}
                        minLength={10}
                        maxLength={10}
                        pattern="[0-9]{10}"
                        inputMode="numeric"
                        title="Enter exactly 10 digits"
                        required
                      />
                      <label>Phone Number</label>
                    </div>
                    {phoneTouched && phone.length > 0 && phone.length !== 10 && (
                      <p className="register-phone__hint">Please enter correct phone number</p>
                    )}
                    <div className="register-field">
                      <input
                        className="form-field form-field--input"
                        type="email"
                        onKeyDown={handleFieldKeyDown}
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setEmailTouched(false)}
                        onBlur={() => setEmailTouched(true)}
                        pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
                        title="Enter a valid email address, for example name@gmail.com"
                      />
                      <label>Email (Optional)</label>
                      <button
                        type="button"
                        className="register-email__skip"
                        onClick={() => {
                          setEmail("");
                          setEmailTouched(false);
                          passwordRef.current?.focus();
                        }}
                      >
                        Skip
                      </button>
                    </div>
                    {emailTouched && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) && (
                      <p className="register-email__hint">Please enter correct email address</p>
                    )}
                    <div className="register-field">
                      <input onKeyDown={handleFieldKeyDown} ref={passwordRef} className="form-field form-field--input" type="password" placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} pattern="(?=.*[A-Za-z])(?=.*\d).+" title="Password must contain at least one letter and one number" required />
                      <label>Password</label>
                    </div>
                    <div className="register-field">
                      <input onKeyDown={handleFieldKeyDown} className="form-field form-field--input" type="password" placeholder=" " value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} pattern="(?=.*[A-Za-z])(?=.*\d).+" title="Password must contain at least one letter and one number" required />
                      <label>Confirm Password</label>
                    </div>
                    {showPasswordMismatch && password !== confirmPassword && (
                      <p className="register-password__hint">Passwords do not match</p>
                    )}
                    <button className="m-button m-button--primary m:w-full" type="submit" disabled={auth.loading}>
                      {auth.loading ? "Creating account…" : "Create account"}
                    </button>
                    <p className="register-form__login">
                      Already have an account?{" "}
                      <button type="button" onClick={() => navigate("/login")}>Login here</button>
                    </p>
                  </form>
              </>

            </div>
          </div>
        </div>
      </main>
      {showEmailConfirmation && (
        <div className="register-confirmation__backdrop" role="presentation">
          <div
            className="register-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-confirmation-title"
          >
            <h2 id="register-confirmation-title">Confirm your mobile number</h2>
            <p>Please confirm that this mobile number is correct:</p>
            <strong>{phone}</strong>
            <div className="register-confirmation__actions">
              <button
                type="button"
                className="register-confirmation__cancel"
                onClick={() => setShowEmailConfirmation(false)}
              >
                Edit number
              </button>
              <button
                type="button"
                className="register-confirmation__confirm"
                onClick={confirmRegister}
                disabled={auth.loading}
              >
                {auth.loading ? "Creating account…" : "Confirm & Register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Register;
