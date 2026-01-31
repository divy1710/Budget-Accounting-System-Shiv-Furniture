import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Wallet } from "lucide-react";
import { budgetsApi, analyticalAccountsApi } from "../services/api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    analyticalAccountId: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    budgetedAmount: "",
  });

  useEffect(() => {
    fetchData();
  }, [yearFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, accountsRes] = await Promise.all([
        budgetsApi.getAll({ year: yearFilter }),
        analyticalAccountsApi.getAll(),
      ]);
      setBudgets(budgetsRes.data);
      setAccounts(accountsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        analyticalAccountId: parseInt(formData.analyticalAccountId),
        budgetedAmount: parseFloat(formData.budgetedAmount),
      };
      if (editingBudget) {
        await budgetsApi.update(editingBudget.id, data);
      } else {
        await budgetsApi.create(data);
      }
      setShowModal(false);
      setEditingBudget(null);
      setFormData({
        analyticalAccountId: "",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        budgetedAmount: "",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to save budget:", error);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      analyticalAccountId: budget.analyticalAccountId.toString(),
      year: budget.year,
      month: budget.month,
      budgetedAmount: budget.budgetedAmount.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      try {
        await budgetsApi.delete(id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete budget:", error);
      }
    }
  };

  const getUtilizationColor = (actual, budget) => {
    if (budget === 0) return "bg-gray-200";
    const percent = (actual / budget) * 100;
    if (percent >= 100) return "bg-red-500";
    if (percent >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Budgets</h1>
        <div className="flex items-center gap-4">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingBudget(null);
              setFormData({
                analyticalAccountId: "",
                year: yearFilter,
                month: new Date().getMonth() + 1,
                budgetedAmount: "",
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> Add Budget
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budgeted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map((budget) => {
                  const budgeted = parseFloat(budget.budgetedAmount) || 0;
                  const actual = parseFloat(budget.actualAmount) || 0;
                  const remaining = budgeted - actual;
                  const utilization =
                    budgeted > 0 ? (actual / budgeted) * 100 : 0;

                  return (
                    <tr key={budget.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Wallet size={16} className="text-amber-600" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {budget.analyticalAccount?.code}
                            </span>
                            <span className="text-gray-500 ml-2">
                              {budget.analyticalAccount?.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">
                        {months[budget.month - 1]} {budget.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                        {formatCurrency(budgeted)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                        {formatCurrency(actual)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-right font-medium ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(remaining)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getUtilizationColor(actual, budgeted)}`}
                              style={{
                                width: `${Math.min(utilization, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {utilization.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleEdit(budget)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {budgets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No budgets found for {yearFilter}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingBudget ? "Edit Budget" : "Add Budget"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Analytical Account *
                </label>
                <select
                  required
                  value={formData.analyticalAccountId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      analyticalAccountId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <select
                    required
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[2023, 2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month *
                  </label>
                  <select
                    required
                    value={formData.month}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        month: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budgeted Amount *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.budgetedAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetedAmount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
