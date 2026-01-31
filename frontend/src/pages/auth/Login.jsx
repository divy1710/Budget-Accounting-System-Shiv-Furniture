import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
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

        // Redirect based on role
        if (data.user.role === "admin") {
          navigate("/");
        } else {
          // Also store in customerPortal for portal pages
          localStorage.setItem("customerPortal", JSON.stringify(data.user));
          navigate("/customer/dashboard");
        }
      } else {
        setError(data.error || "Invalid Login Id or Password");
      }
    } catch (err) {
      // Fallback for demo when server is unavailable
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

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Shiv Furniture</h1>
          <p className="text-gray-400 mt-1">Budget Accounting System</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white text-center mb-6">
            Login Page
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Login id
              </label>
              <input
                type="text"
                value={formData.loginId}
                onChange={(e) =>
                  setFormData({ ...formData, loginId: e.target.value })
                }
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your login id"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-medium hover:bg-gray-600 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-blue-400 text-sm">
              <Link to="/forgot-password" className="hover:underline">
                Forget Password ?
              </Link>
              <span className="text-gray-500 mx-2">|</span>
              <Link to="/signup" className="hover:underline">
                Sign Up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
