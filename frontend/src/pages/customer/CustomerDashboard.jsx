import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transactionsApi } from "../../services/api";
import { generateInvoicePDF } from "../../services/pdfGenerator";
import {
  FileText,
  Receipt,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  HelpCircle,
  CreditCard,
  Calendar,
  TrendingDown,
  AlertCircle,
  LogOut,
} from "lucide-react";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invoices");
  const [currentPage, setCurrentPage] = useState(1);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const itemsPerPage = 4;

  const [stats, setStats] = useState({
    totalOutstanding: 0,
    overdueAmount: 0,
    nextPaymentDue: null,
  });

  useEffect(() => {
    const customerData = localStorage.getItem("customerPortal");
    if (!customerData) {
      navigate("/login");
      return;
    }
    setCustomer(JSON.parse(customerData));
  }, [navigate]);

  useEffect(() => {
    if (customer) {
      fetchData();
    }
  }, [customer]);

  const fetchData = async () => {
    try {
      const response = await transactionsApi.getAll({
        type: "CUSTOMER_INVOICE",
        contactId: customer.id,
      });
      const confirmedInvoices = response.data.filter(
        (inv) => inv.status === "CONFIRMED",
      );
      setInvoices(confirmedInvoices);

      // Calculate stats
      // Get today's date at midnight for accurate comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let totalOutstanding = 0;
      let overdueAmount = 0;
      let nextDue = null;

      confirmedInvoices.forEach((inv) => {
        const amountDue =
          Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0);
        if (amountDue > 0) {
          totalOutstanding += amountDue;

          if (inv.dueDate) {
            const dueDate = new Date(inv.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            // Invoice is overdue if due date is before today
            if (dueDate < today) {
              overdueAmount += amountDue;
            } else if (!nextDue || dueDate < nextDue) {
              nextDue = dueDate;
            }
          }
        }
      });

      setStats({
        totalOutstanding,
        overdueAmount,
        nextPaymentDue: nextDue,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
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

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("customerPortal");
    navigate("/login");
  };

  const calculateAmountDue = (invoice) => {
    const total = Number(invoice.totalAmount || 0);
    const paid = Number(invoice.paidAmount || 0);
    return total - paid;
  };

  const getPaymentStatus = (invoice) => {
    const amountDue = calculateAmountDue(invoice);
    if (amountDue <= 0) return "PAID";
    if (Number(invoice.paidAmount || 0) > 0) return "PARTIAL";
    return "NOT_PAID";
  };

  const isOverdue = (invoice) => {
    if (!invoice.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today && calculateAmountDue(invoice) > 0;
  };

  // Razorpay Payment Handler
  const handlePayNow = async (invoice) => {
    const amountDue = calculateAmountDue(invoice);
    if (amountDue <= 0) {
      alert("This invoice is already paid.");
      return;
    }

    setPayingInvoiceId(invoice.id);

    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => initiateRazorpayPayment(invoice, amountDue);
      script.onerror = () => {
        alert("Failed to load payment gateway. Please try again.");
        setPayingInvoiceId(null);
      };
      document.body.appendChild(script);
    } else {
      initiateRazorpayPayment(invoice, amountDue);
    }
  };

  const initiateRazorpayPayment = async (invoice, amountDue) => {
    try {
      const { razorpayApi } = await import("../../services/api");
      const orderResponse = await razorpayApi.createOrder({
        amount: amountDue,
        invoiceId: invoice.id,
        currency: "INR",
        notes: {
          invoiceNumber: invoice.transactionNumber,
          customerId: customer.id,
          customerName: customer.name,
        },
      });

      const order = orderResponse.data;

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Shiv Furniture",
        description: `Payment for ${invoice.transactionNumber}`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            await razorpayApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: invoice.id,
              amount: amountDue,
              customerId: customer.id,
            });
            alert("Payment successful!");
            fetchData();
          } catch (error) {
            console.error("Payment verification failed:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: customer.name,
          email: customer.email || "",
          contact: customer.phone || "",
        },
        theme: {
          color: "#4F46E5",
        },
        modal: {
          ondismiss: function () {
            setPayingInvoiceId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert(`Payment failed: ${response.error.description}`);
        setPayingInvoiceId(null);
      });
      rzp.open();
    } catch (error) {
      console.error("Error initiating payment:", error);
      alert("Failed to initiate payment. Please try again.");
      setPayingInvoiceId(null);
    }
  };

  // Pagination
  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Styles
  const styles = {
    pageContainer: {
      minHeight: "100vh",
      backgroundColor: "#F8FAFC",
    },
    contentWrapper: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "32px 24px",
    },
    // Header Section
    headerSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "32px",
    },
    titleSection: {
      flex: 1,
    },
    pageTitle: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#1E293B",
      margin: "0 0 4px 0",
    },
    pageSubtitle: {
      fontSize: "14px",
      color: "#64748B",
      margin: 0,
    },
    headerButtons: {
      display: "flex",
      gap: "12px",
    },
    statementBtn: {
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
    newRequestBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      backgroundColor: "#4F46E5",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      color: "white",
      cursor: "pointer",
    },
    logoutBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      backgroundColor: "white",
      border: "1px solid #E2E8F0",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#DC2626",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    // Stats Cards
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "20px",
      marginBottom: "32px",
    },
    statCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "20px 24px",
      border: "1px solid #E2E8F0",
      position: "relative",
    },
    statLabel: {
      fontSize: "14px",
      color: "#64748B",
      marginBottom: "8px",
    },
    statValue: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#1E293B",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    statTrend: {
      fontSize: "12px",
      color: "#10B981",
      display: "flex",
      alignItems: "center",
      gap: "2px",
    },
    statTrendNegative: {
      fontSize: "12px",
      color: "#EF4444",
      display: "flex",
      alignItems: "center",
      gap: "2px",
    },
    statIcon: {
      position: "absolute",
      top: "20px",
      right: "20px",
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    statIconBlue: {
      backgroundColor: "#EEF2FF",
      color: "#4F46E5",
    },
    statIconRed: {
      backgroundColor: "#FEF2F2",
      color: "#EF4444",
    },
    statSubtext: {
      fontSize: "12px",
      color: "#94A3B8",
      marginTop: "4px",
    },
    // Tabs Section
    tabsContainer: {
      backgroundColor: "white",
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      marginBottom: "24px",
    },
    tabsHeader: {
      display: "flex",
      borderBottom: "1px solid #E2E8F0",
      padding: "0 16px",
    },
    tab: {
      padding: "16px 20px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#64748B",
      cursor: "pointer",
      borderBottom: "2px solid transparent",
      marginBottom: "-1px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: "none",
      border: "none",
    },
    tabActive: {
      color: "#4F46E5",
      borderBottom: "2px solid #4F46E5",
    },
    tabBadge: {
      backgroundColor: "#EEF2FF",
      color: "#4F46E5",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
    },
    // Filter Bar
    filterBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderBottom: "1px solid #E2E8F0",
    },
    filterButtons: {
      display: "flex",
      gap: "8px",
    },
    filterBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 12px",
      backgroundColor: "#F8FAFC",
      border: "1px solid #E2E8F0",
      borderRadius: "6px",
      fontSize: "13px",
      color: "#475569",
      cursor: "pointer",
    },
    showingText: {
      fontSize: "13px",
      color: "#64748B",
    },
    // Table
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    tableHeader: {
      textAlign: "left",
      padding: "12px 20px",
      fontSize: "11px",
      fontWeight: "600",
      color: "#64748B",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      borderBottom: "1px solid #E2E8F0",
    },
    tableRow: {
      borderBottom: "1px solid #F1F5F9",
    },
    tableCell: {
      padding: "16px 20px",
      fontSize: "14px",
      color: "#334155",
    },
    invoiceNo: {
      fontWeight: "600",
      color: "#1E293B",
    },
    dueDateOverdue: {
      color: "#EF4444",
      fontWeight: "500",
    },
    // Status Badges
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
    statusPartial: {
      backgroundColor: "#FEF9C3",
      color: "#CA8A04",
    },
    statusNotPaid: {
      backgroundColor: "#FEE2E2",
      color: "#DC2626",
    },
    // Action Buttons
    actionBtn: {
      padding: "8px 16px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      border: "none",
    },
    payNowBtn: {
      backgroundColor: "#4F46E5",
      color: "white",
    },
    viewPdfBtn: {
      backgroundColor: "transparent",
      color: "#4F46E5",
      fontWeight: "600",
    },
    // Pagination
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
    },
    paginationBtn: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      padding: "8px 12px",
      backgroundColor: "transparent",
      border: "1px solid #E2E8F0",
      borderRadius: "6px",
      fontSize: "13px",
      color: "#64748B",
      cursor: "pointer",
    },
    paginationBtnDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    pageNumbers: {
      display: "flex",
      gap: "4px",
    },
    pageNumber: {
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "6px",
      fontSize: "13px",
      color: "#64748B",
      cursor: "pointer",
      border: "none",
      backgroundColor: "transparent",
    },
    pageNumberActive: {
      backgroundColor: "#4F46E5",
      color: "white",
    },
    // Help Section
    helpSection: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "20px",
      marginBottom: "32px",
    },
    helpCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      padding: "24px",
      display: "flex",
      gap: "16px",
    },
    helpCardBlue: {
      backgroundColor: "#EFF6FF",
      border: "1px solid #BFDBFE",
    },
    helpIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: "#3B82F6",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    helpIconGray: {
      backgroundColor: "#64748B",
    },
    helpTitle: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#1E293B",
      marginBottom: "4px",
    },
    helpText: {
      fontSize: "13px",
      color: "#64748B",
      marginBottom: "8px",
      lineHeight: "1.5",
    },
    helpLink: {
      fontSize: "13px",
      color: "#4F46E5",
      fontWeight: "500",
      cursor: "pointer",
      textDecoration: "none",
    },
    // Footer
    footer: {
      borderTop: "1px solid #E2E8F0",
      padding: "20px 0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "auto",
    },
    footerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "#64748B",
    },
    footerLinks: {
      display: "flex",
      gap: "24px",
      fontSize: "13px",
    },
    footerLink: {
      color: "#4F46E5",
      textDecoration: "none",
      cursor: "pointer",
    },
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

  // Calculate payment percentage
  const totalAmount = stats.totalOutstanding + stats.totalPaid;
  const paymentPercentage =
    totalAmount > 0 ? Math.round((stats.totalPaid / totalAmount) * 100) : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Customer Dashboard</h1>
          <p style={styles.subtitle}>
            Welcome back, {customer?.name || "Customer"}! Here's your account
            overview.
          </p>
        </div>
        <div style={styles.headerButtons}>
          <button
            style={styles.headerBtn}
            onClick={() => navigate("/customer/invoices")}
          >
            <Calendar size={16} />
            View All Invoices
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {/* Total Outstanding */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div
              style={{
                ...styles.statIconWrapper,
                backgroundColor: "#EEF2FF",
              }}
            >
              <Receipt size={24} color="#4F46E5" />
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
          <div style={styles.statLabel}>Total Outstanding</div>
          <div style={styles.statValue}>
            {formatCurrency(stats.totalOutstanding)}
          </div>
        </div>

        {/* Payment Progress */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div
              style={{
                ...styles.statIconWrapper,
                backgroundColor: "#DBEAFE",
              }}
            >
              <CreditCard size={24} color="#3B82F6" />
            </div>
            <div
              style={{
                ...styles.statTrend,
                ...styles.statTrendPositive,
              }}
            >
              <TrendingUp size={16} />+{paymentPercentage > 50 ? "5" : "2"}%
            </div>
          </div>
          <div style={styles.statLabel}>Payment Progress</div>
          <div style={styles.progressContainer}>
            <div style={styles.statValue}>{paymentPercentage}%</div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${paymentPercentage}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Total Paid */}
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
          <div style={styles.statLabel}>Total Paid</div>
          <div style={styles.statValue}>{formatCurrency(stats.totalPaid)}</div>
        </div>

        {/* Overdue Amount */}
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div
              style={{
                ...styles.statIconWrapper,
                backgroundColor: "#FEE2E2",
              }}
            >
              <AlertCircle size={24} color="#EF4444" />
            </div>
            <div
              style={{
                ...styles.statTrend,
                ...styles.statTrendNegative,
              }}
            >
              <TrendingDown size={16} />
              -5%
            </div>
          </div>
          <div style={styles.statLabel}>Overdue Amount</div>
          <div style={{ ...styles.statValue, color: "#EF4444" }}>
            {formatCurrency(stats.overdueAmount)}
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div style={styles.columnsGrid}>
        {/* Recent Invoices */}
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
              Recent Invoices
            </div>
            <span
              style={styles.viewAllLink}
              onClick={() => navigate("/customer/invoices")}
            >
              View All
            </span>
          </div>
          <div style={styles.tableHeader}>
            <span style={styles.tableHeaderCell}>No.</span>
            <span style={styles.tableHeaderCell}>Amount</span>
            <span style={styles.tableHeaderCell}>Status</span>
            <span style={styles.tableHeaderCell}></span>
          </div>
          {recentInvoices.length > 0 ? (
            recentInvoices.map((invoice) => {
              const status = getPaymentStatus(invoice);
              const overdue = isOverdue(invoice);
              const amountDue = calculateAmountDue(invoice);

              return (
                <div key={invoice.id} style={styles.tableRow}>
                  <span
                    style={{ ...styles.tableCell, ...styles.tableCellBold }}
                  >
                    {invoice.transactionNumber?.split("-").slice(-1)[0] ||
                      invoice.transactionNumber}
                  </span>
                  <span style={styles.tableCell}>
                    {formatCurrency(amountDue)}
                  </span>
                  <span style={styles.tableCell}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(status === "Paid"
                          ? styles.statusPaid
                          : overdue
                            ? styles.statusOverdue
                            : styles.statusPending),
                      }}
                    >
                      {overdue ? "Overdue" : status}
                    </span>
                  </span>
                  <span style={styles.tableCell}>
                    {status !== "Paid" && (
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "#4F46E5",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                        onClick={() => handlePayNow(invoice)}
                        disabled={payingInvoiceId === invoice.id}
                      >
                        {payingInvoiceId === invoice.id ? "..." : "Pay"}
                      </button>
                    )}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={styles.emptyState}>No invoices found</div>
          )}
        </div>

        {/* Payment History */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <div style={styles.columnTitle}>
              <div
                style={{
                  ...styles.columnTitleIcon,
                  backgroundColor: "#DBEAFE",
                }}
              >
                <CreditCard size={18} color="#3B82F6" />
              </div>
              Payment History
            </div>
            <span style={styles.viewAllLink}>View All</span>
          </div>
          <div style={styles.tableHeader}>
            <span style={styles.tableHeaderCell}>Invoice</span>
            <span style={styles.tableHeaderCell}>Amount</span>
            <span style={styles.tableHeaderCell}>Date</span>
            <span style={styles.tableHeaderCell}></span>
          </div>
          {invoices.filter((inv) => Number(inv.paidAmount || 0) > 0).length >
          0 ? (
            invoices
              .filter((inv) => Number(inv.paidAmount || 0) > 0)
              .slice(0, 5)
              .map((invoice) => (
                <div key={invoice.id} style={styles.tableRow}>
                  <span
                    style={{ ...styles.tableCell, ...styles.tableCellBold }}
                  >
                    {invoice.transactionNumber?.split("-").slice(-1)[0] ||
                      invoice.transactionNumber}
                  </span>
                  <span style={styles.tableCell}>
                    {formatCurrency(invoice.paidAmount)}
                  </span>
                  <span style={styles.tableCell}>
                    {formatDate(invoice.updatedAt)}
                  </span>
                  <span style={styles.tableCell}>
                    <span
                      style={{ ...styles.statusBadge, ...styles.statusPaid }}
                    >
                      Paid
                    </span>
                  </span>
                </div>
              ))
          ) : (
            <div style={styles.emptyState}>No payments yet</div>
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
            {overdueInvoices.length > 0 && (
              <span style={styles.criticalBadge}>
                {overdueInvoices.length} Critical
              </span>
            )}
          </div>
          <div style={styles.alertsContainer}>
            {/* Overdue Invoices Alert */}
            {overdueInvoices.length > 0 && (
              <div style={{ ...styles.alertCard, ...styles.alertCardRed }}>
                <div style={styles.alertHeader}>
                  <div style={{ ...styles.alertIcon, ...styles.alertIconRed }}>
                    <AlertCircle size={14} />
                  </div>
                  <span style={styles.alertTitle}>
                    {overdueInvoices.length} Overdue Invoice
                    {overdueInvoices.length > 1 ? "s" : ""}
                  </span>
                </div>
                <p style={styles.alertText}>
                  Total overdue amount: {formatCurrency(stats.overdueAmount)}.
                  Immediate payment required.
                </p>
                <span
                  style={styles.alertLink}
                  onClick={() => navigate("/customer/invoices")}
                >
                  Pay Now
                </span>
              </div>
            )}

            {/* Pending Invoices Alert */}
            {stats.pendingInvoices > 0 && (
              <div style={{ ...styles.alertCard, ...styles.alertCardYellow }}>
                <div style={styles.alertHeader}>
                  <div
                    style={{ ...styles.alertIcon, ...styles.alertIconYellow }}
                  >
                    <Clock size={14} />
                  </div>
                  <span style={styles.alertTitle}>Payment Reminder</span>
                </div>
                <p style={styles.alertText}>
                  You have {stats.pendingInvoices} pending invoice
                  {stats.pendingInvoices > 1 ? "s" : ""} due soon.
                </p>
                <span
                  style={{ ...styles.alertLink, ...styles.alertLinkYellow }}
                  onClick={() => navigate("/customer/invoices")}
                >
                  View Invoices
                </span>
              </div>
            )}

            {/* Contact Support */}
            <div style={{ ...styles.alertCard, ...styles.alertCardBlue }}>
              <div style={styles.alertHeader}>
                <div style={{ ...styles.alertIcon, ...styles.alertIconBlue }}>
                  <Send size={14} />
                </div>
                <span style={styles.alertTitle}>Need Help?</span>
              </div>
              <p style={styles.alertText}>
                Contact our support team for any billing inquiries or payment
                assistance.
              </p>
              <span style={{ ...styles.alertLink, ...styles.alertLinkBlue }}>
                Contact Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
