import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

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

    // Update validation
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
          role: "portal", // Customer signup always creates portal user
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

  const ValidationItem = ({ valid, text }) => (
    <div
      className={`flex items-center gap-2 text-xs ${valid ? "text-green-400" : "text-gray-500"}`}
    >
      {valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
      {text}
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-400" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Account Created!
          </h2>
          <p className="text-gray-400 mb-4">
            Your account has been created successfully. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-3">
            <Building2 className="text-white" size={28} />
          </div>
          <h1 className="text-xl font-bold text-white">Shiv Furniture</h1>
        </div>

        {/* Signup Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white text-center mb-6">
            Sign up page
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Login id
              </label>
              <input
                type="text"
                value={formData.loginId}
                onChange={(e) => handleChange("loginId", e.target.value)}
                required
                className={`w-full px-4 py-2.5 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none ${
                  formData.loginId && !validation.loginIdLength
                    ? "border-red-500"
                    : formData.loginId && validation.loginIdLength
                      ? "border-green-500"
                      : "border-gray-600"
                }`}
                placeholder="6-12 characters"
              />
              {formData.loginId && !validation.loginIdLength && (
                <p className="text-red-400 text-xs mt-1">
                  Login ID must be 6-12 characters
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Email id
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 pr-12"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Re-Enter password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                required
                className={`w-full px-4 py-2.5 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none ${
                  formData.confirmPassword && !validation.passwordsMatch
                    ? "border-red-500"
                    : formData.confirmPassword && validation.passwordsMatch
                      ? "border-green-500"
                      : "border-gray-600"
                }`}
                placeholder="Re-enter your password"
              />
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-gray-700/50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-400 mb-2">
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

            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-medium hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:underline">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
