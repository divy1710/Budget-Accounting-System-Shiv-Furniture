import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  dashboardApi,
  transactionsApi,
  budgetsApi,
  productsApi,
} from "../services/api";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  FileText,
  ShoppingCart,
  AlertTriangle,
  AlertCircle,
  Package,
  Clock,
} from "lucide-react";

export default function FinancialDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const statsRes = await dashboardApi.getStats();
      const statsData = statsRes.data;
      setStats(statsData);

      // Fetch budget cockpit data
      const budgetRes = await dashboardApi.getBudgetCockpit();
      const budgetCockpitData = budgetRes.data;
      setBudgetData(budgetCockpitData);

      // Fetch recent sales (Sales Orders)
      try {
        const salesRes = await transactionsApi.getAll({ type: "SALES_ORDER" });
        // Handle both array and object with data property
        const salesArray = Array.isArray(salesRes.data)
          ? salesRes.data
          : salesRes.data?.data || [];

        const salesData = salesArray.slice(0, 5).map((sale) => ({
          id: sale.id,
          number: sale.transactionNumber,
          partner: sale.customer?.name || sale.vendor?.name || "Unknown",
          amount: Number(sale.totalAmount || 0),
          status: sale.paymentStatus || sale.status,
        }));
        setRecentSales(salesData);
      } catch (e) {
        console.error("Error fetching sales:", e);
        setRecentSales([]);
      }

      // Fetch recent purchases (Purchase Orders)
      try {
        const purchasesRes = await transactionsApi.getAll({
          type: "PURCHASE_ORDER",
        });
        // Handle both array and object with data property
        const purchasesArray = Array.isArray(purchasesRes.data)
          ? purchasesRes.data
          : purchasesRes.data?.data || [];

        const purchasesData = purchasesArray.slice(0, 5).map((purchase) => ({
          id: purchase.id,
          number: purchase.transactionNumber,
          partner:
            purchase.vendor?.name || purchase.customer?.name || "Unknown",
          amount: Number(purchase.totalAmount || 0),
          status: purchase.paymentStatus || purchase.status,
        }));
        setRecentPurchases(purchasesData);
      } catch (e) {
        console.error("Error fetching purchases:", e);
        setRecentPurchases([]);
      }

      // Generate alerts based on data
      const alertsList = [];

      // Check for overdue invoices
      try {
        const invoicesRes = await transactionsApi.getAll({
          type: "CUSTOMER_INVOICE",
        });
        const invoiceArray = Array.isArray(invoicesRes.data)
          ? invoicesRes.data
          : invoicesRes.data?.data || [];
        const overdueInvoices = invoiceArray.filter((inv) => {
          if (!inv.dueDate) return false;
          const dueDate = new Date(inv.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const amountDue =
            Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0);
          return dueDate < today && amountDue > 0;
        });

        if (overdueInvoices.length > 0) {
          const totalOverdue = overdueInvoices.reduce(
            (sum, inv) =>
              sum +
              (Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)),
            0,
          );
          alertsList.push({
            type: "critical",
            icon: "alert",
            title: `${overdueInvoices.length} Overdue Invoices`,
            description: `Total outstanding amount exceeds ${formatCurrency(totalOverdue)}. Immediate follow-up required.`,
            action: "Send Reminders",
            actionLink: "/customer-invoices",
          });
        }
      } catch (e) {
        console.error("Error checking invoices:", e);
      }

      // Check budget warnings
      if (budgetCockpitData?.summary) {
        const highUtilization = budgetCockpitData.summary.filter(
          (b) => b.utilizationPercent >= 90,
        );
        if (highUtilization.length > 0) {
          alertsList.push({
            type: "warning",
            icon: "budget",
            title: "Budget Warning",
            description: `${highUtilization.length} cost center(s) at 90%+ of budget allocation.`,
            action: "Review Budget",
            actionLink: "/budget-cockpit",
          });
        }
      }

      // Check low stock (products with low quantity)
      try {
        const productsRes = await productsApi.getAll();
        const productsData = Array.isArray(productsRes.data)
          ? productsRes.data
          : [];
        const lowStock = productsData.filter(
          (p) => p.stockQuantity !== undefined && p.stockQuantity < 20,
        );
        if (lowStock.length > 0) {
          alertsList.push({
            type: "info",
            icon: "stock",
            title: "Low Stock Alert",
            description: `${lowStock.length} product(s) below reorder point.`,
            action: "Create PO",
            actionLink: "/purchase-orders",
          });
        }
      } catch (e) {
        // Products API might not have stockQuantity
      }

      setAlerts(alertsList);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Styles
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#F8FAFC",
      padding: "32px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "32px",
    },
    titleSection: {
      flex: 1,
    },
    title: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#1a1a2e",
      margin: "0 0 8px 0",
    },
    subtitle: {
      fontSize: "14px",
      color: "#64748B",
      margin: 0,
    },
    headerButtons: {
      display: "flex",
      gap: "12px",
    },
    headerBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      backgroundColor: "white",
      border: "1px solid #E2E8F0",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#334155",
      cursor: "pointer",
    },
    // Stats Grid
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "20px",
      marginBottom: "32px",
    },
    statCard: {
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    statHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "16px",
    },
    statIconWrapper: {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    statTrend: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "13px",
      fontWeight: "500",
    },
    statTrendPositive: {
      color: "#10B981",
    },
    statTrendNegative: {
      color: "#EF4444",
    },
    statLabel: {
      fontSize: "14px",
      color: "#64748B",
      marginBottom: "8px",
    },
    statValue: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#1a1a2e",
    },
    progressContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    progressBar: {
      flex: 1,
      height: "8px",
      backgroundColor: "#E2E8F0",
      borderRadius: "4px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#3B82F6",
      borderRadius: "4px",
    },
    // Three column layout
    columnsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "24px",
    },
    column: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      overflow: "hidden",
    },
    columnHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      borderBottom: "1px solid #F1F5F9",
    },
    columnTitle: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "16px",
      fontWeight: "600",
      color: "#1a1a2e",
    },
    columnTitleIcon: {
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    viewAllLink: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#3B82F6",
      cursor: "pointer",
      textDecoration: "none",
    },
    // Table styles
    tableHeader: {
      display: "grid",
      gridTemplateColumns: "70px 1fr 100px 80px",
      padding: "12px 24px",
      borderBottom: "1px solid #F1F5F9",
      backgroundColor: "#FAFAFA",
    },
    tableHeaderCell: {
      fontSize: "11px",
      fontWeight: "600",
      color: "#64748B",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    tableRow: {
      display: "grid",
      gridTemplateColumns: "70px 1fr 100px 80px",
      padding: "14px 24px",
      borderBottom: "1px solid #F1F5F9",
      alignItems: "center",
    },
    tableCell: {
      fontSize: "14px",
      color: "#334155",
    },
    tableCellBold: {
      fontWeight: "600",
      color: "#1a1a2e",
    },
    // Status badges
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500",
    },
    statusPaid: {
      backgroundColor: "#DCFCE7",
      color: "#16A34A",
    },
    statusPending: {
      backgroundColor: "#FEF3C7",
      color: "#D97706",
    },
    statusOverdue: {
      backgroundColor: "#FEE2E2",
      color: "#DC2626",
    },
    statusDraft: {
      backgroundColor: "#F1F5F9",
      color: "#64748B",
    },
    // Pending Actions
    alertsContainer: {
      padding: "16px",
    },
    criticalBadge: {
      backgroundColor: "#FEE2E2",
      color: "#DC2626",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
    },
    alertCard: {
      padding: "16px",
      borderRadius: "12px",
      marginBottom: "12px",
    },
    alertCardRed: {
      backgroundColor: "#FEF2F2",
      border: "1px solid #FECACA",
    },
    alertCardYellow: {
      backgroundColor: "#FFFBEB",
      border: "1px solid #FDE68A",
    },
    alertCardBlue: {
      backgroundColor: "#EFF6FF",
      border: "1px solid #BFDBFE",
    },
    alertHeader: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "8px",
    },
    alertIcon: {
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    alertIconRed: {
      backgroundColor: "#FEE2E2",
      color: "#DC2626",
    },
    alertIconYellow: {
      backgroundColor: "#FEF3C7",
      color: "#D97706",
    },
    alertIconBlue: {
      backgroundColor: "#DBEAFE",
      color: "#3B82F6",
    },
    alertTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#1a1a2e",
    },
    alertText: {
      fontSize: "13px",
      color: "#64748B",
      marginBottom: "8px",
      lineHeight: "1.5",
    },
    alertLink: {
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      textDecoration: "none",
    },
    alertLinkRed: {
      color: "#DC2626",
    },
    alertLinkYellow: {
      color: "#D97706",
    },
    alertLinkBlue: {
      color: "#3B82F6",
    },
    emptyState: {
      padding: "40px 24px",
      textAlign: "center",
      color: "#64748B",
      fontSize: "14px",
    },
  };

  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "paid" || statusLower === "confirmed")
      return styles.statusPaid;
    if (statusLower === "pending" || statusLower === "partial")
      return styles.statusPending;
    if (statusLower === "overdue" || statusLower === "not_paid")
      return styles.statusOverdue;
    return styles.statusDraft;
  };

  const getStatusLabel = (status) => {
    if (!status) return "Draft";
    const statusLower = status.toLowerCase();
    if (statusLower === "paid") return "Paid";
    if (statusLower === "confirmed") return "Paid";
    if (statusLower === "partial") return "Pending";
    if (statusLower === "not_paid") return "Overdue";
    if (statusLower === "draft") return "Draft";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div
        style={{
          ...styles.container,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate stats - use budget cockpit data or fallback to stats.budget
  const totalBudget =
    budgetData?.totals?.totalBudgeted || stats?.budget?.budgeted || 0;
  const totalActual =
    budgetData?.totals?.totalActual || stats?.budget?.actual || 0;
  const budgetUtilization =
    totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  // Income from payments received, Expense from outstanding payable
  const totalIncome =
    stats?.payments?.totalPosted || stats?.outstanding?.receivable || 0;
  const totalExpense = stats?.outstanding?.payable || 0;

  const criticalCount = alerts.filter((a) => a.type === "critical").length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Financial Dashboard</h1>
          <p style={styles.subtitle}>
            Real-time enterprise overview for Shiv Furniture ERP
          </p>
        </div>
        <div style={styles.headerButtons}>
          <button style={styles.headerBtn}>
            <Calendar size={16} />
            Last 30 Days
          </button>
          <button style={styles.headerBtn}>
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {/* Total Budgets */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div
              style={{
                ...styles.statIconWrapper,
                backgroundColor: "#EEF2FF",
              }}
            >
              <FileText size={24} color="#4F46E5" />
            </div>
            <div
              style={{
                ...styles.statTrend,
                ...styles.statTrendPositive,
              }}
            >
              <TrendingUp size={16} />
              +12%
            </div>
          </div>
          <div style={styles.statLabel}>Total Budgets</div>
          <div style={styles.statValue}>{formatCurrency(totalBudget)}</div>
        </div>

        {/* Budget Utilized % */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div
              style={{
                ...styles.statIconWrapper,
                backgroundColor: "#DBEAFE",
              }}
            >
              <TrendingUp size={24} color="#3B82F6" />
            </div>
            <div
              style={{
                ...styles.statTrend,
                ...styles.statTrendPositive,
              }}
            >
              <TrendingUp size={16} />
              +5%
            </div>
          </div>
          <div style={styles.statLabel}>Budget Utilized %</div>
          <div style={styles.progressContainer}>
            <div style={styles.statValue}>{budgetUtilization}%</div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${Math.min(budgetUtilization, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div
              style={{
                ...styles.statIconWrapper,
                backgroundColor: "#D1FAE5",
              }}
            >
              <TrendingUp size={24} color="#10B981" />
            </div>
            <div
              style={{
                ...styles.statTrend,
                ...styles.statTrendPositive,
              }}
            >
              <TrendingUp size={16} />
              +18%
            </div>
          </div>
          <div style={styles.statLabel}>Total Income</div>
          <div style={styles.statValue}>
            {formatCurrency(stats?.payments?.totalPosted || totalIncome)}
          </div>
        </div>

        {/* Total Expense */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div
              style={{
                ...styles.statIconWrapper,
                backgroundColor: "#FEE2E2",
              }}
            >
              <TrendingDown size={24} color="#EF4444" />
            </div>
            <div
              style={{
                ...styles.statTrend,
                ...styles.statTrendNegative,
              }}
            >
              <TrendingDown size={16} />
              -2%
            </div>
          </div>
          <div style={styles.statLabel}>Total Expense</div>
          <div style={styles.statValue}>{formatCurrency(totalExpense)}</div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div style={styles.columnsGrid}>
        {/* Recent Sales */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <div style={styles.columnTitle}>
              <div
                style={{
                  ...styles.columnTitleIcon,
                  backgroundColor: "#FEF3C7",
                }}
              >
                <FileText size={18} color="#D97706" />
              </div>
              Recent Sales
            </div>
            <span
              style={styles.viewAllLink}
              onClick={() => navigate("/sales-orders")}
            >
              View All
            </span>
          </div>
          <div style={styles.tableHeader}>
            <span style={styles.tableHeaderCell}>No.</span>
            <span style={styles.tableHeaderCell}>Partner</span>
            <span style={styles.tableHeaderCell}>Amount</span>
            <span style={styles.tableHeaderCell}>Status</span>
          </div>
          {recentSales.length > 0 ? (
            recentSales.map((sale) => (
              <div key={sale.id} style={styles.tableRow}>
                <span style={{ ...styles.tableCell, ...styles.tableCellBold }}>
                  {sale.number?.split("-").slice(-1)[0] || sale.number}
                </span>
                <span style={styles.tableCell}>{sale.partner}</span>
                <span style={styles.tableCell}>
                  {formatCurrency(sale.amount)}
                </span>
                <span style={styles.tableCell}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(sale.status),
                    }}
                  >
                    {getStatusLabel(sale.status)}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>No recent sales</div>
          )}
        </div>

        {/* Recent Purchases */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <div style={styles.columnTitle}>
              <div
                style={{
                  ...styles.columnTitleIcon,
                  backgroundColor: "#DBEAFE",
                }}
              >
                <ShoppingCart size={18} color="#3B82F6" />
              </div>
              Recent Purchases
            </div>
            <span
              style={styles.viewAllLink}
              onClick={() => navigate("/purchase-orders")}
            >
              View All
            </span>
          </div>
          <div style={styles.tableHeader}>
            <span style={styles.tableHeaderCell}>No.</span>
            <span style={styles.tableHeaderCell}>Partner</span>
            <span style={styles.tableHeaderCell}>Amount</span>
            <span style={styles.tableHeaderCell}>Status</span>
          </div>
          {recentPurchases.length > 0 ? (
            recentPurchases.map((purchase) => (
              <div key={purchase.id} style={styles.tableRow}>
                <span style={{ ...styles.tableCell, ...styles.tableCellBold }}>
                  {purchase.number?.split("-").slice(-1)[0] || purchase.number}
                </span>
                <span style={styles.tableCell}>{purchase.partner}</span>
                <span style={styles.tableCell}>
                  {formatCurrency(purchase.amount)}
                </span>
                <span style={styles.tableCell}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(purchase.status),
                    }}
                  >
                    {getStatusLabel(purchase.status)}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>No recent purchases</div>
          )}
        </div>

        {/* Pending Actions */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <div style={styles.columnTitle}>
              <div
                style={{
                  ...styles.columnTitleIcon,
                  backgroundColor: "#FEE2E2",
                }}
              >
                <AlertTriangle size={18} color="#DC2626" />
              </div>
              Pending Actions
            </div>
            {criticalCount > 0 && (
              <span style={styles.criticalBadge}>{criticalCount} Critical</span>
            )}
          </div>
          <div style={styles.alertsContainer}>
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.alertCard,
                    ...(alert.type === "critical"
                      ? styles.alertCardRed
                      : alert.type === "warning"
                        ? styles.alertCardYellow
                        : styles.alertCardBlue),
                  }}
                >
                  <div style={styles.alertHeader}>
                    <div
                      style={{
                        ...styles.alertIcon,
                        ...(alert.type === "critical"
                          ? styles.alertIconRed
                          : alert.type === "warning"
                            ? styles.alertIconYellow
                            : styles.alertIconBlue),
                      }}
                    >
                      {alert.icon === "alert" ? (
                        <AlertCircle size={14} />
                      ) : alert.icon === "budget" ? (
                        <TrendingDown size={14} />
                      ) : (
                        <Package size={14} />
                      )}
                    </div>
                    <span style={styles.alertTitle}>{alert.title}</span>
                  </div>
                  <p style={styles.alertText}>{alert.description}</p>
                  <span
                    style={{
                      ...styles.alertLink,
                      ...(alert.type === "critical"
                        ? styles.alertLinkRed
                        : alert.type === "warning"
                          ? styles.alertLinkYellow
                          : styles.alertLinkBlue),
                    }}
                    onClick={() => navigate(alert.actionLink)}
                  >
                    {alert.action}
                  </span>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>No pending actions</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
