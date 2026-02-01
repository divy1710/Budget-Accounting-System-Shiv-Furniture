import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  transactionsApi,
  contactsApi,
  productsApi,
  analyticalAccountsApi,
  paymentsApi,
} from "../services/api";
import { generateInvoicePDF } from "../services/pdfGenerator";
import {
  FileText,
  Download,
  Printer,
  CreditCard,
  Plus,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Home,
  ArrowLeft,
  Check,
  X,
  Edit,
  Package,
  Globe,
  Mail,
  AlertCircle,
} from "lucide-react";

function CustomerInvoices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analyticalAccounts, setAnalyticalAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    customerId: "",
    reference: "",
    transactionDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    lines: [
      { productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 },
    ],
  });

  // Styles
  const styles = {
    pageContainer: {
      minHeight: "100vh",
      backgroundColor: "#F9FAFB",
    },
    contentWrapper: {
      maxWidth: "900px",
      margin: "0 auto",
      padding: "32px 24px",
    },
    // Detail View - Invoice Header
    invoiceHeader: {
      marginBottom: "24px",
    },
    invoiceTitle: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "8px",
    },
    invoiceTitleText: {
      fontSize: "32px",
      fontWeight: "700",
      color: "#111827",
      margin: 0,
    },
    statusBadge: {
      padding: "4px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase",
    },
    invoiceSubtitle: {
      fontSize: "14px",
      color: "#6B7280",
    },
    headerActions: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "16px",
    },
    actionButtons: {
      display: "flex",
      gap: "12px",
    },
    pdfButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      backgroundColor: "white",
      color: "#374151",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    printButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      backgroundColor: "white",
      color: "#374151",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    // Amount Due Banner
    amountDueBanner: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      backgroundColor: "#EEF2FF",
      borderRadius: "12px",
      marginBottom: "24px",
    },
    amountDueLeft: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    amountDueIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      backgroundColor: "#4F46E5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    amountDueInfo: {
      display: "flex",
      flexDirection: "column",
    },
    amountDueTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#111827",
      margin: 0,
    },
    amountDueSubtitle: {
      fontSize: "14px",
      color: "#6B7280",
      margin: 0,
    },
    payNowBtn: {
      padding: "12px 32px",
      backgroundColor: "#4F46E5",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
    // Invoice Paper
    invoicePaper: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #E5E7EB",
      overflow: "hidden",
    },
    invoicePaperContent: {
      padding: "40px",
    },
    // Company Header
    companyHeader: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "32px",
      paddingBottom: "32px",
      borderBottom: "1px solid #E5E7EB",
    },
    companyInfo: {
      display: "flex",
      flexDirection: "column",
    },
    companyName: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#4F46E5",
      margin: "0 0 12px 0",
    },
    companyAddress: {
      fontSize: "14px",
      color: "#6B7280",
      lineHeight: "1.6",
      margin: 0,
    },
    invoiceToSection: {
      textAlign: "right",
    },
    invoiceToLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#6B7280",
      textTransform: "uppercase",
      marginBottom: "8px",
    },
    invoiceToName: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#111827",
      margin: "0 0 8px 0",
    },
    invoiceToAddress: {
      fontSize: "14px",
      color: "#6B7280",
      lineHeight: "1.6",
      margin: 0,
    },
    // Invoice Meta
    invoiceMeta: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "24px",
      padding: "20px 0",
      borderBottom: "1px solid #E5E7EB",
      marginBottom: "24px",
    },
    metaItem: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    metaLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#4F46E5",
      textTransform: "uppercase",
    },
    metaValue: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#111827",
    },
    // Line Items Table
    lineItemsTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "24px",
    },
    tableTh: {
      padding: "12px 16px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#6B7280",
      textTransform: "uppercase",
      borderBottom: "2px solid #E5E7EB",
      textAlign: "left",
    },
    tableTd: {
      padding: "16px",
      fontSize: "14px",
      color: "#374151",
      borderBottom: "1px solid #E5E7EB",
    },
    productName: {
      fontWeight: "500",
      color: "#111827",
      marginBottom: "2px",
    },
    productDescription: {
      fontSize: "13px",
      color: "#6B7280",
    },
    // Totals Section
    totalsSection: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "24px",
    },
    totalsBox: {
      minWidth: "280px",
    },
    totalsRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
    },
    totalsLabel: {
      fontSize: "14px",
      color: "#6B7280",
    },
    totalsValue: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#111827",
    },
    discountValue: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#10B981",
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "16px 0",
      borderTop: "2px solid #E5E7EB",
      marginTop: "8px",
    },
    totalLabel: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#111827",
    },
    totalValue: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#4F46E5",
    },
    // Terms Section
    termsSection: {
      borderTop: "1px solid #E5E7EB",
      paddingTop: "24px",
      marginTop: "32px",
    },
    termsTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#111827",
      marginBottom: "12px",
    },
    termsText: {
      fontSize: "13px",
      color: "#6B7280",
      lineHeight: "1.6",
    },
    // Footer
    invoiceFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 40px",
      backgroundColor: "#F9FAFB",
      borderTop: "1px solid #E5E7EB",
    },
    footerLinks: {
      display: "flex",
      gap: "24px",
    },
    footerLink: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      color: "#6B7280",
    },
    thankYouText: {
      fontSize: "14px",
      fontStyle: "italic",
      color: "#4F46E5",
    },
    // List View Styles
    listHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
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
      marginTop: "4px",
    },
    newInvoiceBtn: {
      display: "flex",
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
    tabsContainer: {
      display: "flex",
      gap: "8px",
      marginBottom: "24px",
      borderBottom: "1px solid #E5E7EB",
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
    listTable: {
      width: "100%",
      borderCollapse: "collapse",
    },
    listTh: {
      padding: "16px 20px",
      textAlign: "left",
      fontSize: "12px",
      fontWeight: "600",
      color: "#6B7280",
      textTransform: "uppercase",
      borderBottom: "1px solid #E5E7EB",
      backgroundColor: "#F9FAFB",
    },
    listTd: {
      padding: "16px 20px",
      fontSize: "14px",
      color: "#374151",
      borderBottom: "1px solid #E5E7EB",
    },
    invoiceLink: {
      color: "#4F46E5",
      fontWeight: "500",
      cursor: "pointer",
    },
    listStatusBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500",
    },
    actionBtn: {
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
    paginationBtn: {
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
    // Form Styles
    card: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflow: "hidden",
      marginBottom: "24px",
    },
    cardHeader: {
      padding: "20px 24px",
      borderBottom: "1px solid #E5E7EB",
    },
    cardTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#111827",
      margin: 0,
    },
    cardBody: {
      padding: "24px",
    },
    formRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
      marginBottom: "24px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
    },
    input: {
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      outline: "none",
    },
    select: {
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      outline: "none",
      backgroundColor: "white",
    },
    primaryBtn: {
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
    secondaryBtn: {
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
    successBtn: {
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
    dangerBtn: {
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
    footerLinksBottom: {
      display: "flex",
      gap: "24px",
    },
    footerLinkBottom: {
      fontSize: "14px",
      color: "#6B7280",
      cursor: "pointer",
    },
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const invoiceId = searchParams.get("id");
    if (invoiceId && invoices.length > 0) {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (invoice) {
        handleViewInvoice(invoice);
      }
    }
  }, [searchParams, invoices]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, customersRes, productsRes, analyticalRes] =
        await Promise.all([
          transactionsApi.getAll({ type: "CUSTOMER_INVOICE" }),
          contactsApi.getCustomers(),
          productsApi.getAll(),
          analyticalAccountsApi.getAll(),
        ]);
      setInvoices(invoicesRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
      setAnalyticalAccounts(analyticalRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewInvoice = () => {
    setSelectedInvoice(null);
    setFormData({
      customerId: "",
      reference: "",
      transactionDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      lines: [
        { productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 },
      ],
    });
    setView("form");
  };

  const handleViewInvoice = async (invoice) => {
    try {
      const res = await transactionsApi.getById(invoice.id);
      setSelectedInvoice(res.data);
      setView("detail");
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }
  };

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      customerId: invoice.customerId || "",
      reference: invoice.reference || "",
      transactionDate: new Date(invoice.transactionDate)
        .toISOString()
        .split("T")[0],
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toISOString().split("T")[0]
        : "",
      lines: invoice.lines.map((line) => ({
        productId: line.productId,
        analyticalAccountId: line.analyticalAccountId || "",
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      })),
    });
    setView("form");
  };

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 },
      ],
    });
  };

  const handleRemoveLine = (index) => {
    if (formData.lines.length > 1) {
      const newLines = formData.lines.filter((_, i) => i !== index);
      setFormData({ ...formData, lines: newLines });
    }
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index][field] = value;

    if (field === "productId") {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        newLines[index].unitPrice =
          Number(product.salesPrice) ||
          Number(product.salePrice) ||
          Number(product.price) ||
          0;
      }
    }

    setFormData({ ...formData, lines: newLines });
  };

  const calculateLineTotal = (line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    return qty * price;
  };

  const calculateSubtotal = () => {
    return formData.lines.reduce(
      (sum, line) => sum + calculateLineTotal(line),
      0,
    );
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        type: "CUSTOMER_INVOICE",
        customerId: parseInt(formData.customerId),
        reference: formData.reference,
        transactionDate: formData.transactionDate,
        dueDate: formData.dueDate || null,
        lines: formData.lines.map((line) => ({
          productId: parseInt(line.productId),
          analyticalAccountId: line.analyticalAccountId
            ? parseInt(line.analyticalAccountId)
            : null,
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice),
          gstRate: 18,
        })),
      };

      if (selectedInvoice) {
        await transactionsApi.update(selectedInvoice.id, data);
      } else {
        await transactionsApi.create(data);
      }

      await fetchData();
      setView("list");
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert(error.response?.data?.error || "Error saving invoice");
    }
  };

  const handleConfirm = async () => {
    if (!selectedInvoice) return;
    try {
      await transactionsApi.confirm(selectedInvoice.id);
      await fetchData();
      const res = await transactionsApi.getById(selectedInvoice.id);
      setSelectedInvoice(res.data);
    } catch (error) {
      console.error("Error confirming invoice:", error);
      alert(error.response?.data?.error || "Error confirming invoice");
    }
  };

  const handleCancel = async () => {
    if (!selectedInvoice) return;
    if (!window.confirm("Are you sure you want to cancel this invoice?"))
      return;

    try {
      await transactionsApi.cancel(selectedInvoice.id);
      await fetchData();
      const res = await transactionsApi.getById(selectedInvoice.id);
      setSelectedInvoice(res.data);
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      alert(error.response?.data?.error || "Error cancelling invoice");
    }
  };

  const handlePay = async () => {
    if (!selectedInvoice) return;
    try {
      await paymentsApi.createFromTransaction(selectedInvoice.id);
      alert("Payment recorded successfully!");
      await fetchData();
      // Refresh the selected invoice
      const res = await transactionsApi.getById(selectedInvoice.id);
      setSelectedInvoice(res.data);
    } catch (error) {
      console.error("Error creating payment:", error);
      alert(error.response?.data?.error || "Error creating payment");
    }
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    if (!window.confirm("Are you sure you want to delete this invoice?"))
      return;

    try {
      await transactionsApi.delete(selectedInvoice.id);
      await fetchData();
      setView("list");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert(error.response?.data?.error || "Error deleting invoice");
    }
  };

  const formatCurrency = (amount) => {
    const safeAmount = Number(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(safeAmount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const calculatePaymentInfo = () => {
    if (!selectedInvoice) return { paidAmount: 0, amountDue: 0 };
    const total = Number(selectedInvoice.totalAmount) || 0;
    const paidAmount = Number(selectedInvoice.paidAmount) || 0;
    return {
      paidAmount,
      amountDue: total - paidAmount,
    };
  };

  const getFilteredInvoices = () => {
    switch (activeTab) {
      case "confirmed":
        return invoices.filter((i) => i.status === "CONFIRMED");
      case "draft":
        return invoices.filter((i) => i.status === "DRAFT");
      case "paid":
        return invoices.filter((i) => i.paymentStatus === "PAID");
      case "unpaid":
        return invoices.filter(
          (i) => i.status === "CONFIRMED" && i.paymentStatus !== "PAID",
        );
      default:
        return invoices;
    }
  };

  const filteredInvoices = getFilteredInvoices();
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "CONFIRMED":
        return { backgroundColor: "#D1FAE5", color: "#065F46" };
      case "DRAFT":
        return { backgroundColor: "#FEF3C7", color: "#92400E" };
      case "CANCELLED":
        return { backgroundColor: "#FEE2E2", color: "#991B1B" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#374151" };
    }
  };

  const getPaymentBadgeStyle = (paymentStatus) => {
    switch (paymentStatus) {
      case "PAID":
        return { backgroundColor: "#D1FAE5", color: "#065F46" };
      case "PARTIALLY_PAID":
        return { backgroundColor: "#FEF3C7", color: "#92400E" };
      default:
        return { backgroundColor: "#FEE2E2", color: "#991B1B" };
    }
  };

  // List View
  const renderListView = () => (
    <div style={styles.pageContainer}>
      <div style={{ ...styles.contentWrapper, maxWidth: "1200px" }}>
        {/* Header */}
        <div style={styles.listHeader}>
          <div>
            <h1 style={styles.pageTitle}>Customer Invoices</h1>
            <p style={styles.pageSubtitle}>
              Manage and track your customer billing
            </p>
          </div>
          <button
            style={styles.newInvoiceBtn}
            onClick={handleNewInvoice}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#4338CA")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#4F46E5")
            }
          >
            <Plus size={16} />
            New Invoice
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          {[
            { key: "all", label: "All Invoices" },
            { key: "confirmed", label: "Confirmed" },
            { key: "draft", label: "Draft" },
            { key: "paid", label: "Paid" },
            { key: "unpaid", label: "Unpaid" },
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
            <div
              style={{ padding: "48px", textAlign: "center", color: "#6B7280" }}
            >
              Loading...
            </div>
          ) : (
            <>
              <table style={styles.listTable}>
                <thead>
                  <tr>
                    <th style={styles.listTh}>Invoice No.</th>
                    <th style={styles.listTh}>Customer</th>
                    <th style={styles.listTh}>Date</th>
                    <th style={styles.listTh}>Due Date</th>
                    <th style={{ ...styles.listTh, textAlign: "right" }}>
                      Amount
                    </th>
                    <th style={{ ...styles.listTh, textAlign: "center" }}>
                      Status
                    </th>
                    <th style={{ ...styles.listTh, textAlign: "center" }}>
                      Payment
                    </th>
                    <th style={styles.listTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#F9FAFB")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td style={styles.listTd}>
                        <span
                          style={styles.invoiceLink}
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          {invoice.transactionNumber}
                        </span>
                      </td>
                      <td style={styles.listTd}>
                        {invoice.customer?.name || "-"}
                      </td>
                      <td style={styles.listTd}>
                        {formatDate(invoice.transactionDate)}
                      </td>
                      <td style={styles.listTd}>
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td
                        style={{
                          ...styles.listTd,
                          textAlign: "right",
                          fontWeight: "600",
                        }}
                      >
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td style={{ ...styles.listTd, textAlign: "center" }}>
                        <span
                          style={{
                            ...styles.listStatusBadge,
                            ...getStatusBadgeStyle(invoice.status),
                          }}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td style={{ ...styles.listTd, textAlign: "center" }}>
                        {invoice.status === "CONFIRMED" && (
                          <span
                            style={{
                              ...styles.listStatusBadge,
                              ...getPaymentBadgeStyle(invoice.paymentStatus),
                            }}
                          >
                            {invoice.paymentStatus === "PAID"
                              ? "Paid"
                              : invoice.paymentStatus === "PARTIALLY_PAID"
                                ? "Partial"
                                : "Not Paid"}
                          </span>
                        )}
                      </td>
                      <td style={styles.listTd}>
                        <button
                          style={{
                            ...styles.actionBtn,
                            borderColor: "#D1D5DB",
                            color: "#374151",
                          }}
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedInvoices.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        style={{
                          ...styles.listTd,
                          textAlign: "center",
                          padding: "48px",
                          color: "#9CA3AF",
                        }}
                      >
                        No invoices found. Click "New Invoice" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filteredInvoices.length > 0 && (
                <div style={styles.pagination}>
                  <span style={styles.paginationText}>
                    Showing {startIndex + 1} to{" "}
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredInvoices.length,
                    )}{" "}
                    of {filteredInvoices.length} invoices
                  </span>
                  <div style={styles.paginationButtons}>
                    <button
                      style={{
                        ...styles.paginationBtn,
                        opacity: currentPage === 1 ? 0.5 : 1,
                      }}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      style={{
                        ...styles.paginationBtn,
                        opacity: currentPage === totalPages ? 0.5 : 1,
                      }}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            © 2023 Shiv Furniture Portal. All rights reserved.
          </span>
          <div style={styles.footerLinksBottom}>
            <span style={styles.footerLinkBottom}>Privacy Policy</span>
            <span style={styles.footerLinkBottom}>Terms of Service</span>
            <span style={styles.footerLinkBottom}>Support</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Form View
  const renderFormView = () => (
    <div style={styles.pageContainer}>
      <div style={{ ...styles.contentWrapper, maxWidth: "1000px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={styles.pageTitle}>
              {selectedInvoice ? "Edit Invoice" : "Create Invoice"}
            </h1>
            <p style={styles.pageSubtitle}>
              {selectedInvoice?.transactionNumber || "New Customer Invoice"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button style={styles.secondaryBtn} onClick={() => setView("list")}>
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Customer Details */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Customer Details</h3>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Customer</label>
                  <select
                    style={styles.select}
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData({ ...formData, customerId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Reference</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    placeholder="PO Number, etc."
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Invoice Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={formData.transactionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transactionDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Due Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div style={styles.card}>
            <div
              style={{
                ...styles.cardHeader,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={styles.cardTitle}>Line Items</h3>
              <button
                type="button"
                style={styles.primaryBtn}
                onClick={handleAddLine}
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>
            <div style={{ padding: "0" }}>
              <table style={styles.lineItemsTable}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>Product</th>
                    <th
                      style={{
                        ...styles.tableTh,
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        ...styles.tableTh,
                        width: "140px",
                        textAlign: "right",
                      }}
                    >
                      Unit Price
                    </th>
                    <th
                      style={{
                        ...styles.tableTh,
                        width: "140px",
                        textAlign: "right",
                      }}
                    >
                      Amount
                    </th>
                    <th style={{ ...styles.tableTh, width: "60px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lines.map((line, index) => (
                    <tr key={index}>
                      <td style={styles.tableTd}>
                        <select
                          style={{ ...styles.select, width: "100%" }}
                          value={line.productId}
                          onChange={(e) =>
                            handleLineChange(index, "productId", e.target.value)
                          }
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ ...styles.tableTd, textAlign: "center" }}>
                        <input
                          type="number"
                          style={{
                            ...styles.input,
                            width: "80px",
                            textAlign: "center",
                          }}
                          value={line.quantity}
                          onChange={(e) =>
                            handleLineChange(index, "quantity", e.target.value)
                          }
                          min="1"
                          required
                        />
                      </td>
                      <td style={{ ...styles.tableTd, textAlign: "right" }}>
                        <input
                          type="number"
                          style={{
                            ...styles.input,
                            width: "120px",
                            textAlign: "right",
                          }}
                          value={line.unitPrice}
                          onChange={(e) =>
                            handleLineChange(index, "unitPrice", e.target.value)
                          }
                          min="0"
                          step="0.01"
                          required
                        />
                      </td>
                      <td
                        style={{
                          ...styles.tableTd,
                          textAlign: "right",
                          fontWeight: "600",
                        }}
                      >
                        {formatCurrency(calculateLineTotal(line))}
                      </td>
                      <td style={styles.tableTd}>
                        <button
                          type="button"
                          style={{
                            ...styles.dangerBtn,
                            padding: "8px",
                            backgroundColor: "#FEE2E2",
                            color: "#EF4444",
                          }}
                          onClick={() => handleRemoveLine(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ padding: "24px", borderTop: "1px solid #E5E7EB" }}>
              <div style={styles.totalsSection}>
                <div style={styles.totalsBox}>
                  <div style={styles.totalsRow}>
                    <span style={styles.totalsLabel}>Subtotal</span>
                    <span style={styles.totalsValue}>
                      {formatCurrency(calculateSubtotal())}
                    </span>
                  </div>
                  <div style={styles.totalsRow}>
                    <span style={styles.totalsLabel}>Tax (GST 18%)</span>
                    <span style={styles.totalsValue}>
                      {formatCurrency(calculateTax())}
                    </span>
                  </div>
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>TOTAL</span>
                    <span style={styles.totalValue}>
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" style={styles.successBtn}>
              <Check size={16} />
              {selectedInvoice ? "Update Invoice" : "Save Draft"}
            </button>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setView("list")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Detail View - Professional Invoice
  const renderDetailView = () => {
    if (!selectedInvoice) return null;

    const paymentInfo = calculatePaymentInfo();
    const canPay =
      selectedInvoice.status === "CONFIRMED" && paymentInfo.amountDue > 0;
    const subtotal = selectedInvoice.lines.reduce(
      (sum, line) => sum + Number(line.lineTotal || 0),
      0,
    );
    const tax = subtotal * 0.18;

    const getStatusColor = () => {
      switch (selectedInvoice.status) {
        case "CONFIRMED":
          return selectedInvoice.paymentStatus === "PAID"
            ? { bg: "#D1FAE5", color: "#065F46", text: "PAID" }
            : selectedInvoice.paymentStatus === "PARTIALLY_PAID"
              ? { bg: "#FEF3C7", color: "#92400E", text: "PARTIAL" }
              : { bg: "#FEE2E2", color: "#991B1B", text: "PENDING" };
        case "DRAFT":
          return { bg: "#FEF3C7", color: "#92400E", text: "DRAFT" };
        case "CANCELLED":
          return { bg: "#FEE2E2", color: "#991B1B", text: "CANCELLED" };
        default:
          return {
            bg: "#F3F4F6",
            color: "#374151",
            text: selectedInvoice.status,
          };
      }
    };

    const statusInfo = getStatusColor();

    return (
      <div style={styles.pageContainer}>
        <div style={styles.contentWrapper}>
          {/* Invoice Header */}
          <div style={styles.invoiceHeader}>
            <div style={styles.invoiceTitle}>
              <h1 style={styles.invoiceTitleText}>
                Invoice {selectedInvoice.transactionNumber}
              </h1>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: statusInfo.bg,
                  color: statusInfo.color,
                }}
              >
                {statusInfo.text}
              </span>
            </div>
            <p style={styles.invoiceSubtitle}>
              Issued on {formatDate(selectedInvoice.transactionDate)}
              {selectedInvoice.dueDate &&
                ` • Due on ${formatDate(selectedInvoice.dueDate)}`}
            </p>

            <div style={styles.headerActions}>
              <button
                style={styles.secondaryBtn}
                onClick={() => setView("list")}
              >
                <ArrowLeft size={16} />
                Back to List
              </button>
              <div style={styles.actionButtons}>
                {selectedInvoice.status === "DRAFT" && (
                  <>
                    <button style={styles.successBtn} onClick={handleConfirm}>
                      <Check size={16} />
                      Confirm
                    </button>
                    <button
                      style={styles.primaryBtn}
                      onClick={() => handleEditInvoice(selectedInvoice)}
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                  </>
                )}
                <button
                  style={styles.pdfButton}
                  onClick={() => generateInvoicePDF(selectedInvoice)}
                >
                  <Download size={16} />
                  PDF
                </button>
                <button
                  style={styles.printButton}
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Amount Due Banner */}
          {canPay && (
            <div style={styles.amountDueBanner}>
              <div style={styles.amountDueLeft}>
                <div style={styles.amountDueIcon}>
                  <CreditCard size={24} color="white" />
                </div>
                <div style={styles.amountDueInfo}>
                  <p style={styles.amountDueTitle}>
                    Amount Due: {formatCurrency(paymentInfo.amountDue)}
                  </p>
                  <p style={styles.amountDueSubtitle}>
                    Please complete the payment
                    {selectedInvoice.dueDate &&
                      ` by ${formatDate(selectedInvoice.dueDate)}`}{" "}
                    to avoid a 2% late fee.
                  </p>
                </div>
              </div>
              <button
                style={styles.payNowBtn}
                onClick={handlePay}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#4338CA")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#4F46E5")
                }
              >
                Pay Now
              </button>
            </div>
          )}

          {/* Invoice Paper */}
          <div style={styles.invoicePaper}>
            <div style={styles.invoicePaperContent}>
              {/* Company Header */}
              <div style={styles.companyHeader}>
                <div style={styles.companyInfo}>
                  <h2 style={styles.companyName}>SHIV FURNITURE</h2>
                  <p style={styles.companyAddress}>
                    123 Industrial Area, Phase II
                    <br />
                    Mumbai, MH 400001
                    <br />
                    GSTIN: 27AAAA0000A1Z5
                  </p>
                </div>
                <div style={styles.invoiceToSection}>
                  <p style={styles.invoiceToLabel}>INVOICE TO</p>
                  <h3 style={styles.invoiceToName}>
                    {selectedInvoice.customer?.name || "Customer"}
                  </h3>
                  <p style={styles.invoiceToAddress}>
                    {selectedInvoice.customer?.address ||
                      "Address not provided"}
                    <br />
                    {selectedInvoice.customer?.phone &&
                      selectedInvoice.customer.phone}
                  </p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div style={styles.invoiceMeta}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Invoice ID</span>
                  <span style={styles.metaValue}>
                    {selectedInvoice.transactionNumber}
                  </span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Issue Date</span>
                  <span style={styles.metaValue}>
                    {formatDate(selectedInvoice.transactionDate)}
                  </span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Due Date</span>
                  <span style={styles.metaValue}>
                    {formatDate(selectedInvoice.dueDate)}
                  </span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>P.O. Number</span>
                  <span style={styles.metaValue}>
                    {selectedInvoice.reference || "-"}
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <table style={styles.lineItemsTable}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>Description</th>
                    <th
                      style={{
                        ...styles.tableTh,
                        textAlign: "center",
                        width: "80px",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        ...styles.tableTh,
                        textAlign: "right",
                        width: "120px",
                      }}
                    >
                      Price
                    </th>
                    <th
                      style={{
                        ...styles.tableTh,
                        textAlign: "right",
                        width: "120px",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lines.map((line, index) => (
                    <tr key={line.id || index}>
                      <td style={styles.tableTd}>
                        <div style={styles.productName}>
                          {line.product?.name || "Product"}
                        </div>
                        <div style={styles.productDescription}>
                          {line.product?.description || ""}
                        </div>
                      </td>
                      <td style={{ ...styles.tableTd, textAlign: "center" }}>
                        {Number(line.quantity)}
                      </td>
                      <td style={{ ...styles.tableTd, textAlign: "right" }}>
                        {formatCurrency(line.unitPrice)}
                      </td>
                      <td
                        style={{
                          ...styles.tableTd,
                          textAlign: "right",
                          fontWeight: "500",
                        }}
                      >
                        {formatCurrency(line.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div style={styles.totalsSection}>
                <div style={styles.totalsBox}>
                  <div style={styles.totalsRow}>
                    <span style={styles.totalsLabel}>Subtotal</span>
                    <span style={styles.totalsValue}>
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div style={styles.totalsRow}>
                    <span style={styles.totalsLabel}>Tax (GST 18%)</span>
                    <span style={styles.totalsValue}>
                      {formatCurrency(tax)}
                    </span>
                  </div>
                  {paymentInfo.paidAmount > 0 && (
                    <div style={styles.totalsRow}>
                      <span style={styles.totalsLabel}>Discount (Loyalty)</span>
                      <span style={styles.discountValue}>
                        -{formatCurrency(paymentInfo.paidAmount)}
                      </span>
                    </div>
                  )}
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>TOTAL</span>
                    <span style={styles.totalValue}>
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div style={styles.termsSection}>
                <h4 style={styles.termsTitle}>TERMS & CONDITIONS</h4>
                <p style={styles.termsText}>
                  1. Goods once sold will not be taken back or exchanged. 2. 50%
                  advance for custom furniture orders. 3. Warranty covers
                  manufacturing defects only for a period of 12 months. 4.
                  Please mention the Invoice ID in all payment communications.
                </p>
              </div>
            </div>

            {/* Invoice Footer */}
            <div style={styles.invoiceFooter}>
              <div style={styles.footerLinks}>
                <span style={styles.footerLink}>
                  <Globe size={14} />
                  www.shivfurniture.com
                </span>
                <span style={styles.footerLink}>
                  <Mail size={14} />
                  billing@shivfurniture.com
                </span>
              </div>
              <span style={styles.thankYouText}>
                Thank you for choosing Shiv Furniture!
              </span>
            </div>
          </div>

          {/* Delete button for Draft */}
          {selectedInvoice.status === "DRAFT" && (
            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button style={styles.dangerBtn} onClick={handleDelete}>
                <Trash2 size={16} />
                Delete Invoice
              </button>
            </div>
          )}

          {/* Footer */}
          <div style={styles.footer}>
            <span style={styles.footerText}>
              © 2023 Shiv Furniture Portal. All rights reserved.
            </span>
            <div style={styles.footerLinksBottom}>
              <span style={styles.footerLinkBottom}>Privacy Policy</span>
              <span style={styles.footerLinkBottom}>Terms of Service</span>
              <span style={styles.footerLinkBottom}>Support</span>
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

export default CustomerInvoices;
