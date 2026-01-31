import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Search,
  Users,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    loginId: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "portal",
  });
  const [error, setError] = useState("");
  const [validation, setValidation] = useState({
    loginIdLength: false,
    passwordLength: false,
    passwordLower: false,
    passwordUpper: false,
    passwordSpecial: false,
    passwordsMatch: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Demo data
      setUsers([
        {
          id: 1,
          name: "Admin User",
          loginId: "admin",
          email: "admin@shivfurniture.com",
          role: "admin",
          isActive: true,
        },
        {
          id: 2,
          name: "John Doe",
          loginId: "johndoe",
          email: "john@example.com",
          role: "portal",
          isActive: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const validateLoginId = (value) => value.length >= 6 && value.length <= 12;

  const validatePassword = (password, confirmPassword) => ({
    passwordLength: password.length >= 8,
    passwordLower: /[a-z]/.test(password),
    passwordUpper: /[A-Z]/.test(password),
    passwordSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    passwordsMatch: password === confirmPassword && password.length > 0,
  });

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
    const baseValid =
      formData.name.trim() &&
      validation.loginIdLength &&
      formData.email.includes("@") &&
      formData.role;

    if (editingUser) {
      // For editing, password is optional
      if (formData.password) {
        return (
          baseValid &&
          validation.passwordLength &&
          validation.passwordLower &&
          validation.passwordUpper &&
          validation.passwordSpecial &&
          validation.passwordsMatch
        );
      }
      return baseValid;
    }

    // For new user, password is required
    return (
      baseValid &&
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
      setError("Please fix the validation errors");
      return;
    }

    try {
      const url = editingUser
        ? `http://localhost:5000/api/users/${editingUser.id}`
        : "http://localhost:5000/api/users";

      const method = editingUser ? "PUT" : "POST";

      const payload = {
        name: formData.name,
        loginId: formData.loginId,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save user");
      }
    } catch (err) {
      setError("Unable to save user. Please try again.");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      loginId: user.loginId,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
    });
    setValidation({
      loginIdLength: true,
      passwordLength: true,
      passwordLower: true,
      passwordUpper: true,
      passwordSpecial: true,
      passwordsMatch: true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      loginId: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "portal",
    });
    setValidation({
      loginIdLength: false,
      passwordLength: false,
      passwordLower: false,
      passwordUpper: false,
      passwordSpecial: false,
      passwordsMatch: false,
    });
    setError("");
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.loginId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const ValidationItem = ({ valid, text }) => (
    <div
      className={`flex items-center gap-2 text-xs ${valid ? "text-green-600" : "text-gray-400"}`}
    >
      {valid ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {text}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Create and manage system users</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Create User
        </button>
      </div>

      {/* Role Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Shield className="text-purple-600" size={24} />
            <div>
              <h3 className="font-semibold text-purple-900">Admin</h3>
              <p className="text-purple-700 text-sm">
                All access rights - Full system control
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="text-green-600" size={24} />
            <div>
              <h3 className="font-semibold text-green-900">Portal User</h3>
              <p className="text-green-700 text-sm">
                Can view invoices/orders/bills - paid and unpaid
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Login ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <Users className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-lg font-medium">No users found</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.role === "admin"
                            ? "bg-purple-100"
                            : "bg-green-100"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <Shield className="text-purple-600" size={18} />
                        ) : (
                          <UserCheck className="text-green-600" size={18} />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {user.loginId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "Portal"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingUser ? "Edit User" : "Create User"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full name"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="portal">Portal</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.role === "admin"
                      ? "Full system access"
                      : "Customer/Vendor portal access"}
                  </p>
                </div>

                {/* Login ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login id *
                  </label>
                  <input
                    type="text"
                    value={formData.loginId}
                    onChange={(e) => handleChange("loginId", e.target.value)}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formData.loginId && !validation.loginIdLength
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="6-12 characters"
                  />
                  {formData.loginId && !validation.loginIdLength && (
                    <p className="text-red-500 text-xs mt-1">
                      Must be 6-12 characters
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingUser ? "(leave blank to keep)" : "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      required={!editingUser}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Min 8 chars with special"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email id *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="user@example.com"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Re-Enter password {editingUser ? "" : "*"}
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    required={!editingUser && formData.password.length > 0}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formData.confirmPassword && !validation.passwordsMatch
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {/* Password Validation */}
              {formData.password && (
                <div className="mt-4 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Password requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <ValidationItem
                      valid={validation.passwordLength}
                      text="At least 8 characters"
                    />
                    <ValidationItem
                      valid={validation.passwordLower}
                      text="Lowercase letter"
                    />
                    <ValidationItem
                      valid={validation.passwordUpper}
                      text="Uppercase letter"
                    />
                    <ValidationItem
                      valid={validation.passwordSpecial}
                      text="Special character"
                    />
                    <ValidationItem
                      valid={validation.passwordsMatch}
                      text="Passwords match"
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
