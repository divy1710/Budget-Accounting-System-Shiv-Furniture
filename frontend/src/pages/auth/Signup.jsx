import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowRight,
  HelpCircle,
  Globe,
  Shield,
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    loginId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation states
  const [validation, setValidation] = useState({
    loginIdLength: false,
    passwordLength: false,
    passwordLower: false,
    passwordUpper: false,
    passwordSpecial: false,
    passwordsMatch: false,
  });

  const validateLoginId = (value) => {
    return value.length >= 6 && value.length <= 12;
  };

  const validatePassword = (password, confirmPassword) => {
    return {
      passwordLength: password.length >= 8,
      passwordLower: /[a-z]/.test(password),
      passwordUpper: /[A-Z]/.test(password),
      passwordSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0,
    };
  };

  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (field === "loginId") {
      setValidation((prev) => ({
        ...prev,
        loginIdLength: validateLoginId(value),
      }));
    }
    if (field === "password" || field === "confirmPassword") {
      const passwordValidation = validatePassword(
        field === "password" ? value : formData.password,
        field === "confirmPassword" ? value : formData.confirmPassword,
      );
      setValidation((prev) => ({ ...prev, ...passwordValidation }));
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      validation.loginIdLength &&
      formData.email.includes("@") &&
      validation.passwordLength &&
      validation.passwordLower &&
      validation.passwordUpper &&
      validation.passwordSpecial &&
      validation.passwordsMatch
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isFormValid()) {
      setError("Please fix the validation errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          loginId: formData.loginId,
          email: formData.email,
          password: formData.password,
          role: "portal",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Inline styles
  const inputStyle = {
    width: "100%",
    padding: "14px 14px 14px 44px",
    backgroundColor: "#EEF2FF",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    color: "#1F2937",
    outline: "none",
    boxSizing: "border-box",
  };

  const inputStyleWithRightPadding = {
    ...inputStyle,
    paddingRight: "44px",
  };

  const iconStyle = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#4F46E5",
    pointerEvents: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: "8px",
  };

  const ValidationItem = ({ valid, text }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        color: valid ? "#22C55E" : "#9CA3AF",
      }}
    >
      {valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
      {text}
    </div>
  );

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F3F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
            padding: "40px",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#DCFCE7",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle style={{ color: "#22C55E" }} size={32} />
          </div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1F2937",
              marginBottom: "8px",
            }}
          >
            Account Created!
          </h2>
          <p style={{ color: "#6B7280", marginBottom: "16px" }}>
            Your account has been created successfully. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F3F4F6",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "#2563EB",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            SF
          </div>
          <span
            style={{ fontWeight: "600", color: "#1F2937", fontSize: "16px" }}
          >
            Shiv Furniture
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Signup Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
              padding: "40px",
              margin: 0,
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#1F2937",
                  marginBottom: "8px",
                  margin: "0 0 8px 0",
                }}
              >
                Create Account
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#4F46E5",
                  margin: 0,
                }}
              >
                Sign up to manage your budget and orders.
              </p>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name Field */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle}>
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    style={inputStyle}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Login ID Field */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Login ID</label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle}>
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    value={formData.loginId}
                    onChange={(e) => handleChange("loginId", e.target.value)}
                    required
                    style={{
                      ...inputStyle,
                      border: formData.loginId
                        ? validation.loginIdLength
                          ? "2px solid #22C55E"
                          : "2px solid #EF4444"
                        : "none",
                    }}
                    placeholder="6-12 characters"
                  />
                </div>
                {formData.loginId && !validation.loginIdLength && (
                  <p
                    style={{
                      color: "#EF4444",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    Login ID must be 6-12 characters
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Email</label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle}>
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                    style={inputStyle}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle}>
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    required
                    style={inputStyleWithRightPadding}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#6B7280",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle}>
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    required
                    style={{
                      ...inputStyle,
                      border: formData.confirmPassword
                        ? validation.passwordsMatch
                          ? "2px solid #22C55E"
                          : "2px solid #EF4444"
                        : "none",
                    }}
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6B7280",
                      marginBottom: "8px",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Password requirements:
                  </p>
                  <ValidationItem
                    valid={validation.passwordLength}
                    text="At least 8 characters"
                  />
                  <ValidationItem
                    valid={validation.passwordLower}
                    text="Contains lowercase letter"
                  />
                  <ValidationItem
                    valid={validation.passwordUpper}
                    text="Contains uppercase letter"
                  />
                  <ValidationItem
                    valid={validation.passwordSpecial}
                    text="Contains special character"
                  />
                  <ValidationItem
                    valid={validation.passwordsMatch}
                    text="Passwords match"
                  />
                </div>
              )}

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#2563EB",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: loading || !isFormValid() ? "not-allowed" : "pointer",
                  opacity: loading || !isFormValid() ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {loading ? "Creating account..." : "Sign Up"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            {/* Sign in link */}
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <span style={{ fontSize: "14px", color: "#6B7280" }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#4F46E5",
                    textDecoration: "none",
                    fontWeight: "500",
                  }}
                >
                  Sign in
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <button
            style={{
              width: "44px",
              height: "44px",
              backgroundColor: "#4F46E5",
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
            }}
          >
            <HelpCircle size={20} />
          </button>
          <button
            style={{
              width: "44px",
              height: "44px",
              backgroundColor: "#4F46E5",
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Globe size={20} />
          </button>
          <button
            style={{
              width: "44px",
              height: "44px",
              backgroundColor: "#4F46E5",
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Shield size={20} />
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
          © 2024 Shiv Furniture Private Ltd. All rights reserved. Secure Cloud
          ERP.
        </p>
      </div>
    </div>
  );
}
