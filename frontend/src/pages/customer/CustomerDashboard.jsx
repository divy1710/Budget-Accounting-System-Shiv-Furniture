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
      const now = new Date();
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
            if (dueDate < now) {
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
    return (
      new Date(invoice.dueDate) < new Date() && calculateAmountDue(invoice) > 0
    );
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
        transactionId: invoice.id,
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
              transactionId: invoice.id,
              contactId: customer.id,
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
          ...styles.pageContainer,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div style={styles.titleSection}>
            <h1 style={styles.pageTitle}>Customer Portal Dashboard</h1>
            <p style={styles.pageSubtitle}>
              Manage your furniture purchase invoices, bills, and account
              statements.
            </p>
          </div>
          <div style={styles.headerButtons}>
            <button style={styles.statementBtn}>
              <Download size={16} />
              Statement
            </button>
            <button
              style={styles.newRequestBtn}
              onClick={() => navigate("/customer/invoices")}
            >
              + New Request
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Outstanding</div>
            <div style={styles.statValue}>
              {formatCurrency(stats.totalOutstanding)}
              <span style={styles.statTrend}>
                <TrendingDown size={14} />
                -2%
              </span>
            </div>
            <div style={styles.statSubtext}>
              Current balance across all projects
            </div>
            <div style={{ ...styles.statIcon, ...styles.statIconBlue }}>
              <Receipt size={20} />
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Overdue Amount</div>
            <div style={{ ...styles.statValue, color: "#EF4444" }}>
              {formatCurrency(stats.overdueAmount)}
              <span style={styles.statTrendNegative}>
                <TrendingDown size={14} />
                -5%
              </span>
            </div>
            <div style={styles.statSubtext}>Requires immediate attention</div>
            <div style={{ ...styles.statIcon, ...styles.statIconRed }}>
              <AlertCircle size={20} />
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Next Payment Due</div>
            <div style={styles.statValue}>
              {stats.nextPaymentDue
                ? formatDate(stats.nextPaymentDue)
                : "No pending"}
            </div>
            <div style={styles.statSubtext}>Automatic payment scheduled</div>
            <div style={{ ...styles.statIcon, ...styles.statIconBlue }}>
              <Calendar size={20} />
            </div>
          </div>
        </div>

        {/* Tabs & Table Section */}
        <div style={styles.tabsContainer}>
          {/* Tabs Header */}
          <div style={styles.tabsHeader}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === "invoices" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("invoices")}
            >
              <FileText size={16} />
              Invoices
              <span style={styles.tabBadge}>{invoices.length}</span>
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === "bills" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("bills")}
            >
              <Receipt size={16} />
              Bills
              <span style={styles.tabBadge}>{bills.length}</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <div style={styles.filterButtons}>
              <button style={styles.filterBtn}>
                <Filter size={14} />
                Filter
              </button>
              <button style={styles.filterBtn}>
                <ArrowUpDown size={14} />
                Sort
              </button>
            </div>
            <div style={styles.showingText}>
              Showing {paginatedInvoices.length} of {invoices.length} invoices
            </div>
          </div>

          {/* Table */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Invoice No</th>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Due Date</th>
                <th style={styles.tableHeader}>Amount Due</th>
                <th style={styles.tableHeader}>Status</th>
                <th style={{ ...styles.tableHeader, textAlign: "right" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((invoice) => {
                const status = getPaymentStatus(invoice);
                const amountDue = calculateAmountDue(invoice);
                const overdue = isOverdue(invoice);

                return (
                  <tr key={invoice.id} style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.invoiceNo }}>
                      #{invoice.transactionNumber}
                    </td>
                    <td style={styles.tableCell}>
                      {formatDate(invoice.transactionDate)}
                    </td>
                    <td
                      style={{
                        ...styles.tableCell,
                        ...(overdue ? styles.dueDateOverdue : {}),
                      }}
                    >
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td style={styles.tableCell}>
                      {formatCurrency(amountDue)}
                    </td>
                    <td style={styles.tableCell}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(status === "PAID"
                            ? styles.statusPaid
                            : status === "PARTIAL"
                              ? styles.statusPartial
                              : styles.statusNotPaid),
                        }}
                      >
                        {status === "PAID"
                          ? "Paid"
                          : status === "PARTIAL"
                            ? "Partial"
                            : "Not Paid"}
                      </span>
                    </td>
                    <td style={{ ...styles.tableCell, textAlign: "right" }}>
                      {status === "PAID" ? (
                        <button
                          style={{ ...styles.actionBtn, ...styles.viewPdfBtn }}
                          onClick={() => generateInvoicePDF(invoice)}
                        >
                          View PDF
                        </button>
                      ) : (
                        <button
                          style={{ ...styles.actionBtn, ...styles.payNowBtn }}
                          onClick={() => handlePayNow(invoice)}
                          disabled={payingInvoiceId === invoice.id}
                        >
                          {payingInvoiceId === invoice.id
                            ? "Processing..."
                            : "Pay Now"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      ...styles.tableCell,
                      textAlign: "center",
                      color: "#64748B",
                      padding: "40px",
                    }}
                  >
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === 1 ? styles.paginationBtnDisabled : {}),
                }}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <div style={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      style={{
                        ...styles.pageNumber,
                        ...(currentPage === page
                          ? styles.pageNumberActive
                          : {}),
                      }}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
              <button
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === totalPages
                    ? styles.paginationBtnDisabled
                    : {}),
                }}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div style={styles.helpSection}>
          <div style={{ ...styles.helpCard, ...styles.helpCardBlue }}>
            <div style={styles.helpIcon}>
              <HelpCircle size={20} />
            </div>
            <div>
              <div style={styles.helpTitle}>Need help with an invoice?</div>
              <div style={styles.helpText}>
                If you notice any discrepancies in your billing, please contact
                our accounts department directly.
              </div>
              <a style={styles.helpLink}>Contact Support →</a>
            </div>
          </div>

          <div style={styles.helpCard}>
            <div style={{ ...styles.helpIcon, ...styles.helpIconGray }}>
              <CreditCard size={20} />
            </div>
            <div>
              <div style={styles.helpTitle}>Payment Methods</div>
              <div style={styles.helpText}>
                We accept all major credit cards, bank transfers, and corporate
                purchasing cards.
              </div>
              <a style={styles.helpLink}>Manage Wallet →</a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <span>🏠</span>© {new Date().getFullYear()} Shiv Furniture Portal.
            All rights reserved.
          </div>
          <div style={styles.footerLinks}>
            <a style={styles.footerLink}>Privacy Policy</a>
            <a style={styles.footerLink}>Terms of Service</a>
            <a style={styles.footerLink}>Contact Us</a>
          </div>
        </div>
      </div>
    </div>
  );
}
