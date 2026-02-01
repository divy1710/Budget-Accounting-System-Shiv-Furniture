import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transactionsApi, razorpayApi } from "../../services/api";
import { generateInvoicePDF } from "../../services/pdfGenerator";
import {
  FileText,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ArrowLeft,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function CustomerInvoices() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [view, setView] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const itemsPerPage = 8;

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
      fetchInvoices();
    }
  }, [customer]);

  const fetchInvoices = async () => {
    try {
      const response = await transactionsApi.getAll({
        type: "CUSTOMER_INVOICE",
        contactId: customer.id,
      });
      setInvoices(response.data.filter((inv) => inv.status === "CONFIRMED"));
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
            fetchInvoices();
            setSelectedInvoice(null);
            setView("list");
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

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus === "all") return true;
    const status = getPaymentStatus(inv);
    return status === filterStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
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
    // Header
    headerSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "32px",
    },
    backButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "white",
      border: "1px solid #E2E8F0",
      borderRadius: "8px",
      fontSize: "14px",
      color: "#475569",
      cursor: "pointer",
      marginBottom: "16px",
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
    // Stats Row
    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "16px",
      marginBottom: "24px",
    },
    statCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "16px 20px",
      border: "1px solid #E2E8F0",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    statIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#1E293B",
    },
    statLabel: {
      fontSize: "12px",
      color: "#64748B",
    },
    // Filter Tabs
    filterTabs: {
      display: "flex",
      gap: "8px",
      marginBottom: "20px",
    },
    filterTab: {
      padding: "8px 16px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      border: "1px solid #E2E8F0",
      backgroundColor: "white",
      color: "#64748B",
      transition: "all 0.2s",
    },
    filterTabActive: {
      backgroundColor: "#4F46E5",
      color: "white",
      borderColor: "#4F46E5",
    },
    // Table Container
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      overflow: "hidden",
    },
    tableHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderBottom: "1px solid #E2E8F0",
    },
    tableTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1E293B",
      display: "flex",
      alignItems: "center",
      gap: "8px",
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
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      textAlign: "left",
      padding: "12px 20px",
      fontSize: "11px",
      fontWeight: "600",
      color: "#64748B",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      borderBottom: "1px solid #E2E8F0",
      backgroundColor: "#F8FAFC",
    },
    td: {
      padding: "16px 20px",
      fontSize: "14px",
      color: "#334155",
      borderBottom: "1px solid #F1F5F9",
    },
    invoiceNo: {
      fontWeight: "600",
      color: "#4F46E5",
      cursor: "pointer",
    },
    dueDateOverdue: {
      color: "#EF4444",
      fontWeight: "500",
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
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
    actionBtn: {
      padding: "8px 16px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
    },
    payNowBtn: {
      backgroundColor: "#4F46E5",
      color: "white",
    },
    viewBtn: {
      backgroundColor: "#F1F5F9",
      color: "#475569",
    },
    downloadBtn: {
      backgroundColor: "transparent",
      color: "#4F46E5",
    },
    // Pagination
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderTop: "1px solid #E2E8F0",
    },
    paginationInfo: {
      fontSize: "13px",
      color: "#64748B",
    },
    paginationButtons: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    pageBtn: {
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
    pageBtnDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
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
    // Detail View
    detailContainer: {
      backgroundColor: "white",
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      overflow: "hidden",
    },
    detailHeader: {
      padding: "24px",
      borderBottom: "1px solid #E2E8F0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    invoiceInfo: {
      flex: 1,
    },
    invoiceNumber: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#1E293B",
      marginBottom: "8px",
    },
    invoiceMeta: {
      display: "flex",
      gap: "24px",
      fontSize: "14px",
      color: "#64748B",
    },
    metaItem: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    detailActions: {
      display: "flex",
      gap: "12px",
    },
    amountSection: {
      padding: "24px",
      backgroundColor: "#F8FAFC",
      borderBottom: "1px solid #E2E8F0",
    },
    amountGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "24px",
    },
    amountCard: {
      textAlign: "center",
    },
    amountLabel: {
      fontSize: "12px",
      color: "#64748B",
      marginBottom: "4px",
    },
    amountValue: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#1E293B",
    },
    amountDue: {
      color: "#EF4444",
    },
    amountPaid: {
      color: "#16A34A",
    },
    lineItemsSection: {
      padding: "24px",
    },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1E293B",
      marginBottom: "16px",
    },
    lineItemsTable: {
      width: "100%",
      borderCollapse: "collapse",
    },
    lineItemTh: {
      textAlign: "left",
      padding: "12px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#64748B",
      borderBottom: "1px solid #E2E8F0",
      backgroundColor: "#F8FAFC",
    },
    lineItemTd: {
      padding: "12px",
      fontSize: "14px",
      color: "#334155",
      borderBottom: "1px solid #F1F5F9",
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#64748B",
    },
    emptyIcon: {
      width: "64px",
      height: "64px",
      margin: "0 auto 16px",
      backgroundColor: "#F1F5F9",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#94A3B8",
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

  // Invoice Detail View
  if (view === "detail" && selectedInvoice) {
    const status = getPaymentStatus(selectedInvoice);
    const amountDue = calculateAmountDue(selectedInvoice);

    return (
      <div style={styles.pageContainer}>
        <div style={styles.contentWrapper}>
          <button
            style={styles.backButton}
            onClick={() => {
              setView("list");
              setSelectedInvoice(null);
            }}
          >
            <ArrowLeft size={16} />
            Back to Invoices
          </button>

          <div style={styles.detailContainer}>
            {/* Header */}
            <div style={styles.detailHeader}>
              <div style={styles.invoiceInfo}>
                <div style={styles.invoiceNumber}>
                  {selectedInvoice.transactionNumber}
                </div>
                <div style={styles.invoiceMeta}>
                  <span style={styles.metaItem}>
                    <Calendar size={14} />
                    Invoice Date: {formatDate(selectedInvoice.transactionDate)}
                  </span>
                  <span style={styles.metaItem}>
                    <Clock size={14} />
                    Due Date: {formatDate(selectedInvoice.dueDate)}
                  </span>
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
                    {status === "PAID" ? (
                      <CheckCircle size={12} />
                    ) : status === "PARTIAL" ? (
                      <Clock size={12} />
                    ) : (
                      <AlertTriangle size={12} />
                    )}
                    {status === "PAID"
                      ? "Paid"
                      : status === "PARTIAL"
                        ? "Partial"
                        : "Unpaid"}
                  </span>
                </div>
              </div>
              <div style={styles.detailActions}>
                <button
                  style={{ ...styles.actionBtn, ...styles.viewBtn }}
                  onClick={() => generateInvoicePDF(selectedInvoice)}
                >
                  <Download size={16} />
                  Download PDF
                </button>
                {status !== "PAID" && (
                  <button
                    style={{ ...styles.actionBtn, ...styles.payNowBtn }}
                    onClick={() => handlePayNow(selectedInvoice)}
                    disabled={payingInvoiceId === selectedInvoice.id}
                  >
                    <CreditCard size={16} />
                    {payingInvoiceId === selectedInvoice.id
                      ? "Processing..."
                      : `Pay ${formatCurrency(amountDue)}`}
                  </button>
                )}
              </div>
            </div>

            {/* Amount Section */}
            <div style={styles.amountSection}>
              <div style={styles.amountGrid}>
                <div style={styles.amountCard}>
                  <div style={styles.amountLabel}>Total Amount</div>
                  <div style={styles.amountValue}>
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </div>
                </div>
                <div style={styles.amountCard}>
                  <div style={styles.amountLabel}>Paid Amount</div>
                  <div style={{ ...styles.amountValue, ...styles.amountPaid }}>
                    {formatCurrency(selectedInvoice.paidAmount || 0)}
                  </div>
                </div>
                <div style={styles.amountCard}>
                  <div style={styles.amountLabel}>Amount Due</div>
                  <div
                    style={{
                      ...styles.amountValue,
                      ...(amountDue > 0 ? styles.amountDue : styles.amountPaid),
                    }}
                  >
                    {formatCurrency(amountDue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div style={styles.lineItemsSection}>
              <div style={styles.sectionTitle}>Line Items</div>
              <table style={styles.lineItemsTable}>
                <thead>
                  <tr>
                    <th style={styles.lineItemTh}>#</th>
                    <th style={styles.lineItemTh}>Product</th>
                    <th style={{ ...styles.lineItemTh, textAlign: "center" }}>
                      Qty
                    </th>
                    <th style={{ ...styles.lineItemTh, textAlign: "right" }}>
                      Unit Price
                    </th>
                    <th style={{ ...styles.lineItemTh, textAlign: "right" }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.lines || []).map((line, idx) => (
                    <tr key={line.id || idx}>
                      <td style={styles.lineItemTd}>{idx + 1}</td>
                      <td style={styles.lineItemTd}>
                        {line.product?.name || "Product"}
                      </td>
                      <td style={{ ...styles.lineItemTd, textAlign: "center" }}>
                        {line.quantity}
                      </td>
                      <td style={{ ...styles.lineItemTd, textAlign: "right" }}>
                        {formatCurrency(line.unitPrice)}
                      </td>
                      <td style={{ ...styles.lineItemTd, textAlign: "right" }}>
                        {formatCurrency(line.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stats
  const totalInvoices = invoices.length;
  const paidCount = invoices.filter(
    (i) => getPaymentStatus(i) === "PAID",
  ).length;
  const unpaidCount = invoices.filter(
    (i) => getPaymentStatus(i) === "NOT_PAID",
  ).length;
  const partialCount = invoices.filter(
    (i) => getPaymentStatus(i) === "PARTIAL",
  ).length;

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        {/* Header */}
        <button
          style={styles.backButton}
          onClick={() => navigate("/customer/dashboard")}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.pageTitle}>My Invoices</h1>
            <p style={styles.pageSubtitle}>View and pay your invoices online</p>
          </div>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIcon,
                backgroundColor: "#EEF2FF",
                color: "#4F46E5",
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={styles.statValue}>{totalInvoices}</div>
              <div style={styles.statLabel}>Total Invoices</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIcon,
                backgroundColor: "#DCFCE7",
                color: "#16A34A",
              }}
            >
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={styles.statValue}>{paidCount}</div>
              <div style={styles.statLabel}>Paid</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIcon,
                backgroundColor: "#FEF9C3",
                color: "#CA8A04",
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={styles.statValue}>{partialCount}</div>
              <div style={styles.statLabel}>Partial</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIcon,
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={styles.statValue}>{unpaidCount}</div>
              <div style={styles.statLabel}>Unpaid</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterTabs}>
          {[
            { key: "all", label: "All Invoices" },
            { key: "NOT_PAID", label: "Unpaid" },
            { key: "PARTIAL", label: "Partial" },
            { key: "PAID", label: "Paid" },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.filterTab,
                ...(filterStatus === tab.key ? styles.filterTabActive : {}),
              }}
              onClick={() => {
                setFilterStatus(tab.key);
                setCurrentPage(1);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <div style={styles.tableTitle}>
              <FileText size={18} />
              Invoices ({filteredInvoices.length})
            </div>
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
          </div>

          {filteredInvoices.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <FileText size={32} />
              </div>
              <p>No invoices found</p>
            </div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Invoice No</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Due Date</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Total</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Due</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((invoice) => {
                    const status = getPaymentStatus(invoice);
                    const amountDue = calculateAmountDue(invoice);
                    const overdue = isOverdue(invoice);

                    return (
                      <tr key={invoice.id}>
                        <td
                          style={{ ...styles.td, ...styles.invoiceNo }}
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setView("detail");
                          }}
                        >
                          {invoice.transactionNumber}
                        </td>
                        <td style={styles.td}>
                          {formatDate(invoice.transactionDate)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            ...(overdue ? styles.dueDateOverdue : {}),
                          }}
                        >
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            textAlign: "right",
                            fontWeight: "600",
                            color: amountDue > 0 ? "#EF4444" : "#16A34A",
                          }}
                        >
                          {formatCurrency(amountDue)}
                        </td>
                        <td style={styles.td}>
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
                                : "Unpaid"}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              style={{ ...styles.actionBtn, ...styles.viewBtn }}
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setView("detail");
                              }}
                            >
                              <Eye size={14} />
                            </button>
                            {status !== "PAID" && (
                              <button
                                style={{
                                  ...styles.actionBtn,
                                  ...styles.payNowBtn,
                                }}
                                onClick={() => handlePayNow(invoice)}
                                disabled={payingInvoiceId === invoice.id}
                              >
                                {payingInvoiceId === invoice.id
                                  ? "..."
                                  : "Pay Now"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <div style={styles.paginationInfo}>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredInvoices.length,
                    )}{" "}
                    of {filteredInvoices.length}
                  </div>
                  <div style={styles.paginationButtons}>
                    <button
                      style={{
                        ...styles.pageBtn,
                        ...(currentPage === 1 ? styles.pageBtnDisabled : {}),
                      }}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
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
                    <button
                      style={{
                        ...styles.pageBtn,
                        ...(currentPage === totalPages
                          ? styles.pageBtnDisabled
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
