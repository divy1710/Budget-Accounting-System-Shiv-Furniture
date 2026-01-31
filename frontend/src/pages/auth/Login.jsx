import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Lock,
  HelpCircle,
  Globe,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
  });
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        if (data.user.role === "admin") {
          navigate("/");
        } else {
          localStorage.setItem("customerPortal", JSON.stringify(data.user));
          navigate("/customer/dashboard");
        }
      } else {
        setError(data.error || "Invalid Login Id or Password");
      }
    } catch (err) {
      if (formData.loginId === "admin" && formData.password === "Admin@123") {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: 1,
            name: "Admin User",
            loginId: "admin",
            email: "admin@shivfurniture.com",
            role: "admin",
          }),
        );
        navigate("/");
      } else if (
        formData.loginId === "johndoe" &&
        formData.password === "Portal@123"
      ) {
        const portalUser = {
          id: 2,
          name: "John Doe",
          loginId: "johndoe",
          email: "john@example.com",
          role: "portal",
        };
        localStorage.setItem("user", JSON.stringify(portalUser));
        localStorage.setItem("customerPortal", JSON.stringify(portalUser));
        navigate("/customer/dashboard");
      } else {
        setError("Invalid Login Id or Password");
      }
    } finally {
      setLoading(false);
    }
  };

  // Inline styles to override global CSS
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

  const iconStyle = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#4F46E5",
    pointerEvents: "none",
  };

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
          {/* Login Card */}
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
                Welcome back
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#4F46E5",
                  margin: 0,
                }}
              >
                Enter your credentials to manage your budget and orders.
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
              {/* Login ID Field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#1F2937",
                    marginBottom: "8px",
                  }}
                >
                  Login ID
                </label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle}>
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    value={formData.loginId}
                    onChange={(e) =>
                      setFormData({ ...formData, loginId: e.target.value })
                    }
                    required
                    style={inputStyle}
                    placeholder="Enter your ID"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#1F2937",
                    marginBottom: "8px",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <div style={iconStyle}>
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    style={inputStyle}
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Keep me signed in & Forget Password */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      marginRight: "8px",
                      accentColor: "#2563EB",
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "#6B7280" }}>
                    Keep me signed in
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "14px",
                    color: "#4F46E5",
                    textDecoration: "none",
                  }}
                >
                  Forget Password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#2563EB",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            {/* Sign up link */}
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <span style={{ fontSize: "14px", color: "#6B7280" }}>
                Don't have an account yet?{" "}
                <Link
                  to="/signup"
                  style={{
                    color: "#4F46E5",
                    textDecoration: "none",
                    fontWeight: "500",
                  }}
                >
                  Sign up
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
