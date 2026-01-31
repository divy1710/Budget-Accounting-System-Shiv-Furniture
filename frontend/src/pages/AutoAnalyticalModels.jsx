import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Archive,
  RotateCcw,
  Settings,
  Check,
  X,
  Clock,
} from "lucide-react";
import {
  autoAnalyticalApi,
  productsApi,
  analyticalAccountsApi,
  contactsApi,
  categoriesApi,
} from "../services/api";

const PARTNER_TAGS = ["B2B", "MSME", "Retailer", "Local"];

export default function AutoAnalyticalModels() {
  const navigate = useNavigate();
  const [view, setView] = useState("list"); // list, form
  const [models, setModels] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // all, DRAFT, CONFIRMED, CANCELLED
  const [formData, setFormData] = useState({
    partnerTag: "",
    partnerId: "",
    categoryId: "",
    productId: "",
    analyticalAccountId: "",
    status: "DRAFT",
  });

  useEffect(() => {
    fetchData();
  }, [showArchived, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modelsRes, productsRes, accountsRes, contactsRes, categoriesRes] =
        await Promise.all([
          autoAnalyticalApi.getAll(),
          productsApi.getAll(),
          analyticalAccountsApi.getAll(),
          contactsApi.getAll(),
          categoriesApi.getAll(),
        ]);

      let filtered = modelsRes.data;
      if (showArchived) {
        filtered = filtered.filter((m) => !m.isActive);
      } else {
        filtered = filtered.filter((m) => m.isActive);
      }
      if (statusFilter !== "all") {
        filtered = filtered.filter((m) => m.status === statusFilter);
      }

      setModels(filtered);
      setProducts(productsRes.data.filter((p) => p.isActive));
      setAccounts(accountsRes.data.filter((a) => a.isActive));
      setContacts(contactsRes.data.filter((c) => c.isActive));
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingModel(null);
    setFormData({
      partnerTag: "",
      partnerId: "",
      categoryId: "",
      productId: "",
      analyticalAccountId: "",
      status: "DRAFT",
    });
    setView("form");
  };

  const handleEdit = (model) => {
    setEditingModel(model);
    setFormData({
      partnerTag: model.partnerTag || "",
      partnerId: model.partnerId?.toString() || "",
      categoryId: model.categoryId?.toString() || "",
      productId: model.productId?.toString() || "",
      analyticalAccountId: model.analyticalAccountId?.toString() || "",
      status: model.status || "DRAFT",
    });
    setView("form");
  };

  const handleSubmit = async () => {
    if (!formData.analyticalAccountId) {
      alert("Please select an Analytic to Apply");
      return;
    }

    try {
      const data = {
        partnerTag: formData.partnerTag || null,
        partnerId: formData.partnerId ? parseInt(formData.partnerId) : null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        productId: formData.productId ? parseInt(formData.productId) : null,
        analyticalAccountId: parseInt(formData.analyticalAccountId),
        status: formData.status,
      };

      if (editingModel) {
        await autoAnalyticalApi.update(editingModel.id, data);
      } else {
        await autoAnalyticalApi.create(data);
      }

      setView("list");
      setEditingModel(null);
      fetchData();
    } catch (error) {
      console.error("Failed to save model:", error);
      alert(
        "Failed to save: " + (error.response?.data?.error || error.message),
      );
    }
  };

  const handleArchive = async (model) => {
    if (
      window.confirm(
        `Are you sure you want to ${model.isActive ? "archive" : "restore"} this model?`,
      )
    ) {
      try {
        await autoAnalyticalApi.update(model.id, {
          ...model,
          isActive: !model.isActive,
        });
        fetchData();
      } catch (error) {
        console.error("Failed to update model:", error);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <Check size={12} /> Confirmed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <X size={12} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock size={12} /> Draft
          </span>
        );
    }
  };

  const getCriteriaCount = (model) => {
    let count = 0;
    if (model.partnerTag) count++;
    if (model.partnerId) count++;
    if (model.categoryId) count++;
    if (model.productId) count++;
    return count;
  };

  // List View
  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Auto Analytical Model
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Auto-apply analytics based on matching criteria
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
              Archived
            </button>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Plus size={18} /> New Model
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
          {["all", "DRAFT", "CONFIRMED", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {status === "all"
                ? "All"
                : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Partner Tag
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Analytic
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {models.map((model) => (
                    <tr
                      key={model.id}
                      className="hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        {getStatusBadge(model.status)}
                      </td>
                      <td className="px-6 py-4">
                        {model.partnerTag ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {model.partnerTag}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {model.partner?.name || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {model.category?.name || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {model.product?.name || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                          {model.analyticalAccount?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            getCriteriaCount(model) >= 3
                              ? "bg-green-100 text-green-700"
                              : getCriteriaCount(model) >= 2
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getCriteriaCount(model)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(model)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleArchive(model)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title={model.isActive ? "Archive" : "Restore"}
                          >
                            {model.isActive ? (
                              <Archive size={16} />
                            ) : (
                              <RotateCcw size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {models.length === 0 && (
                <div className="text-center py-16">
                  <Settings size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No models found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Create a model to auto-apply analytics
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="font-semibold text-indigo-800 mb-3">How it works</h3>
          <ul className="space-y-2 text-sm text-indigo-700">
            <li>
              • The model is applied if <strong>any one field</strong> matches
              the transaction line.
            </li>
            <li>
              • If multiple fields match, the model becomes{" "}
              <strong>more specific</strong> and takes priority.
            </li>
            <li>
              • Models with fewer matched fields are more generic, while more
              matches make them stricter.
            </li>
            <li>
              • This allows flexible yet prioritized automatic analytic model.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="max-w-2xl mx-auto">
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
            {editingModel ? "Edit Model" : "New Auto Analytical Model"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Define criteria to auto-apply analytical accounts
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 mr-2">
              Status:
            </span>
            {["DRAFT", "CONFIRMED", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => setFormData({ ...formData, status })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.status === status
                    ? status === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Matching Criteria */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider">
              Matching Criteria
            </h3>

            <div className="grid grid-cols-2 gap-6">
              {/* Partner Tag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner Tag
                </label>
                <select
                  value={formData.partnerTag}
                  onChange={(e) =>
                    setFormData({ ...formData, partnerTag: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                >
                  <option value="">Many to One ( from list )</option>
                  {PARTNER_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              {/* Partner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partner
                </label>
                <select
                  value={formData.partnerId}
                  onChange={(e) =>
                    setFormData({ ...formData, partnerId: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                >
                  <option value="">Many to One ( from list )</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                >
                  <option value="">Many to One ( from list )</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                >
                  <option value="">Many to One ( from list )</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Auto Apply Section */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider">
              Auto Apply Analytical Model
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analyticals to Apply? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.analyticalAccountId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    analyticalAccountId: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all bg-teal-50"
              >
                <option value="">
                  Many to One ( from analytical master list )
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-teal-600 mt-2">
                Select the analytical account to apply when criteria matches
              </p>
            </div>
          </div>

          {/* Priority Preview */}
          {(formData.partnerTag ||
            formData.partnerId ||
            formData.categoryId ||
            formData.productId) && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">
                    Priority Score
                  </p>
                  <p className="text-xs text-indigo-400 mt-0.5">
                    Based on{" "}
                    {
                      [
                        formData.partnerTag,
                        formData.partnerId,
                        formData.categoryId,
                        formData.productId,
                      ].filter(Boolean).length
                    }{" "}
                    matching criteria
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-700">
                    {
                      [
                        formData.partnerTag,
                        formData.partnerId,
                        formData.categoryId,
                        formData.productId,
                      ].filter(Boolean).length
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
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
            className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 font-medium"
          >
            {editingModel ? "Update" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
