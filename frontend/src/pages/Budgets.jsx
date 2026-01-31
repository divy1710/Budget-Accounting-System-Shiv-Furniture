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
  ChevronLeft,
  ChevronRight,
  Save,
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

const formatPeriod = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    return `${startMonth} - ${endMonth} ${endYear}`;
  }
  return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
};

const generateBudgetId = (id) => {
  const year = new Date().getFullYear();
  return `BDG-${year}-${String(id).padStart(3, "0")}`;
};

// Circular Progress Component matching the UI
const CircularProgress = ({ percent }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Color based on percentage
  let color = "#3B82F6"; // blue default
  if (percent >= 100)
    color = "#10B981"; // green for completed
  else if (percent >= 50)
    color = "#3B82F6"; // blue
  else if (percent >= 25)
    color = "#F59E0B"; // yellow/amber
  else color = "#6B7280"; // gray for low

  return (
    <div
      style={{
        position: "relative",
        width: "48px",
        height: "48px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
        {/* Background circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          position: "absolute",
          fontSize: "11px",
          fontWeight: "600",
          color: "#1F2937",
        }}
      >
        {Math.round(percent)}%
      </span>
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Styles
  const containerStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
  };

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1F2937",
    margin: "0 0 8px 0",
  };

  const subtitleStyle = {
    fontSize: "14px",
    color: "#6B7280",
    margin: 0,
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
  };

  const buttonPrimaryStyle = {
    padding: "12px 24px",
    backgroundColor: "#4F46E5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "CONFIRMED":
        return {
          backgroundColor: "#D1FAE5",
          color: "#065F46",
          label: "ACTIVE",
        };
      case "REVISED":
        return {
          backgroundColor: "#FEF3C7",
          color: "#92400E",
          label: "IN PROGRESS",
        };
      case "DRAFT":
        return { backgroundColor: "#F3F4F6", color: "#374151", label: "DRAFT" };
      case "ARCHIVED":
        return {
          backgroundColor: "#DBEAFE",
          color: "#1E40AF",
          label: "COMPLETED",
        };
      default:
        return { backgroundColor: "#F3F4F6", color: "#374151", label: status };
    }
  };

  // Pagination
  const totalPages = Math.ceil(budgets.length / itemsPerPage);
  const paginatedBudgets = budgets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // List View
  const renderListView = () => (
    <div style={containerStyle}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1 style={titleStyle}>Budget Master List</h1>
          <p style={subtitleStyle}>
            Monitor and manage operational and capital expenditure budgets.
          </p>
        </div>
        <button onClick={handleNew} style={buttonPrimaryStyle}>
          <Plus size={16} /> New Budget
        </button>
      </div>

      {/* Main Card */}
      <div style={cardStyle}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "300px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid #E5E7EB",
                borderTopColor: "#4F46E5",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <th
                      style={{
                        padding: "16px 24px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Budget Name
                    </th>
                    <th
                      style={{
                        padding: "16px 24px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Period
                    </th>
                    <th
                      style={{
                        padding: "16px 24px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "16px 24px",
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Achieved vs Balance
                    </th>
                    <th
                      style={{
                        padding: "16px 24px",
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBudgets.map((budget) => {
                    const totalBudgeted = budget.lines.reduce(
                      (sum, l) => sum + Number(l.budgetedAmount),
                      0,
                    );
                    const totalAchieved = budget.lines.reduce(
                      (sum, l) => sum + Number(l.achievedAmount || 0),
                      0,
                    );
                    const percent =
                      totalBudgeted > 0
                        ? (totalAchieved / totalBudgeted) * 100
                        : 0;
                    const statusInfo = getStatusStyle(budget.status);

                    return (
                      <tr
                        key={budget.id}
                        style={{ borderBottom: "1px solid #F3F4F6" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#FAFAFA")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "white")
                        }
                      >
                        <td style={{ padding: "20px 24px" }}>
                          <div>
                            <p
                              style={{
                                fontSize: "15px",
                                fontWeight: "600",
                                color: "#1F2937",
                                margin: "0 0 4px 0",
                              }}
                            >
                              {budget.name}
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#9CA3AF",
                                margin: 0,
                              }}
                            >
                              ID: {generateBudgetId(budget.id)}
                            </p>
                          </div>
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <span style={{ fontSize: "14px", color: "#4B5563" }}>
                            {formatPeriod(budget.startDate, budget.endDate)}
                          </span>
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.03em",
                              backgroundColor: statusInfo.backgroundColor,
                              color: statusInfo.color,
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td
                          style={{ padding: "20px 24px", textAlign: "center" }}
                        >
                          <CircularProgress percent={percent} />
                        </td>
                        <td style={{ padding: "20px 24px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            <button
                              onClick={() => handleView(budget)}
                              style={{
                                padding: "8px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "6px",
                                color: "#6B7280",
                              }}
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(budget)}
                              style={{
                                padding: "8px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "6px",
                                color: "#6B7280",
                              }}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(budget.id)}
                              style={{
                                padding: "8px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "6px",
                                color: "#6B7280",
                              }}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {budgets.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderTop: "1px solid #E5E7EB",
                }}
              >
                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, budgets.length)} of{" "}
                  {budgets.length} entries
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: "8px",
                      background: "none",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{
                        padding: "8px 14px",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "500",
                        cursor: "pointer",
                        backgroundColor:
                          currentPage === i + 1 ? "#4F46E5" : "transparent",
                        color: currentPage === i + 1 ? "white" : "#6B7280",
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "8px",
                      background: "none",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {budgets.length === 0 && !loading && (
          <div
            style={{ textAlign: "center", padding: "64px", color: "#6B7280" }}
          >
            <Archive
              size={48}
              style={{ margin: "0 auto 16px", color: "#D1D5DB" }}
            />
            <p style={{ fontWeight: "500", marginBottom: "8px" }}>
              No budgets found
            </p>
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>
              Create your first budget to start tracking
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "48px" }}>
        <p style={{ fontSize: "13px", color: "#9CA3AF" }}>
          © 2023 Shiv Furniture Enterprise Resource Planning. All Rights
          Reserved.
        </p>
      </div>
    </div>
  );

  // Form View (Create/Edit)
  const renderFormView = () => (
    <div style={containerStyle}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => {
              resetForm();
              setViewMode("list");
            }}
            style={{
              padding: "10px",
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={titleStyle}>
              {editingBudget ? "Edit Budget" : "New Budget"}
            </h1>
            <p style={subtitleStyle}>
              {editingBudget
                ? "Update budget information"
                : "Create a new operational or capital budget"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={handleSubmit} style={buttonPrimaryStyle}>
            <Save size={16} /> Save Budget
          </button>
          <button
            onClick={() => {
              resetForm();
              setViewMode("list");
            }}
            style={{
              padding: "12px 24px",
              backgroundColor: "white",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Discard
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div style={cardStyle}>
        <div style={{ padding: "24px" }}>
          {/* Budget Details */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#1F2937",
                marginBottom: "16px",
              }}
            >
              Budget Details
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "20px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#4F46E5",
                    marginBottom: "8px",
                  }}
                >
                  Budget Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Q3 Office Supplies"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#1F2937",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#4F46E5",
                    marginBottom: "8px",
                  }}
                >
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#1F2937",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#4F46E5",
                    marginBottom: "8px",
                  }}
                >
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#1F2937",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Budget Lines */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                Budget Lines
              </h3>
              <button
                type="button"
                onClick={addLine}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#EEF2FF",
                  color: "#4F46E5",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={14} /> Add Line
              </button>
            </div>

            {formData.lines.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  backgroundColor: "#F9FAFB",
                  borderRadius: "12px",
                  border: "2px dashed #E5E7EB",
                }}
              >
                <p style={{ color: "#6B7280", marginBottom: "12px" }}>
                  No budget lines added yet
                </p>
                <button
                  type="button"
                  onClick={addLine}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#4F46E5",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Add First Line
                </button>
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB" }}>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#6B7280",
                        }}
                      >
                        Analytical Account
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#6B7280",
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#6B7280",
                        }}
                      >
                        Budgeted Amount
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#6B7280",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, index) => (
                      <tr
                        key={index}
                        style={{ borderTop: "1px solid #E5E7EB" }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <select
                            value={line.analyticalAccountId}
                            onChange={(e) =>
                              updateLine(
                                index,
                                "analyticalAccountId",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              backgroundColor: "white",
                              border: "1px solid #E5E7EB",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          >
                            <option value="">Select Account</option>
                            {accounts
                              .filter((a) => a.isActive)
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <select
                            value={line.type}
                            onChange={(e) =>
                              updateLine(index, "type", e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              backgroundColor: "white",
                              border: "1px solid #E5E7EB",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          >
                            <option value="EXPENSE">Expense</option>
                            <option value="INCOME">Income</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <input
                            type="number"
                            value={line.budgetedAmount}
                            onChange={(e) =>
                              updateLine(
                                index,
                                "budgetedAmount",
                                e.target.value,
                              )
                            }
                            placeholder="0.00"
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              backgroundColor: "white",
                              border: "1px solid #E5E7EB",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          />
                        </td>
                        <td
                          style={{ padding: "12px 16px", textAlign: "center" }}
                        >
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            style={{
                              padding: "8px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#EF4444",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "48px" }}>
        <p style={{ fontSize: "13px", color: "#9CA3AF" }}>
          © 2023 Shiv Furniture Enterprise Resource Planning. All Rights
          Reserved.
        </p>
      </div>
    </div>
  );

  // Detail View
  const renderDetailView = () => {
    if (!selectedBudget) return null;

    const isConfirmed = selectedBudget.status === "CONFIRMED";
    const totals = calculateTotals(selectedBudget.lines, isConfirmed);
    const statusInfo = getStatusStyle(selectedBudget.status);

    return (
      <div style={containerStyle}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "10px",
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={titleStyle}>{selectedBudget.name}</h1>
              <p style={subtitleStyle}>
                ID: {generateBudgetId(selectedBudget.id)} •{" "}
                {formatPeriod(selectedBudget.startDate, selectedBudget.endDate)}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {selectedBudget.status === "DRAFT" && (
              <>
                <button
                  onClick={() => handleConfirm(selectedBudget.id)}
                  style={{ ...buttonPrimaryStyle, backgroundColor: "#059669" }}
                >
                  <Check size={16} /> Confirm
                </button>
                <button
                  onClick={() => handleEdit(selectedBudget)}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "white",
                    color: "#374151",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Edit size={16} /> Edit
                </button>
              </>
            )}
            {selectedBudget.status === "CONFIRMED" && (
              <>
                <button
                  onClick={() => handleRevise(selectedBudget.id)}
                  style={{ ...buttonPrimaryStyle, backgroundColor: "#F59E0B" }}
                >
                  <RefreshCw size={16} /> Revise
                </button>
                <button
                  onClick={() => handleArchive(selectedBudget.id)}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "white",
                    color: "#374151",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Archive size={16} /> Archive
                </button>
              </>
            )}
            <button
              onClick={() => handleDelete(selectedBudget.id)}
              style={{
                padding: "12px",
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: "24px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "uppercase",
              backgroundColor: statusInfo.backgroundColor,
              color: statusInfo.color,
            }}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Summary Cards */}
        {isConfirmed && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div style={{ ...cardStyle, padding: "20px" }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}
              >
                Total Budgeted
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                {formatCurrency(totals.totalBudgeted)}
              </p>
            </div>
            <div style={{ ...cardStyle, padding: "20px" }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}
              >
                Total Achieved
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#059669",
                  margin: 0,
                }}
              >
                {formatCurrency(totals.totalAchieved)}
              </p>
            </div>
            <div style={{ ...cardStyle, padding: "20px" }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}
              >
                Achievement %
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#4F46E5",
                  margin: 0,
                }}
              >
                {totals.totalPercent.toFixed(1)}%
              </p>
            </div>
            <div style={{ ...cardStyle, padding: "20px" }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}
              >
                Remaining
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#DC2626",
                  margin: 0,
                }}
              >
                {formatCurrency(totals.totalToAchieve)}
              </p>
            </div>
          </div>
        )}

        {/* Budget Lines Table */}
        <div style={cardStyle}>
          <div
            style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#1F2937",
                margin: 0,
              }}
            >
              Budget Lines
            </h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB" }}>
                  <th
                    style={{
                      padding: "14px 24px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Analytical Account
                  </th>
                  <th
                    style={{
                      padding: "14px 24px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: "14px 24px",
                      textAlign: "right",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Budgeted
                  </th>
                  {isConfirmed && (
                    <>
                      <th
                        style={{
                          padding: "14px 24px",
                          textAlign: "right",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6B7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Achieved
                      </th>
                      <th
                        style={{
                          padding: "14px 24px",
                          textAlign: "right",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6B7280",
                          textTransform: "uppercase",
                        }}
                      >
                        %
                      </th>
                      <th
                        style={{
                          padding: "14px 24px",
                          textAlign: "right",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6B7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Remaining
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {selectedBudget.lines.map((line) => {
                  const percent =
                    line.budgetedAmount > 0
                      ? ((line.achievedAmount || 0) / line.budgetedAmount) * 100
                      : 0;
                  const remaining =
                    line.budgetedAmount - (line.achievedAmount || 0);
                  return (
                    <tr
                      key={line.id}
                      style={{ borderBottom: "1px solid #F3F4F6" }}
                    >
                      <td
                        style={{
                          padding: "16px 24px",
                          fontWeight: "500",
                          color: "#1F2937",
                        }}
                      >
                        {line.analyticalAccount?.name}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor:
                              line.type === "INCOME" ? "#D1FAE5" : "#FEE2E2",
                            color:
                              line.type === "INCOME" ? "#065F46" : "#991B1B",
                          }}
                        >
                          {line.type}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "16px 24px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#1F2937",
                        }}
                      >
                        {formatCurrency(line.budgetedAmount)}
                      </td>
                      {isConfirmed && (
                        <>
                          <td
                            style={{
                              padding: "16px 24px",
                              textAlign: "right",
                              color: "#059669",
                              fontWeight: "500",
                            }}
                          >
                            {formatCurrency(line.achievedAmount || 0)}
                          </td>
                          <td
                            style={{ padding: "16px 24px", textAlign: "right" }}
                          >
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                                backgroundColor:
                                  percent >= 100
                                    ? "#D1FAE5"
                                    : percent >= 50
                                      ? "#DBEAFE"
                                      : "#FEF3C7",
                                color:
                                  percent >= 100
                                    ? "#065F46"
                                    : percent >= 50
                                      ? "#1E40AF"
                                      : "#92400E",
                              }}
                            >
                              {percent.toFixed(1)}%
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "16px 24px",
                              textAlign: "right",
                              color: remaining > 0 ? "#DC2626" : "#059669",
                              fontWeight: "500",
                            }}
                          >
                            {formatCurrency(remaining)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {isConfirmed && (
                <tfoot>
                  <tr style={{ backgroundColor: "#F9FAFB", fontWeight: "600" }}>
                    <td style={{ padding: "16px 24px" }} colSpan="2">
                      TOTAL
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      {formatCurrency(totals.totalBudgeted)}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        textAlign: "right",
                        color: "#059669",
                      }}
                    >
                      {formatCurrency(totals.totalAchieved)}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: "#EEF2FF",
                          color: "#4F46E5",
                        }}
                      >
                        {totals.totalPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        textAlign: "right",
                        color: "#DC2626",
                      }}
                    >
                      {formatCurrency(totals.totalToAchieve)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Linked Budgets */}
        {(selectedBudget.revisedFrom ||
          selectedBudget.revisedTo?.length > 0) && (
          <div
            style={{ ...cardStyle, marginTop: "24px", padding: "20px 24px" }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#1F2937",
                marginBottom: "12px",
              }}
            >
              Linked Budgets
            </h3>
            {selectedBudget.revisedFrom && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Link size={14} style={{ color: "#6B7280" }} />
                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                  Revised from:
                </span>
                <button
                  onClick={() =>
                    navigateToBudget(selectedBudget.revisedFrom.id)
                  }
                  style={{
                    fontSize: "13px",
                    color: "#4F46E5",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {selectedBudget.revisedFrom.name}
                </button>
              </div>
            )}
            {selectedBudget.revisedTo?.map((b) => (
              <div
                key={b.id}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Link size={14} style={{ color: "#6B7280" }} />
                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                  Revised to:
                </span>
                <button
                  onClick={() => navigateToBudget(b.id)}
                  style={{
                    fontSize: "13px",
                    color: "#4F46E5",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {b.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <p style={{ fontSize: "13px", color: "#9CA3AF" }}>
            © 2023 Shiv Furniture Enterprise Resource Planning. All Rights
            Reserved.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#F9FAFB",
        minHeight: "100vh",
      }}
    >
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
