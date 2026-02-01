import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentsApi, contactsApi } from "../services/api";
import { 
  FileText, 
  Download, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Eye,
  CreditCard,
  Printer,
  ChevronLeft,
  ChevronRight,
  Home,
  ArrowLeft,
  Plus,
  Check,
  Send,
  X,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown
} from "lucide-react";

function BillPayments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    paymentType: "SEND",
    contactId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "bank",
    reference: "",
    notes: "",
  });

  // Styles
  const styles = {
    pageContainer: {
      minHeight: "100vh",
      backgroundColor: "#F9FAFB",
    },
    contentWrapper: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "32px 24px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "32px",
    },
    headerLeft: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    pageTitle: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#111827",
      margin: 0,
    },
    pageSubtitle: {
      fontSize: "14px",
      color: "#6B7280",
      margin: 0,
    },
    exportButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      backgroundColor: "#4F46E5",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    summaryCardsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "24px",
      marginBottom: "32px",
    },
    summaryCard: {
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    summaryCardHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
    },
    summaryIconContainer: {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    summaryCardTitle: {
      fontSize: "14px",
      color: "#6B7280",
      margin: 0,
    },
    summaryCardAmount: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#111827",
      margin: "0 0 8px 0",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500",
    },
    tabsContainer: {
      display: "flex",
      gap: "8px",
      marginBottom: "24px",
      borderBottom: "1px solid #E5E7EB",
      paddingBottom: "0",
    },
    tab: {
      padding: "12px 20px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      border: "none",
      backgroundColor: "transparent",
      color: "#6B7280",
      borderBottom: "2px solid transparent",
      marginBottom: "-1px",
      transition: "all 0.2s",
    },
    activeTab: {
      color: "#4F46E5",
      borderBottomColor: "#4F46E5",
    },
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflow: "hidden",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    tableHeader: {
      backgroundColor: "#F9FAFB",
    },
    th: {
      padding: "16px 20px",
      textAlign: "left",
      fontSize: "12px",
      fontWeight: "600",
      color: "#6B7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: "1px solid #E5E7EB",
    },
    td: {
      padding: "16px 20px",
      fontSize: "14px",
      color: "#374151",
      borderBottom: "1px solid #E5E7EB",
    },
    invoiceLink: {
      color: "#4F46E5",
      fontWeight: "500",
      textDecoration: "none",
      cursor: "pointer",
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500",
      border: "1px solid",
    },
    actionButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "6px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "500",
      cursor: "pointer",
      border: "1px solid",
      backgroundColor: "transparent",
      marginRight: "8px",
    },
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderTop: "1px solid #E5E7EB",
    },
    paginationText: {
      fontSize: "14px",
      color: "#6B7280",
    },
    paginationButtons: {
      display: "flex",
      gap: "8px",
    },
    paginationButton: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      padding: "8px 16px",
      fontSize: "14px",
      fontWeight: "500",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      backgroundColor: "white",
      color: "#374151",
      cursor: "pointer",
    },
    footer: {
      marginTop: "48px",
      paddingTop: "24px",
      borderTop: "1px solid #E5E7EB",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      fontSize: "14px",
      color: "#9CA3AF",
    },
    footerLinks: {
      display: "flex",
      gap: "24px",
    },
    footerLink: {
      fontSize: "14px",
      color: "#6B7280",
      textDecoration: "none",
      cursor: "pointer",
    },
    // Form and Detail styles
    card: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflow: "hidden",
    },
    cardHeader: {
      padding: "24px",
      borderBottom: "1px solid #E5E7EB",
    },
    cardBody: {
      padding: "24px",
    },
    formGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "8px",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      outline: "none",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      outline: "none",
      backgroundColor: "white",
      cursor: "pointer",
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      outline: "none",
      resize: "vertical",
      minHeight: "100px",
      boxSizing: "border-box",
    },
    primaryButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 24px",
      backgroundColor: "#4F46E5",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    secondaryButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 24px",
      backgroundColor: "white",
      color: "#374151",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    successButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 24px",
      backgroundColor: "#10B981",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    dangerButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 24px",
      backgroundColor: "#EF4444",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
    },
    navButtons: {
      display: "flex",
      gap: "12px",
    },
    radioGroup: {
      display: "flex",
      gap: "16px",
    },
    radioOption: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "16px 24px",
      borderRadius: "12px",
      cursor: "pointer",
      border: "2px solid",
      transition: "all 0.2s",
    },
    statusIndicators: {
      display: "flex",
      gap: "8px",
    },
    statusIndicator: {
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      border: "1px solid",
    },
    detailGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "24px",
    },
    detailItem: {
      padding: "16px",
      backgroundColor: "#F9FAFB",
      borderRadius: "12px",
    },
    detailLabel: {
      fontSize: "12px",
      color: "#6B7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "8px",
    },
    detailValue: {
      fontSize: "16px",
      fontWeight: "500",
      color: "#111827",
    },
    amountHighlight: {
      padding: "20px",
      background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
      borderRadius: "12px",
    },
    amountLabel: {
      fontSize: "12px",
      color: "rgba(255,255,255,0.8)",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "8px",
    },
    amountValue: {
      fontSize: "32px",
      fontWeight: "700",
      color: "white",
    },
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const paymentId = searchParams.get("id");
    if (paymentId && payments.length > 0) {
      const payment = payments.find((p) => p.id === parseInt(paymentId));
      if (payment) {
        handleViewPayment(payment);
      }
    }
  }, [searchParams, payments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, contactsRes] = await Promise.all([
        paymentsApi.getAll(),
        contactsApi.getAll(),
      ]);
      setPayments(paymentsRes.data);
      setContacts(contactsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPayment = () => {
    setSelectedPayment(null);
    setFormData({
      paymentType: "SEND",
      contactId: "",
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "bank",
      reference: "",
      notes: "",
    });
    setView("form");
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setView("detail");
  };

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      paymentType: payment.paymentType,
      contactId: payment.contactId || "",
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate.split("T")[0],
      paymentMethod: payment.paymentMethod,
      reference: payment.reference || "",
      notes: payment.notes || "",
    });
    setView("form");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        contactId: formData.contactId || null,
      };

      if (selectedPayment) {
        await paymentsApi.update(selectedPayment.id, data);
      } else {
        await paymentsApi.create(data);
      }
      await fetchData();
      setView("list");
    } catch (error) {
      console.error("Error saving payment:", error);
      alert(error.response?.data?.error || "Error saving payment");
    }
  };

  const handleConfirm = async () => {
    if (!selectedPayment) return;
    try {
      await paymentsApi.confirm(selectedPayment.id);
      await fetchData();
      const updated = (await paymentsApi.getAll()).data.find(
        (p) => p.id === selectedPayment.id
      );
      if (updated) setSelectedPayment(updated);
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert(error.response?.data?.error || "Error confirming payment");
    }
  };

  const handleCancel = async () => {
    if (!selectedPayment) return;
    if (!window.confirm("Are you sure you want to cancel this payment?")) return;

    try {
      await paymentsApi.cancel(selectedPayment.id);
      await fetchData();
      const updated = (await paymentsApi.getAll()).data.find(
        (p) => p.id === selectedPayment.id
      );
      if (updated) setSelectedPayment(updated);
    } catch (error) {
      console.error("Error cancelling payment:", error);
      alert(error.response?.data?.error || "Error cancelling payment");
    }
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    if (!window.confirm("Are you sure you want to delete this payment?")) return;

    try {
      await paymentsApi.delete(selectedPayment.id);
      await fetchData();
      setView("list");
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert(error.response?.data?.error || "Error deleting payment");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getFilteredContacts = () => {
    if (formData.paymentType === "SEND") {
      return contacts.filter((c) => c.type === "VENDOR");
    }
    return contacts.filter((c) => c.type === "CUSTOMER");
  };

  // Filter payments based on active tab
  const getFilteredPayments = () => {
    switch (activeTab) {
      case "confirmed":
        return payments.filter((p) => p.status === "CONFIRMED");
      case "draft":
        return payments.filter((p) => p.status === "DRAFT");
      case "cancelled":
        return payments.filter((p) => p.status === "CANCELLED");
      default:
        return payments;
    }
  };

  // Pagination
  const filteredPayments = getFilteredPayments();
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  // Calculate summary stats
  const totalDraft = payments.filter((p) => p.status === "DRAFT").reduce((sum, p) => sum + p.amount, 0);
  const totalCancelled = payments.filter((p) => p.status === "CANCELLED").reduce((sum, p) => sum + p.amount, 0);
  const totalConfirmed = payments.filter((p) => p.status === "CONFIRMED").reduce((sum, p) => sum + p.amount, 0);
  const draftCount = payments.filter((p) => p.status === "DRAFT").length;

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "CONFIRMED":
        return {
          backgroundColor: "#D1FAE5",
          color: "#065F46",
          borderColor: "#10B981",
        };
      case "DRAFT":
        return {
          backgroundColor: "#FEF3C7",
          color: "#92400E",
          borderColor: "#F59E0B",
        };
      case "CANCELLED":
        return {
          backgroundColor: "#FEE2E2",
          color: "#991B1B",
          borderColor: "#EF4444",
        };
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#374151",
          borderColor: "#9CA3AF",
        };
    }
  };

  // List View
  const renderListView = () => (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>Billing History</h1>
            <p style={styles.pageSubtitle}>
              Manage and track your furniture purchase billing history with Shiv Furniture.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              style={styles.primaryButton}
              onClick={handleNewPayment}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#4338CA")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4F46E5")}
            >
              <Plus size={16} />
              New Payment
            </button>
            <button
              style={styles.exportButton}
              onClick={() => alert("Export feature coming soon")}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#4338CA")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4F46E5")}
            >
              <Download size={16} />
              Export Statement
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryCardsContainer}>
          {/* Total Draft */}
          <div style={styles.summaryCard}>
            <div style={styles.summaryCardHeader}>
              <div
                style={{
                  ...styles.summaryIconContainer,
                  backgroundColor: "#EEF2FF",
                }}
              >
                <Clock size={24} color="#4F46E5" />
              </div>
              <p style={styles.summaryCardTitle}>Total Pending</p>
            </div>
            <p style={styles.summaryCardAmount}>{formatCurrency(totalDraft)}</p>
            <span
              style={{
                ...styles.badge,
                backgroundColor: "#EEF2FF",
                color: "#4F46E5",
              }}
            >
              <Clock size={12} />
              {draftCount} Drafts Pending
            </span>
          </div>

          {/* Total Cancelled */}
          <div style={styles.summaryCard}>
            <div style={styles.summaryCardHeader}>
              <div
                style={{
                  ...styles.summaryIconContainer,
                  backgroundColor: "#FEE2E2",
                }}
              >
                <AlertTriangle size={24} color="#EF4444" />
              </div>
              <p style={styles.summaryCardTitle}>Cancelled Amount</p>
            </div>
            <p style={{ ...styles.summaryCardAmount, color: "#EF4444" }}>
              {formatCurrency(totalCancelled)}
            </p>
            <span
              style={{
                ...styles.badge,
                backgroundColor: "#FEE2E2",
                color: "#991B1B",
              }}
            >
              <AlertTriangle size={12} />
              {payments.filter((p) => p.status === "CANCELLED").length} Payments Cancelled
            </span>
          </div>

          {/* Total Confirmed */}
          <div style={styles.summaryCard}>
            <div style={styles.summaryCardHeader}>
              <div
                style={{
                  ...styles.summaryIconContainer,
                  backgroundColor: "#D1FAE5",
                }}
              >
                <TrendingUp size={24} color="#10B981" />
              </div>
              <p style={styles.summaryCardTitle}>Total Confirmed</p>
            </div>
            <p style={{ ...styles.summaryCardAmount, color: "#10B981" }}>
              {formatCurrency(totalConfirmed)}
            </p>
            <span
              style={{
                ...styles.badge,
                backgroundColor: "#D1FAE5",
                color: "#065F46",
              }}
            >
              <TrendingUp size={12} />
              {payments.filter((p) => p.status === "CONFIRMED").length} Payments Confirmed
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          {[
            { key: "all", label: "All Payments" },
            { key: "confirmed", label: "Confirmed" },
            { key: "draft", label: "Draft" },
            { key: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.activeTab : {}),
              }}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#6B7280" }}>
              Loading payments...
            </div>
          ) : (
            <>
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.th}>Payment Number</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Partner</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Method</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((payment) => {
                    const statusStyle = getStatusBadgeStyle(payment.status);
                    return (
                      <tr
                        key={payment.id}
                        style={{ transition: "background-color 0.2s" }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={styles.td}>
                          <span
                            style={styles.invoiceLink}
                            onClick={() => handleViewPayment(payment)}
                          >
                            {payment.paymentNumber}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "500",
                              backgroundColor: payment.paymentType === "SEND" ? "#FEE2E2" : "#D1FAE5",
                              color: payment.paymentType === "SEND" ? "#991B1B" : "#065F46",
                            }}
                          >
                            {payment.paymentType === "SEND" ? (
                              <>
                                <ArrowUp size={12} /> Send
                              </>
                            ) : (
                              <>
                                <ArrowDown size={12} /> Receive
                              </>
                            )}
                          </span>
                        </td>
                        <td style={styles.td}>{payment.contact?.name || "-"}</td>
                        <td style={styles.td}>
                          {new Date(payment.paymentDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td style={{ ...styles.td, textTransform: "capitalize" }}>
                          {payment.paymentMethod}
                        </td>
                        <td style={{ ...styles.td, textAlign: "right", fontWeight: "600" }}>
                          {formatCurrency(payment.amount)}
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...statusStyle,
                            }}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button
                            style={{
                              ...styles.actionButton,
                              borderColor: "#D1D5DB",
                              color: "#374151",
                            }}
                            onClick={() => handleViewPayment(payment)}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = "#F3F4F6";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          {payment.status === "DRAFT" && (
                            <button
                              style={{
                                ...styles.actionButton,
                                borderColor: "#4F46E5",
                                color: "#4F46E5",
                              }}
                              onClick={async () => {
                                try {
                                  await paymentsApi.confirm(payment.id);
                                  await fetchData();
                                } catch (error) {
                                  alert(error.response?.data?.error || "Error confirming payment");
                                }
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "#EEF2FF";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              <Check size={14} />
                              Confirm
                            </button>
                          )}
                          {payment.status === "CONFIRMED" && (
                            <button
                              style={{
                                ...styles.actionButton,
                                borderColor: "#D1D5DB",
                                color: "#6B7280",
                                padding: "6px 8px",
                              }}
                              onClick={() => window.print()}
                            >
                              <Printer size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedPayments.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          padding: "48px",
                          color: "#9CA3AF",
                        }}
                      >
                        No payments found. Click "New Payment" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {filteredPayments.length > 0 && (
                <div style={styles.pagination}>
                  <span style={styles.paginationText}>
                    Showing {startIndex + 1} to{" "}
                    {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of{" "}
                    {filteredPayments.length} payments
                  </span>
                  <div style={styles.paginationButtons}>
                    <button
                      style={{
                        ...styles.paginationButton,
                        opacity: currentPage === 1 ? 0.5 : 1,
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      style={{
                        ...styles.paginationButton,
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      }}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>© 2023 Shiv Furniture Portal. All rights reserved.</span>
          <div style={styles.footerLinks}>
            <span style={styles.footerLink}>Privacy Policy</span>
            <span style={styles.footerLink}>Terms of Service</span>
            <span style={styles.footerLink}>Support</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Form View
  const renderFormView = () => (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <h1 style={styles.pageTitle}>
            {selectedPayment ? `Edit: ${selectedPayment.paymentNumber}` : "New Bill Payment"}
          </h1>
          <div style={styles.navButtons}>
            <button
              style={styles.secondaryButton}
              onClick={() => navigate("/")}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <Home size={16} />
              Home
            </button>
            <button
              style={styles.secondaryButton}
              onClick={() => setView("list")}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.card}>
            {/* Payment Type Section */}
            <div style={styles.cardHeader}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Payment Type</label>
                <div style={styles.radioGroup}>
                  <label
                    style={{
                      ...styles.radioOption,
                      backgroundColor: formData.paymentType === "SEND" ? "#FEE2E2" : "white",
                      borderColor: formData.paymentType === "SEND" ? "#EF4444" : "#E5E7EB",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value="SEND"
                      checked={formData.paymentType === "SEND"}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentType: e.target.value, contactId: "" })
                      }
                      style={{ accentColor: "#EF4444" }}
                    />
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ArrowUp size={18} color={formData.paymentType === "SEND" ? "#EF4444" : "#6B7280"} />
                      <span style={{ fontWeight: "500", color: formData.paymentType === "SEND" ? "#991B1B" : "#374151" }}>
                        Send Money
                      </span>
                    </span>
                  </label>
                  <label
                    style={{
                      ...styles.radioOption,
                      backgroundColor: formData.paymentType === "RECEIVE" ? "#D1FAE5" : "white",
                      borderColor: formData.paymentType === "RECEIVE" ? "#10B981" : "#E5E7EB",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value="RECEIVE"
                      checked={formData.paymentType === "RECEIVE"}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentType: e.target.value, contactId: "" })
                      }
                      style={{ accentColor: "#10B981" }}
                    />
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ArrowDown size={18} color={formData.paymentType === "RECEIVE" ? "#10B981" : "#6B7280"} />
                      <span style={{ fontWeight: "500", color: formData.paymentType === "RECEIVE" ? "#065F46" : "#374151" }}>
                        Receive Money
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div style={styles.cardBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Partner */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {formData.paymentType === "SEND" ? "Vendor" : "Customer"}
                  </label>
                  <select
                    style={styles.select}
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                    required
                  >
                    <option value="">
                      Select {formData.paymentType === "SEND" ? "Vendor" : "Customer"}
                    </option>
                    {getFilteredContacts().map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px", display: "block" }}>
                    Auto fill partner name from Invoice/Bill
                  </span>
                </div>

                {/* Date */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px", display: "block" }}>
                    Default: Today's Date
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Amount */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Amount</label>
                  <input
                    type="number"
                    style={{ ...styles.input, fontSize: "18px", fontWeight: "600", color: "#4F46E5" }}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                  <span style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px", display: "block" }}>
                    Auto fill amount due from Invoice/Bill
                  </span>
                </div>

                {/* Payment Method */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Via</label>
                  <select
                    style={styles.select}
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="bank">🏦 Bank</option>
                    <option value="cash">💵 Cash</option>
                    <option value="upi">📱 UPI</option>
                    <option value="card">💳 Card</option>
                  </select>
                  <span style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px", display: "block" }}>
                    Default: Bank (can be changed to Cash)
                  </span>
                </div>
              </div>

              {/* Reference */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Reference</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Bank ref, UPI ID, etc."
                />
              </div>

              {/* Notes */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  style={styles.textarea}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px", paddingTop: "16px", borderTop: "1px solid #E5E7EB" }}>
                <button
                  type="submit"
                  style={styles.successButton}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#10B981")}
                >
                  <Check size={16} />
                  {selectedPayment ? "Update Payment" : "Save Draft"}
                </button>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => setView("list")}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  // Detail View
  const renderDetailView = () => {
    if (!selectedPayment) return null;

    const statusStyle = getStatusBadgeStyle(selectedPayment.status);

    return (
      <div style={styles.pageContainer}>
        <div style={styles.contentWrapper}>
          {/* Top Bar */}
          <div style={styles.topBar}>
            <div>
              <h1 style={styles.pageTitle}>{selectedPayment.paymentNumber}</h1>
              <p style={styles.pageSubtitle}>Payment Details</p>
            </div>
            <div style={styles.navButtons}>
              <button
                style={styles.primaryButton}
                onClick={handleNewPayment}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#4338CA")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4F46E5")}
              >
                <Plus size={16} />
                New
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => navigate("/")}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
              >
                <Home size={16} />
                Home
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => setView("list")}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </div>

          <div style={styles.card}>
            {/* Action Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                backgroundColor: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <div style={{ display: "flex", gap: "12px" }}>
                {selectedPayment.status === "DRAFT" && (
                  <>
                    <button
                      style={styles.successButton}
                      onClick={handleConfirm}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#10B981")}
                    >
                      <Check size={16} />
                      Confirm
                    </button>
                    <button
                      style={styles.secondaryButton}
                      onClick={() => window.print()}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <Printer size={16} />
                      Print
                    </button>
                    <button
                      style={styles.secondaryButton}
                      onClick={() => alert("Send feature coming soon")}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <Send size={16} />
                      Send
                    </button>
                    <button
                      style={{ ...styles.secondaryButton, color: "#EF4444", borderColor: "#EF4444" }}
                      onClick={handleCancel}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#FEE2E2")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </>
                )}
              </div>

              {/* Status Indicators */}
              <div style={styles.statusIndicators}>
                <span
                  style={{
                    ...styles.statusIndicator,
                    backgroundColor: selectedPayment.status === "DRAFT" ? "#FEF3C7" : "#F3F4F6",
                    color: selectedPayment.status === "DRAFT" ? "#92400E" : "#9CA3AF",
                    borderColor: selectedPayment.status === "DRAFT" ? "#F59E0B" : "#E5E7EB",
                  }}
                >
                  ● Draft
                </span>
                <span
                  style={{
                    ...styles.statusIndicator,
                    backgroundColor: selectedPayment.status === "CONFIRMED" ? "#D1FAE5" : "#F3F4F6",
                    color: selectedPayment.status === "CONFIRMED" ? "#065F46" : "#9CA3AF",
                    borderColor: selectedPayment.status === "CONFIRMED" ? "#10B981" : "#E5E7EB",
                  }}
                >
                  ● Confirmed
                </span>
                <span
                  style={{
                    ...styles.statusIndicator,
                    backgroundColor: selectedPayment.status === "CANCELLED" ? "#FEE2E2" : "#F3F4F6",
                    color: selectedPayment.status === "CANCELLED" ? "#991B1B" : "#9CA3AF",
                    borderColor: selectedPayment.status === "CANCELLED" ? "#EF4444" : "#E5E7EB",
                  }}
                >
                  ● Cancelled
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div style={styles.cardBody}>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <p style={styles.detailLabel}>Payment Type</p>
                  <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "2px solid",
                        fontWeight: "500",
                        backgroundColor: selectedPayment.paymentType === "SEND" ? "#FEE2E2" : "#F3F4F6",
                        color: selectedPayment.paymentType === "SEND" ? "#991B1B" : "#9CA3AF",
                        borderColor: selectedPayment.paymentType === "SEND" ? "#EF4444" : "#E5E7EB",
                      }}
                    >
                      <ArrowUp size={16} /> Send
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "2px solid",
                        fontWeight: "500",
                        backgroundColor: selectedPayment.paymentType === "RECEIVE" ? "#D1FAE5" : "#F3F4F6",
                        color: selectedPayment.paymentType === "RECEIVE" ? "#065F46" : "#9CA3AF",
                        borderColor: selectedPayment.paymentType === "RECEIVE" ? "#10B981" : "#E5E7EB",
                      }}
                    >
                      <ArrowDown size={16} /> Receive
                    </span>
                  </div>
                </div>

                <div style={styles.detailItem}>
                  <p style={styles.detailLabel}>Partner</p>
                  <p style={styles.detailValue}>{selectedPayment.contact?.name || "-"}</p>
                </div>

                <div style={styles.detailItem}>
                  <p style={styles.detailLabel}>Payment Date</p>
                  <p style={styles.detailValue}>
                    {new Date(selectedPayment.paymentDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div style={styles.detailItem}>
                  <p style={styles.detailLabel}>Payment Method</p>
                  <p style={{ ...styles.detailValue, textTransform: "capitalize" }}>
                    {selectedPayment.paymentMethod}
                  </p>
                </div>

                <div style={styles.detailItem}>
                  <p style={styles.detailLabel}>Reference</p>
                  <p style={{ ...styles.detailValue, color: "#4F46E5" }}>
                    {selectedPayment.reference || "-"}
                  </p>
                </div>

                <div style={styles.amountHighlight}>
                  <p style={styles.amountLabel}>Amount</p>
                  <p style={styles.amountValue}>{formatCurrency(selectedPayment.amount)}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedPayment.notes && (
                <div style={{ marginTop: "24px" }}>
                  <div style={styles.detailItem}>
                    <p style={styles.detailLabel}>Notes</p>
                    <p style={styles.detailValue}>{selectedPayment.notes}</p>
                  </div>
                </div>
              )}

              {/* Allocations */}
              {selectedPayment.allocations?.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <p style={{ ...styles.detailLabel, marginBottom: "16px" }}>Applied To</p>
                  <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #E5E7EB" }}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr>
                          <th style={styles.th}>Transaction</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPayment.allocations.map((alloc) => (
                          <tr key={alloc.id}>
                            <td style={styles.td}>
                              <span
                                style={styles.invoiceLink}
                                onClick={() => {
                                  const type = alloc.transaction?.type;
                                  if (type === "VENDOR_BILL") {
                                    navigate(`/vendor-bills?id=${alloc.transactionId}`);
                                  } else if (type === "CUSTOMER_INVOICE") {
                                    navigate(`/customer-invoices?id=${alloc.transactionId}`);
                                  }
                                }}
                              >
                                {alloc.transaction?.transactionNumber || alloc.transactionId}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "right", fontWeight: "600" }}>
                              {formatCurrency(alloc.allocatedAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Edit/Delete for Draft */}
              {selectedPayment.status === "DRAFT" && (
                <div style={{ display: "flex", gap: "12px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #E5E7EB" }}>
                  <button
                    style={styles.primaryButton}
                    onClick={() => handleEditPayment(selectedPayment)}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#4338CA")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4F46E5")}
                  >
                    <Edit size={16} />
                    Edit Payment
                  </button>
                  <button
                    style={styles.dangerButton}
                    onClick={handleDelete}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#DC2626")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#EF4444")}
                  >
                    <Trash2 size={16} />
                    Delete Payment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <span style={styles.footerText}>© 2023 Shiv Furniture Portal. All rights reserved.</span>
            <div style={styles.footerLinks}>
              <span style={styles.footerLink}>Privacy Policy</span>
              <span style={styles.footerLink}>Terms of Service</span>
              <span style={styles.footerLink}>Support</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {view === "list" && renderListView()}
      {view === "form" && renderFormView()}
      {view === "detail" && renderDetailView()}
    </>
  );
}

export default BillPayments;
