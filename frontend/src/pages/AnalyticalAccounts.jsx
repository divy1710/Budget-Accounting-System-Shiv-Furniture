import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Archive, RotateCcw, FolderTree } from "lucide-react";
import { analyticalAccountsApi } from "../services/api";

export default function AnalyticalAccounts() {
  const navigate = useNavigate();
  const [view, setView] = useState("list"); // list, form
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, [showArchived]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await analyticalAccountsApi.getAll();
      const filtered = showArchived
        ? res.data.filter((a) => !a.isActive)
        : res.data.filter((a) => a.isActive);
      setAccounts(filtered);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingAccount(null);
    setFormData({
      code: "",
      name: "",
      description: "",
    });
    setView("form");
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      description: account.description || "",
    });
    setView("form");
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Please enter an analytic name");
      return;
    }

    try {
      const data = {
        code:
          formData.code ||
          formData.name.toUpperCase().replace(/\s+/g, "-").substring(0, 10),
        name: formData.name,
        description: formData.description,
      };

      if (editingAccount) {
        await analyticalAccountsApi.update(editingAccount.id, data);
      } else {
        await analyticalAccountsApi.create(data);
      }

      setView("list");
      setEditingAccount(null);
      fetchAccounts();
    } catch (error) {
      console.error("Failed to save account:", error);
      alert(
        "Failed to save: " + (error.response?.data?.error || error.message),
      );
    }
  };

  const handleArchive = async (account) => {
    if (
      window.confirm(
        `Are you sure you want to ${account.isActive ? "archive" : "restore"} "${account.name}"?`,
      )
    ) {
      try {
        await analyticalAccountsApi.update(account.id, {
          isActive: !account.isActive,
        });
        fetchAccounts();
      } catch (error) {
        console.error("Failed to update account:", error);
      }
    }
  };

  // List View
  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Analytics Master
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your analytical accounts for cost tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showArchived
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Archive size={18} />
              {showArchived ? "Showing Archived" : "View Archived"}
            </button>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg shadow-teal-200"
            >
              <Plus size={18} /> New Analytic
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Analytics List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Header Row */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Analytic Name
                </span>
              </div>

              {/* Account Rows */}
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/30 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                      <FolderTree size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {account.name}
                      </p>
                      <p className="text-xs text-gray-400">{account.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleArchive(account)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title={account.isActive ? "Archive" : "Restore"}
                    >
                      {account.isActive ? (
                        <Archive size={16} />
                      ) : (
                        <RotateCcw size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty rows for visual effect */}
              {accounts.length < 8 &&
                [...Array(8 - accounts.length)].map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="px-6 py-4 border-b border-gray-50"
                  >
                    <span className="text-gray-200">—</span>
                  </div>
                ))}
            </div>
          )}

          {accounts.length === 0 && !loading && (
            <div className="text-center py-16">
              <FolderTree size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">
                {showArchived ? "No archived analytics" : "No analytics found"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Create your first analytic account to start tracking costs
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Analytics</p>
            <p className="text-2xl font-bold text-gray-800">
              {accounts.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-teal-600">
              {accounts.filter((a) => a.isActive).length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setView("list")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {editingAccount ? "Edit Analytic" : "New Analytic"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {editingAccount
              ? "Update analytic information"
              : "Create a new analytical account"}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Analytic Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analytic Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
              placeholder="e.g., Deepawali, Marriage Session, Furniture Expo 2026"
            />
          </div>

          {/* Code (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code{" "}
              <span className="text-gray-400 text-xs">
                (auto-generated if empty)
              </span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all font-mono"
              placeholder="AUTO-CODE"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all resize-none"
              rows={3}
              placeholder="Optional description..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setView("list")}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg shadow-teal-200 font-medium"
          >
            {editingAccount ? "Update" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
