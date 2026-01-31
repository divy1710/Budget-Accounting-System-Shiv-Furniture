import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  RefreshCw,
  Archive,
  ArrowLeft,
  Eye,
  X,
  Link,
} from "lucide-react";
import { budgetsApi, analyticalAccountsApi } from "../services/api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateShort = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Mini Pie Chart Component
const MiniPieChart = ({ achieved, total }) => {
  const percent = total > 0 ? (achieved / total) * 100 : 0;
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="32" height="32" className="transform -rotate-90">
        {/* Background circle (Balance - red) */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke="#ef4444"
          strokeWidth="4"
        />
        {/* Achieved circle (green) */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth="4"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// Pie Chart Modal
const PieChartModal = ({ budget, onClose }) => {
  if (!budget) return null;

  const totalBudgeted =
    budget.lines?.reduce((sum, l) => sum + Number(l.budgetedAmount || 0), 0) ||
    0;
  const totalAchieved =
    budget.lines?.reduce((sum, l) => sum + Number(l.achievedAmount || 0), 0) ||
    0;
  const balance = totalBudgeted - totalAchieved;
  const achievedPercent =
    totalBudgeted > 0 ? (totalAchieved / totalBudgeted) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Budget Overview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-center mb-4">
          <div className="text-lg font-medium text-gray-700">{budget.name}</div>
          <div className="text-sm text-gray-500">
            {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              {/* Background circle (Balance - red) */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#ef4444"
                strokeWidth="30"
              />
              {/* Achieved circle (green/teal) */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="30"
                strokeDasharray={`${(achievedPercent / 100) * 2 * Math.PI * 80} ${2 * Math.PI * 80}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {achievedPercent.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Achieved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-teal-500"></div>
            <div>
              <div className="text-sm font-medium text-gray-700">Achieved</div>
              <div className="text-sm text-gray-500">
                {formatCurrency(totalAchieved)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <div>
              <div className="text-sm font-medium text-gray-700">Balance</div>
              <div className="text-sm text-gray-500">
                {formatCurrency(balance)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Transactions Modal (for viewing achieved amount details)
const TransactionsModal = ({ line, budget, onClose }) => {
  if (!line || !budget) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
            <div className="text-sm text-gray-500">
              {line.analyticalAccount?.name} ({line.type}) -{" "}
              {formatDateShort(budget.startDate)} to{" "}
              {formatDateShort(budget.endDate)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Document
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Placeholder - In real implementation, this would fetch actual transactions */}
              <tr>
                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                  <div className="text-sm">
                    Achieved Amount:{" "}
                    <span className="font-semibold text-green-600">
                      {formatCurrency(line.achievedAmount || 0)}
                    </span>
                  </div>
                  <div className="text-xs mt-1 text-gray-400">
                    (Computed from{" "}
                    {line.type === "INCOME" ? "Sales Invoices" : "Vendor Bills"}{" "}
                    within budget period)
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <strong>Note:</strong> Achieved amount is calculated from all
          confirmed{" "}
          {line.type === "INCOME"
            ? "Sales Orders / Customer Invoices"
            : "Purchase Orders / Vendor Bills"}
          with this analytical account within the budget period.
        </div>
      </div>
    </div>
  );
};

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // View modes: 'list' | 'form' | 'view'
  const [viewMode, setViewMode] = useState("list");
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);

  // Modals
  const [pieChartBudget, setPieChartBudget] = useState(null);
  const [transactionLine, setTransactionLine] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    lines: [],
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const [budgetsRes, accountsRes] = await Promise.all([
        budgetsApi.getAll(params),
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

  const resetForm = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      lines: [],
    });
    setEditingBudget(null);
  };

  const handleNew = () => {
    resetForm();
    setViewMode("form");
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      startDate: budget.startDate.split("T")[0],
      endDate: budget.endDate.split("T")[0],
      lines: budget.lines.map((l) => ({
        id: l.id,
        analyticalAccountId: l.analyticalAccountId.toString(),
        type: l.type,
        budgetedAmount: Number(l.budgetedAmount).toString(),
      })),
    });
    setViewMode("form");
  };

  const handleView = async (budget) => {
    try {
      setLoading(true);
      const res = await budgetsApi.getById(budget.id);
      setSelectedBudget(res.data);
      setViewMode("view");
    } catch (error) {
      console.error("Failed to fetch budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        lines: formData.lines.map((l) => ({
          analyticalAccountId: parseInt(l.analyticalAccountId),
          type: l.type,
          budgetedAmount: parseFloat(l.budgetedAmount) || 0,
        })),
      };

      if (editingBudget) {
        await budgetsApi.update(editingBudget.id, data);
      } else {
        await budgetsApi.create(data);
      }

      resetForm();
      setViewMode("list");
      fetchData();
    } catch (error) {
      console.error("Failed to save budget:", error);
      alert(
        "Failed to save budget: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  const handleConfirm = async (id) => {
    if (window.confirm("Are you sure you want to confirm this budget?")) {
      try {
        await budgetsApi.confirm(id);
        fetchData();
        if (viewMode === "view") {
          const res = await budgetsApi.getById(id);
          setSelectedBudget(res.data);
        }
      } catch (error) {
        console.error("Failed to confirm budget:", error);
        alert(
          "Failed to confirm: " +
            (error.response?.data?.error || error.message),
        );
      }
    }
  };

  const handleRevise = async (id) => {
    if (window.confirm("Create a revised copy of this budget?")) {
      try {
        const res = await budgetsApi.revise(id);
        fetchData();
        handleEdit(res.data);
      } catch (error) {
        console.error("Failed to revise budget:", error);
        alert(
          "Failed to revise: " + (error.response?.data?.error || error.message),
        );
      }
    }
  };

  const handleArchive = async (id) => {
    if (window.confirm("Are you sure you want to archive this budget?")) {
      try {
        await budgetsApi.archive(id);
        fetchData();
        if (viewMode === "view") {
          const res = await budgetsApi.getById(id);
          setSelectedBudget(res.data);
        }
      } catch (error) {
        console.error("Failed to archive budget:", error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      try {
        await budgetsApi.delete(id);
        fetchData();
        if (viewMode !== "list") {
          setViewMode("list");
        }
      } catch (error) {
        console.error("Failed to delete budget:", error);
      }
    }
  };

  // Navigate to linked budget
  const navigateToBudget = async (budgetId) => {
    try {
      setLoading(true);
      const res = await budgetsApi.getById(budgetId);
      setSelectedBudget(res.data);
    } catch (error) {
      console.error("Failed to fetch budget:", error);
    } finally {
      setLoading(false);
    }
  };

  // Budget Line management
  const addLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { analyticalAccountId: "", type: "EXPENSE", budgetedAmount: "" },
      ],
    });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const removeLine = (index) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  // Calculate totals for a budget
  const calculateTotals = (lines, isConfirmed) => {
    let totalBudgeted = 0;
    let totalAchieved = 0;

    lines.forEach((line) => {
      totalBudgeted += Number(line.budgetedAmount) || 0;
      if (isConfirmed) {
        totalAchieved += Number(line.achievedAmount) || 0;
      }
    });

    return {
      totalBudgeted,
      totalAchieved,
      totalPercent:
        totalBudgeted > 0 ? (totalAchieved / totalBudgeted) * 100 : 0,
      totalToAchieve: totalBudgeted - totalAchieved,
    };
  };

  // Status button styles
  const getStatusButtonStyle = (status, isActive) => {
    const baseStyle =
      "px-4 py-2 text-sm font-medium rounded-lg border transition-colors";
    if (isActive) {
      switch (status) {
        case "DRAFT":
          return `${baseStyle} bg-blue-600 text-white border-blue-600`;
        case "CONFIRMED":
          return `${baseStyle} bg-green-600 text-white border-green-600`;
        case "REVISED":
          return `${baseStyle} bg-orange-500 text-white border-orange-500`;
        case "ARCHIVED":
          return `${baseStyle} bg-gray-500 text-white border-gray-500`;
        default:
          return `${baseStyle} bg-gray-200 text-gray-700 border-gray-200`;
      }
    }
    return `${baseStyle} bg-white text-gray-600 border-gray-300 hover:bg-gray-50`;
  };

  // List View
  const renderListView = () => (
    <div className="space-y-6">
      {/* Header with New Button */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Budget</h1>
          <span className="text-sm text-gray-500">List View</span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleNew}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 font-medium"
        >
          New
        </button>
      </div>

      {/* Budget List Table */}
      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-amber-600">
                    Budget Name
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                    End Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                    Pie Chart
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {budgets.map((budget) => {
                  const totalBudgeted = budget.lines.reduce(
                    (sum, l) => sum + Number(l.budgetedAmount),
                    0,
                  );
                  const totalAchieved = budget.lines.reduce(
                    (sum, l) => sum + Number(l.achievedAmount || 0),
                    0,
                  );

                  return (
                    <tr
                      key={budget.id}
                      className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleView(budget)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-amber-600 hover:underline">
                          {budget.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                        {formatDate(budget.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                        {formatDate(budget.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`font-medium ${
                            budget.status === "CONFIRMED"
                              ? "text-green-600"
                              : budget.status === "DRAFT"
                                ? "text-blue-600"
                                : budget.status === "REVISED"
                                  ? "text-orange-600"
                                  : "text-gray-500"
                          }`}
                        >
                          {budget.status === "CONFIRMED"
                            ? "Confirm"
                            : budget.status}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {budget.status === "CONFIRMED" && (
                          <button
                            onClick={() => setPieChartBudget(budget)}
                            className="hover:scale-110 transition-transform"
                            title="View Chart"
                          >
                            <MiniPieChart
                              achieved={totalAchieved}
                              total={totalBudgeted}
                            />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {budgets.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg mb-2">No budgets found</div>
                <button
                  onClick={handleNew}
                  className="text-blue-600 hover:underline"
                >
                  Create your first budget
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="text-sm text-amber-600 italic">
        Click line to open form View
      </div>
    </div>
  );

  // Form View (Create/Edit)
  const renderFormView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            resetForm();
            setViewMode("list");
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Budget</h1>
        <span className="text-sm text-red-400">
          {editingBudget?.revisedFrom
            ? "Form View of Revised Budget"
            : "Form View of Original Budget"}
        </span>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Action Buttons Row */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setViewMode("form");
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg border bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              New
            </button>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium rounded-lg border bg-green-600 text-white border-green-600 cursor-not-allowed opacity-50"
            >
              Confirm
            </button>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium rounded-lg border bg-white text-gray-400 border-gray-200 cursor-not-allowed"
            >
              Revise
            </button>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium rounded-lg border bg-white text-gray-400 border-gray-200 cursor-not-allowed"
            >
              Archived
            </button>
          </div>
          <div className="flex gap-2">
            <span className={getStatusButtonStyle("DRAFT", true)}>Draft</span>
            <span className={getStatusButtonStyle("CONFIRMED", false)}>
              Confirm
            </span>
            <span className={getStatusButtonStyle("REVISED", false)}>
              Revised
            </span>
            <span className={getStatusButtonStyle("", false)}>Cancelled</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Budget Header Fields */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-amber-600 mb-1">
                Budget Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., January 2026"
                className="w-full px-4 py-2 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
              />
            </div>
            <div>
              {editingBudget?.revisedFrom ? (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Revision of
                  </label>
                  <div className="text-green-600 underline cursor-pointer">
                    {editingBudget.revisedFrom.name}
                  </div>
                  <div className="text-xs text-green-500">
                    (Original budget clickable link)
                  </div>
                </div>
              ) : editingBudget?.revisedTo?.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Revised with
                  </label>
                  <div className="text-gray-600">
                    {editingBudget.revisedTo[0]?.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    (If revised then revised budget clickable link)
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-amber-600 mb-1">
                Budget Period
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Start</span>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="px-4 py-2 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                />
                <span className="text-red-400 mx-2">To</span>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="px-4 py-2 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Budget Lines */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <Plus size={16} /> Add Line
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-amber-600">
                      Analytic Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-600">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-yellow-600">
                      Budgeted Amount
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-cyan-600">
                      Achieved Amount
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Achieved %
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-pink-600">
                      Amount to Achieve
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.lines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <select
                          required
                          value={line.analyticalAccountId}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "analyticalAccountId",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                        >
                          <option value="">Select Account</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={line.type}
                          onChange={(e) =>
                            updateLine(index, "type", e.target.value)
                          }
                          className={`w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent ${
                            line.type === "INCOME"
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          <option value="INCOME">Income</option>
                          <option value="EXPENSE">Expense</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          required
                          step="0.01"
                          value={line.budgetedAmount}
                          onChange={(e) =>
                            updateLine(index, "budgetedAmount", e.target.value)
                          }
                          placeholder="0/-"
                          className="w-full px-3 py-2 border-b border-gray-300 text-right focus:outline-none focus:border-blue-500 bg-transparent"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-yellow-600">Monetery</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-cyan-600">Compute</span>
                        <span className="ml-2 text-gray-400">View</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">—</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.lines.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No lines added. Click "Add Line" to add budget entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode("list");
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingBudget ? "Update Budget" : "Create Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Detail View
  const renderDetailView = () => {
    if (!selectedBudget) return null;

    const isConfirmed = selectedBudget.status === "CONFIRMED";
    const totals = calculateTotals(selectedBudget.lines, isConfirmed);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode("list")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Budget</h1>
          <span className="text-sm text-red-400">
            {selectedBudget.revisedFrom
              ? "Form View of Revised Budget"
              : "Form View of Original Budget"}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Action Buttons Row */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex gap-2">
              <button
                onClick={handleNew}
                className="px-4 py-2 text-sm font-medium rounded-lg border bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                New
              </button>
              {selectedBudget.status === "DRAFT" && (
                <button
                  onClick={() => handleConfirm(selectedBudget.id)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border bg-green-600 text-white border-green-600 hover:bg-green-700"
                >
                  Confirm
                </button>
              )}
              {selectedBudget.status === "CONFIRMED" && (
                <>
                  <button className="px-4 py-2 text-sm font-medium rounded-lg border bg-green-100 text-green-700 border-green-200 cursor-default">
                    Confirm
                  </button>
                  <button
                    onClick={() => handleRevise(selectedBudget.id)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Revise
                  </button>
                  <button
                    onClick={() => handleArchive(selectedBudget.id)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Archived
                  </button>
                </>
              )}
              {selectedBudget.status === "REVISED" && (
                <button className="px-4 py-2 text-sm font-medium rounded-lg border bg-orange-100 text-orange-700 border-orange-200 cursor-default">
                  Revised
                </button>
              )}
              {selectedBudget.status === "ARCHIVED" && (
                <button className="px-4 py-2 text-sm font-medium rounded-lg border bg-gray-100 text-gray-600 border-gray-200 cursor-default">
                  Archived
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <span
                className={getStatusButtonStyle(
                  "DRAFT",
                  selectedBudget.status === "DRAFT",
                )}
              >
                Draft
              </span>
              <span
                className={getStatusButtonStyle(
                  "CONFIRMED",
                  selectedBudget.status === "CONFIRMED",
                )}
              >
                Confirm
              </span>
              <span
                className={getStatusButtonStyle(
                  "REVISED",
                  selectedBudget.status === "REVISED",
                )}
              >
                Revised
              </span>
              <span className={getStatusButtonStyle("", false)}>Cancelled</span>
            </div>
          </div>

          {/* Budget Header Fields */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-amber-600 mb-1">
                Budget Name
              </label>
              <div className="text-gray-800 py-2">{selectedBudget.name}</div>
            </div>
            <div>
              {selectedBudget.revisedFrom ? (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Revision of
                  </label>
                  <button
                    onClick={() =>
                      navigateToBudget(selectedBudget.revisedFrom.id)
                    }
                    className="text-green-600 underline hover:text-green-700 flex items-center gap-1"
                  >
                    <Link size={14} />
                    {selectedBudget.revisedFrom.name}
                  </button>
                  <div className="text-xs text-green-500">
                    (Original budget clickable link)
                  </div>
                </div>
              ) : selectedBudget.revisedTo?.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Revised with
                  </label>
                  <button
                    onClick={() =>
                      navigateToBudget(selectedBudget.revisedTo[0].id)
                    }
                    className="text-gray-600 underline hover:text-gray-700 flex items-center gap-1"
                  >
                    <Link size={14} />
                    {selectedBudget.revisedTo[0].name}
                  </button>
                  <div className="text-xs text-gray-400">
                    (If revised then revised budget clickable link)
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-amber-600 mb-1">
                Budget Period
              </label>
              <div className="flex items-center gap-2 text-gray-600">
                <span>Start</span>
                <span className="font-medium">
                  {formatDate(selectedBudget.startDate)}
                </span>
                <span className="text-red-400 mx-2">To</span>
                <span className="font-medium">
                  {formatDate(selectedBudget.endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Budget Lines Table */}
          <div className="border-t pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-amber-600">
                      Analytic Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-600">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-yellow-600">
                      Budgeted Amount
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-cyan-600">
                      Achieved Amount
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                      Achieved %
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-pink-600">
                      Amount to Achieve
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedBudget.lines.map((line) => {
                    const budgeted = Number(line.budgetedAmount) || 0;
                    const achieved = isConfirmed
                      ? Number(line.achievedAmount) || 0
                      : 0;
                    const percent =
                      budgeted > 0 ? (achieved / budgeted) * 100 : 0;
                    const toAchieve = budgeted - achieved;

                    return (
                      <tr key={line.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800">
                          {line.analyticalAccount.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              line.type === "INCOME"
                                ? "text-green-600"
                                : "text-gray-600"
                            }
                          >
                            {line.type === "INCOME" ? "Income" : "Expense"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">
                          {formatCurrency(budgeted).replace("₹", "")}/-
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isConfirmed ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-cyan-600">
                                {formatCurrency(achieved).replace("₹", "")}/-
                              </span>
                              <button
                                onClick={() => setTransactionLine(line)}
                                className="text-gray-500 hover:text-blue-600"
                              >
                                View
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-yellow-600">Monetery</span>
                              <span className="text-cyan-600">Compute</span>
                              <span className="text-gray-400">View</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isConfirmed ? (
                            <span className="text-gray-600">
                              {percent.toFixed(2)} %
                            </span>
                          ) : (
                            <span className="text-gray-400">View</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isConfirmed ? (
                            <span className="text-pink-600">
                              {formatCurrency(toAchieve).replace("₹", "")}/-
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {isConfirmed && (
                  <tfoot className="border-t border-gray-200 font-semibold">
                    <tr>
                      <td className="px-4 py-3" colSpan="2">
                        TOTAL
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(totals.totalBudgeted).replace("₹", "")}
                        /-
                      </td>
                      <td className="px-4 py-3 text-right text-cyan-600">
                        {formatCurrency(totals.totalAchieved).replace("₹", "")}
                        /-
                      </td>
                      <td className="px-4 py-3 text-right">
                        {totals.totalPercent.toFixed(2)} %
                      </td>
                      <td className="px-4 py-3 text-right text-pink-600">
                        {formatCurrency(totals.totalToAchieve).replace("₹", "")}
                        /-
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Edit/Delete buttons for DRAFT */}
          {selectedBudget.status === "DRAFT" && (
            <div className="flex gap-3 pt-6 border-t mt-6">
              <button
                onClick={() => handleEdit(selectedBudget)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit size={16} /> Edit
              </button>
              <button
                onClick={() => handleDelete(selectedBudget.id)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Summary Cards - only for confirmed */}
        {isConfirmed && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">Total Budgeted</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totals.totalBudgeted)}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">Total Achieved</div>
              <div className="text-2xl font-bold text-cyan-600">
                {formatCurrency(totals.totalAchieved)}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">Achievement %</div>
              <div className="text-2xl font-bold text-blue-600">
                {totals.totalPercent.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">
                Remaining to Achieve
              </div>
              <div className="text-2xl font-bold text-pink-600">
                {formatCurrency(totals.totalToAchieve)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {viewMode === "list" && renderListView()}
      {viewMode === "form" && renderFormView()}
      {viewMode === "view" && renderDetailView()}

      {/* Pie Chart Modal */}
      {pieChartBudget && (
        <PieChartModal
          budget={pieChartBudget}
          onClose={() => setPieChartBudget(null)}
        />
      )}

      {/* Transactions Modal */}
      {transactionLine && (
        <TransactionsModal
          line={transactionLine}
          budget={selectedBudget}
          onClose={() => setTransactionLine(null)}
        />
      )}
    </div>
  );
}
