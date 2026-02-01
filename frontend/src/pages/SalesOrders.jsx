import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  transactionsApi,
  contactsApi,
  productsApi,
  budgetsApi,
} from "../services/api";
import {
  Users,
  Calendar,
  MapPin,
  Package,
  Plus,
  Trash2,
  FileText,
  Save,
  Receipt,
  Home,
  ArrowLeft,
  Check,
  X,
  Edit,
  Printer,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  TrendingUp,
  DollarSign,
  CheckCircle,
} from "lucide-react";

function SalesOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [internalNotes, setInternalNotes] = useState("");
  const [selectedBudgetId, setSelectedBudgetId] = useState("");

  const [formData, setFormData] = useState({
    customerId: "",
    reference: "",
    transactionDate: new Date().toISOString().split("T")[0],
    expectedDelivery: "",
    shippingAddress: "",
    lines: [{ productId: "", quantity: 1, unitPrice: 0 }],
  });

  // Styles
  const styles = {
    pageContainer: {
      minHeight: "100vh",
      backgroundColor: "#F9FAFB",
    },
    contentWrapper: {
      maxWidth: "1400px",
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
      gap: "8px",
    },
    titleRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    pageTitle: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#111827",
      margin: 0,
    },
    draftBadge: {
      padding: "4px 12px",
      backgroundColor: "#4F46E5",
      color: "white",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "600",
    },
    orderInfo: {
      fontSize: "14px",
      color: "#6B7280",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    headerButtons: {
      display: "flex",
      gap: "12px",
    },
    saveDraftBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 20px",
      backgroundColor: "white",
      color: "#374151",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    createInvoiceBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 20px",
      backgroundColor: "#10B981",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    mainGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 360px",
      gap: "24px",
    },
    leftColumn: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    rightColumn: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflow: "hidden",
    },
    cardHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "20px 24px",
      borderBottom: "1px solid #E5E7EB",
    },
    cardIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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
      fontSize: "12px",
      fontWeight: "600",
      color: "#6B7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    select: {
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      backgroundColor: "white",
      color: "#111827",
      outline: "none",
      cursor: "pointer",
    },
    input: {
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      backgroundColor: "white",
      color: "#111827",
      outline: "none",
    },
    addressBox: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "16px",
      backgroundColor: "#F9FAFB",
      borderRadius: "12px",
      marginTop: "8px",
    },
    addressIcon: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      backgroundColor: "#EEF2FF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    addressContent: {
      flex: 1,
    },
    addressLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#10B981",
      marginBottom: "4px",
    },
    addressText: {
      fontSize: "14px",
      color: "#374151",
      lineHeight: "1.5",
    },
    changeBtn: {
      padding: "8px 16px",
      backgroundColor: "white",
      color: "#4F46E5",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
    },
    lineItemsHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      borderBottom: "1px solid #E5E7EB",
    },
    addProductBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      backgroundColor: "#4F46E5",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    lineItemsTable: {
      width: "100%",
      borderCollapse: "collapse",
    },
    tableHeader: {
      backgroundColor: "#F9FAFB",
    },
    th: {
      padding: "12px 24px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#6B7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      textAlign: "left",
      borderBottom: "1px solid #E5E7EB",
    },
    td: {
      padding: "16px 24px",
      borderBottom: "1px solid #E5E7EB",
      verticalAlign: "middle",
    },
    productCell: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    productImage: {
      width: "48px",
      height: "48px",
      borderRadius: "8px",
      backgroundColor: "#F3F4F6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    productInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },
    productName: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#111827",
    },
    productSku: {
      fontSize: "12px",
      color: "#4F46E5",
    },
    qtyInput: {
      width: "60px",
      padding: "8px 12px",
      fontSize: "14px",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      textAlign: "center",
      backgroundColor: "#F9FAFB",
    },
    priceText: {
      fontSize: "14px",
      color: "#6B7280",
    },
    subtotalText: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#111827",
    },
    deleteBtn: {
      width: "36px",
      height: "36px",
      borderRadius: "8px",
      backgroundColor: "#FEE2E2",
      color: "#EF4444",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    },
    // Order Summary Card (Dark)
    summaryCard: {
      backgroundColor: "#1E1B4B",
      borderRadius: "16px",
      padding: "24px",
      color: "white",
    },
    summaryHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "24px",
    },
    summaryIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      backgroundColor: "rgba(255,255,255,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    summaryTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "white",
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
    },
    summaryLabel: {
      fontSize: "14px",
      color: "rgba(255,255,255,0.7)",
    },
    summaryValue: {
      fontSize: "14px",
      fontWeight: "500",
      color: "white",
    },
    freeTag: {
      padding: "2px 8px",
      backgroundColor: "#10B981",
      color: "white",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
    },
    totalRow: {
      marginTop: "16px",
      paddingTop: "16px",
      borderTop: "1px solid rgba(255,255,255,0.2)",
    },
    totalLabel: {
      fontSize: "12px",
      color: "rgba(255,255,255,0.6)",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    totalAmount: {
      fontSize: "32px",
      fontWeight: "700",
      color: "white",
      marginTop: "4px",
    },
    submitBtn: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "14px 24px",
      backgroundColor: "#10B981",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "20px",
    },
    // Budget Status Card
    budgetCard: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      padding: "24px",
    },
    budgetHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "20px",
    },
    budgetIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      backgroundColor: "#EEF2FF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    budgetTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#111827",
    },
    budgetSelect: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      backgroundColor: "white",
      color: "#111827",
      marginBottom: "16px",
    },
    utilizationBox: {
      backgroundColor: "#F0FDF4",
      borderRadius: "12px",
      padding: "16px",
    },
    utilizationHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
    },
    utilizationLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#6B7280",
      textTransform: "uppercase",
    },
    utilizationPercent: {
      fontSize: "14px",
      fontWeight: "700",
      color: "#10B981",
    },
    progressBar: {
      height: "8px",
      backgroundColor: "#E5E7EB",
      borderRadius: "4px",
      overflow: "hidden",
      marginBottom: "12px",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#10B981",
      borderRadius: "4px",
    },
    remainingText: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      color: "#6B7280",
    },
    // Internal Notes Card
    notesCard: {
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      padding: "24px",
    },
    notesLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#6B7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "12px",
    },
    notesTextarea: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "14px",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      resize: "vertical",
      minHeight: "100px",
      outline: "none",
      boxSizing: "border-box",
    },
    // List View Styles
    listHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
    },
    newOrderBtn: {
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
      letterSpacing: "0.05em",
      borderBottom: "1px solid #E5E7EB",
      backgroundColor: "#F9FAFB",
    },
    listTd: {
      padding: "16px 20px",
      fontSize: "14px",
      color: "#374151",
      borderBottom: "1px solid #E5E7EB",
    },
    orderLink: {
      color: "#4F46E5",
      fontWeight: "500",
      cursor: "pointer",
      textDecoration: "none",
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500",
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
      cursor: "pointer",
    },
    summaryCardsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "24px",
      marginBottom: "32px",
    },
    summaryCardItem: {
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    summaryCardIconBox: {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "16px",
    },
    summaryCardTitle: {
      fontSize: "14px",
      color: "#6B7280",
      marginBottom: "8px",
    },
    summaryCardAmount: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#111827",
    },
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const orderId = searchParams.get("id");
    if (orderId && orders.length > 0) {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        handleViewOrder(order);
      }
    }
  }, [searchParams, orders]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        transactionsApi.getAll({ type: "SALES_ORDER" }),
        contactsApi.getCustomers(),
        productsApi.getAll(),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);

      // Try to fetch budgets
      try {
        const budgetsRes = await budgetsApi.getAll();
        setBudgets(budgetsRes.data);
      } catch (e) {
        console.log("Budgets not available");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    setSelectedOrder(null);
    setFormData({
      customerId: "",
      reference: "",
      transactionDate: new Date().toISOString().split("T")[0],
      expectedDelivery: "",
      shippingAddress: "",
      lines: [{ productId: "", quantity: 1, unitPrice: 0 }],
    });
    setInternalNotes("");
    setSelectedBudgetId("");
    setView("form");
  };

  const handleViewOrder = async (order) => {
    try {
      const res = await transactionsApi.getById(order.id);
      setSelectedOrder(res.data);
      setView("detail");
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setFormData({
      customerId: order.customerId || "",
      reference: order.reference || "",
      transactionDate: new Date(order.transactionDate)
        .toISOString()
        .split("T")[0],
      expectedDelivery: order.expectedDelivery || "",
      shippingAddress: order.shippingAddress || "",
      lines: order.lines.map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      })),
    });
    setInternalNotes(order.notes || "");
    setView("form");
  };

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: "", quantity: 1, unitPrice: 0 }],
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
    return calculateSubtotal() * 0.18; // 18% GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const getTotalItems = () => {
    return formData.lines.reduce(
      (sum, line) => sum + Number(line.quantity || 0),
      0,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        type: "SALES_ORDER",
        customerId: parseInt(formData.customerId),
        reference: formData.reference,
        transactionDate: formData.transactionDate,
        notes: internalNotes,
        lines: formData.lines.map((line) => ({
          productId: parseInt(line.productId),
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice),
          gstRate: 18,
        })),
      };

      if (selectedOrder) {
        await transactionsApi.update(selectedOrder.id, data);
      } else {
        await transactionsApi.create(data);
      }

      await fetchData();
      setView("list");
    } catch (error) {
      console.error("Error saving order:", error);
      alert(error.response?.data?.error || "Error saving order");
    }
  };

  const handleConfirm = async () => {
    if (!selectedOrder) return;
    try {
      await transactionsApi.confirm(selectedOrder.id);
      await fetchData();
      const res = await transactionsApi.getById(selectedOrder.id);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error("Error confirming order:", error);
      alert(error.response?.data?.error || "Error confirming order");
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await transactionsApi.cancel(selectedOrder.id);
      await fetchData();
      const res = await transactionsApi.getById(selectedOrder.id);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error.response?.data?.error || "Error cancelling order");
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrder) return;
    try {
      const res = await transactionsApi.createInvoiceFromSO(selectedOrder.id);
      navigate(`/customer-invoices?id=${res.data.id}`);
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert(error.response?.data?.error || "Error creating invoice");
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      await transactionsApi.delete(selectedOrder.id);
      await fetchData();
      setView("list");
    } catch (error) {
      console.error("Error deleting order:", error);
      alert(error.response?.data?.error || "Error deleting order");
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

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "confirmed":
        return orders.filter((o) => o.status === "CONFIRMED");
      case "draft":
        return orders.filter((o) => o.status === "DRAFT");
      case "cancelled":
        return orders.filter((o) => o.status === "CANCELLED");
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const totalDraft = orders
    .filter((o) => o.status === "DRAFT")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalConfirmed = orders
    .filter((o) => o.status === "CONFIRMED")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.reduce((sum, o) => sum + o.totalAmount, 0);

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

  const getSelectedCustomer = () => {
    return customers.find((c) => c.id === parseInt(formData.customerId));
  };

  const getProductById = (productId) => {
    return products.find((p) => p.id === parseInt(productId));
  };

  // List View
  const renderListView = () => (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        {/* Header */}
        <div style={styles.listHeader}>
          <div>
            <h1 style={styles.pageTitle}>Sales Orders</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
              Manage customer orders and track sales pipeline
            </p>
          </div>
          <button
            style={styles.newOrderBtn}
            onClick={handleNewOrder}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#4338CA")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#4F46E5")
            }
          >
            <Plus size={16} />
            New Sales Order
          </button>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryCardsRow}>
          <div style={styles.summaryCardItem}>
            <div
              style={{
                ...styles.summaryCardIconBox,
                backgroundColor: "#EEF2FF",
              }}
            >
              <ClipboardList size={24} color="#4F46E5" />
            </div>
            <p style={styles.summaryCardTitle}>Total Orders</p>
            <p style={styles.summaryCardAmount}>
              {formatCurrency(totalOrders)}
            </p>
          </div>
          <div style={styles.summaryCardItem}>
            <div
              style={{
                ...styles.summaryCardIconBox,
                backgroundColor: "#FEF3C7",
              }}
            >
              <FileText size={24} color="#F59E0B" />
            </div>
            <p style={styles.summaryCardTitle}>Draft Orders</p>
            <p style={{ ...styles.summaryCardAmount, color: "#F59E0B" }}>
              {formatCurrency(totalDraft)}
            </p>
          </div>
          <div style={styles.summaryCardItem}>
            <div
              style={{
                ...styles.summaryCardIconBox,
                backgroundColor: "#D1FAE5",
              }}
            >
              <CheckCircle size={24} color="#10B981" />
            </div>
            <p style={styles.summaryCardTitle}>Confirmed Orders</p>
            <p style={{ ...styles.summaryCardAmount, color: "#10B981" }}>
              {formatCurrency(totalConfirmed)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          {[
            { key: "all", label: "All Orders" },
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
            <div
              style={{ padding: "48px", textAlign: "center", color: "#6B7280" }}
            >
              Loading orders...
            </div>
          ) : (
            <>
              <table style={styles.listTable}>
                <thead>
                  <tr>
                    <th style={styles.listTh}>Order No.</th>
                    <th style={styles.listTh}>Customer</th>
                    <th style={styles.listTh}>Date</th>
                    <th style={{ ...styles.listTh, textAlign: "right" }}>
                      Amount
                    </th>
                    <th style={{ ...styles.listTh, textAlign: "center" }}>
                      Status
                    </th>
                    <th style={styles.listTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#F9FAFB")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td style={styles.listTd}>
                        <span
                          style={styles.orderLink}
                          onClick={() => handleViewOrder(order)}
                        >
                          {order.transactionNumber}
                        </span>
                      </td>
                      <td style={styles.listTd}>
                        {order.customer?.name || "-"}
                      </td>
                      <td style={styles.listTd}>
                        {new Date(order.transactionDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td
                        style={{
                          ...styles.listTd,
                          textAlign: "right",
                          fontWeight: "600",
                        }}
                      >
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td style={{ ...styles.listTd, textAlign: "center" }}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...getStatusBadgeStyle(order.status),
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td style={styles.listTd}>
                        <button
                          style={{
                            ...styles.actionBtn,
                            borderColor: "#D1D5DB",
                            color: "#374151",
                          }}
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye size={14} />
                          View
                        </button>
                        {order.status === "CONFIRMED" &&
                          !order.childTransactions?.length && (
                            <button
                              style={{
                                ...styles.actionBtn,
                                borderColor: "#10B981",
                                color: "#10B981",
                              }}
                              onClick={async () => {
                                try {
                                  const res =
                                    await transactionsApi.createInvoiceFromSO(
                                      order.id,
                                    );
                                  navigate(
                                    `/customer-invoices?id=${res.data.id}`,
                                  );
                                } catch (error) {
                                  alert(
                                    error.response?.data?.error ||
                                      "Error creating invoice",
                                  );
                                }
                              }}
                            >
                              <Receipt size={14} />
                              Invoice
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                  {paginatedOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          ...styles.listTd,
                          textAlign: "center",
                          padding: "48px",
                          color: "#9CA3AF",
                        }}
                      >
                        No orders found. Click "New Sales Order" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filteredOrders.length > 0 && (
                <div style={styles.pagination}>
                  <span style={styles.paginationText}>
                    Showing {startIndex + 1} to{" "}
                    {Math.min(startIndex + itemsPerPage, filteredOrders.length)}{" "}
                    of {filteredOrders.length} orders
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
  const renderFormView = () => {
    const selectedCustomer = getSelectedCustomer();
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();
    const totalItems = getTotalItems();

    return (
      <div style={styles.pageContainer}>
        <div style={styles.contentWrapper}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.titleRow}>
                <h1 style={styles.pageTitle}>
                  {selectedOrder ? `Edit Sales Order` : "Create Sales Order"}
                </h1>
                <span style={styles.draftBadge}>DRAFT</span>
              </div>
              <p style={styles.orderInfo}>
                <span style={{ color: "#4F46E5" }}>
                  # {selectedOrder?.transactionNumber || "SO-NEW"}
                </span>
                <span>•</span>
                <span>{selectedCustomer?.name || "Select Customer"}</span>
              </p>
            </div>
            <div style={styles.headerButtons}>
              <button
                style={styles.saveDraftBtn}
                onClick={handleSubmit}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#F3F4F6")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                <Save size={16} />
                Save Draft
              </button>
              <button
                style={styles.createInvoiceBtn}
                onClick={handleSubmit}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#059669")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#10B981")
                }
              >
                <Receipt size={16} />
                Create Invoice
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.mainGrid}>
              {/* Left Column */}
              <div style={styles.leftColumn}>
                {/* Customer Details Card */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div
                      style={{ ...styles.cardIcon, backgroundColor: "#EEF2FF" }}
                    >
                      <Users size={20} color="#4F46E5" />
                    </div>
                    <h3 style={styles.cardTitle}>Customer Details</h3>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Select Customer</label>
                        <select
                          style={styles.select}
                          value={formData.customerId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customerId: e.target.value,
                            })
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
                        <label style={styles.label}>Expected Delivery</label>
                        <input
                          type="date"
                          style={styles.input}
                          value={formData.expectedDelivery}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expectedDelivery: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {selectedCustomer && (
                      <div style={styles.addressBox}>
                        <div style={styles.addressIcon}>
                          <MapPin size={16} color="#4F46E5" />
                        </div>
                        <div style={styles.addressContent}>
                          <p style={styles.addressLabel}>SHIPPING ADDRESS</p>
                          <p style={styles.addressText}>
                            {selectedCustomer.address || "No address on file"}
                          </p>
                        </div>
                        <button
                          type="button"
                          style={styles.changeBtn}
                          onClick={() =>
                            alert("Change address feature coming soon")
                          }
                        >
                          CHANGE
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items Card */}
                <div style={styles.card}>
                  <div style={styles.lineItemsHeader}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          ...styles.cardIcon,
                          backgroundColor: "#EEF2FF",
                        }}
                      >
                        <Package size={20} color="#4F46E5" />
                      </div>
                      <h3 style={styles.cardTitle}>Line Items</h3>
                    </div>
                    <button
                      type="button"
                      style={styles.addProductBtn}
                      onClick={handleAddLine}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#4338CA")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "#4F46E5")
                      }
                    >
                      <Plus size={16} />
                      ADD PRODUCT
                    </button>
                  </div>
                  <table style={styles.lineItemsTable}>
                    <thead style={styles.tableHeader}>
                      <tr>
                        <th style={styles.th}>Item Details</th>
                        <th
                          style={{
                            ...styles.th,
                            textAlign: "center",
                            width: "100px",
                          }}
                        >
                          Quantity
                        </th>
                        <th
                          style={{
                            ...styles.th,
                            textAlign: "center",
                            width: "120px",
                          }}
                        >
                          Unit Price
                        </th>
                        <th
                          style={{
                            ...styles.th,
                            textAlign: "right",
                            width: "120px",
                          }}
                        >
                          Subtotal
                        </th>
                        <th style={{ ...styles.th, width: "60px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lines.map((line, index) => {
                        const product = getProductById(line.productId);
                        return (
                          <tr key={index}>
                            <td style={styles.td}>
                              <div style={styles.productCell}>
                                <div style={styles.productImage}>
                                  {product?.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : (
                                    <Package size={24} color="#9CA3AF" />
                                  )}
                                </div>
                                <div style={styles.productInfo}>
                                  {product ? (
                                    <>
                                      <span style={styles.productName}>
                                        {product.name}
                                      </span>
                                      <span style={styles.productSku}>
                                        SKU: {product.sku || "N/A"}
                                      </span>
                                    </>
                                  ) : (
                                    <select
                                      style={{
                                        ...styles.select,
                                        minWidth: "200px",
                                      }}
                                      value={line.productId}
                                      onChange={(e) =>
                                        handleLineChange(
                                          index,
                                          "productId",
                                          e.target.value,
                                        )
                                      }
                                      required
                                    >
                                      <option value="">Select Product</option>
                                      {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ ...styles.td, textAlign: "center" }}>
                              <input
                                type="number"
                                style={styles.qtyInput}
                                value={line.quantity}
                                onChange={(e) =>
                                  handleLineChange(
                                    index,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                min="1"
                                required
                              />
                            </td>
                            <td style={{ ...styles.td, textAlign: "center" }}>
                              <span style={styles.priceText}>
                                {formatCurrency(line.unitPrice)}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              <span style={styles.subtotalText}>
                                {formatCurrency(calculateLineTotal(line))}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <button
                                type="button"
                                style={styles.deleteBtn}
                                onClick={() => handleRemoveLine(index)}
                                onMouseOver={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#FCA5A5")
                                }
                                onMouseOut={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#FEE2E2")
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column */}
              <div style={styles.rightColumn}>
                {/* Order Summary Card */}
                <div style={styles.summaryCard}>
                  <div style={styles.summaryHeader}>
                    <div style={styles.summaryIcon}>
                      <Receipt size={20} color="white" />
                    </div>
                    <span style={styles.summaryTitle}>Order Summary</span>
                  </div>

                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>
                      Item Total ({totalItems} items)
                    </span>
                    <span style={styles.summaryValue}>
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Tax (GST 18%)</span>
                    <span style={styles.summaryValue}>
                      {formatCurrency(tax)}
                    </span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Shipping Fees</span>
                    <span style={styles.freeTag}>FREE</span>
                  </div>

                  <div style={styles.totalRow}>
                    <p style={styles.totalLabel}>Total Payable</p>
                    <p style={styles.totalAmount}>{formatCurrency(total)}</p>
                  </div>

                  <button
                    type="submit"
                    style={styles.submitBtn}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#059669")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#10B981")
                    }
                  >
                    <Check size={18} />
                    SUBMIT & INVOICE
                  </button>
                </div>

                {/* Budget Status Card */}
                <div style={styles.budgetCard}>
                  <div style={styles.budgetHeader}>
                    <div style={styles.budgetIcon}>
                      <TrendingUp size={20} color="#4F46E5" />
                    </div>
                    <span style={styles.budgetTitle}>Budget Status</span>
                  </div>

                  <label
                    style={{
                      ...styles.label,
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    Budget Code
                  </label>
                  <select
                    style={styles.budgetSelect}
                    value={selectedBudgetId}
                    onChange={(e) => setSelectedBudgetId(e.target.value)}
                  >
                    <option value="">Select Budget</option>
                    {budgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>
                        {budget.code} - {budget.name}
                      </option>
                    ))}
                  </select>

                  <div style={styles.utilizationBox}>
                    <div style={styles.utilizationHeader}>
                      <span style={styles.utilizationLabel}>
                        Quarter Utilization
                      </span>
                      <span style={styles.utilizationPercent}>72%</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div
                        style={{ ...styles.progressFill, width: "72%" }}
                      ></div>
                    </div>
                    <div style={styles.remainingText}>
                      <DollarSign size={14} color="#10B981" />
                      <span>₹4,500.00 Remaining</span>
                    </div>
                  </div>
                </div>

                {/* Internal Notes Card */}
                <div style={styles.notesCard}>
                  <label style={styles.notesLabel}>Internal Notes</label>
                  <textarea
                    style={styles.notesTextarea}
                    placeholder="Add private notes for production team..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Detail View
  const renderDetailView = () => {
    if (!selectedOrder) return null;

    const hasInvoice = selectedOrder.childTransactions?.length > 0;
    const subtotal = selectedOrder.lines.reduce(
      (sum, line) => sum + Number(line.lineTotal),
      0,
    );
    const tax = subtotal * 0.18;
    const totalItems = selectedOrder.lines.reduce(
      (sum, line) => sum + Number(line.quantity),
      0,
    );

    return (
      <div style={styles.pageContainer}>
        <div style={styles.contentWrapper}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.titleRow}>
                <h1 style={styles.pageTitle}>
                  {selectedOrder.transactionNumber}
                </h1>
                <span
                  style={{
                    ...styles.draftBadge,
                    backgroundColor:
                      selectedOrder.status === "CONFIRMED"
                        ? "#10B981"
                        : selectedOrder.status === "CANCELLED"
                          ? "#EF4444"
                          : "#4F46E5",
                  }}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <p style={styles.orderInfo}>
                <span>{selectedOrder.customer?.name || "-"}</span>
                <span>•</span>
                <span>
                  {new Date(selectedOrder.transactionDate).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </span>
              </p>
            </div>
            <div style={styles.headerButtons}>
              <button
                style={styles.saveDraftBtn}
                onClick={() => setView("list")}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#F3F4F6")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                <ArrowLeft size={16} />
                Back to List
              </button>
              {selectedOrder.status === "DRAFT" && (
                <button
                  style={styles.createInvoiceBtn}
                  onClick={handleConfirm}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#059669")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#10B981")
                  }
                >
                  <Check size={16} />
                  Confirm Order
                </button>
              )}
              {selectedOrder.status === "CONFIRMED" && !hasInvoice && (
                <button
                  style={styles.createInvoiceBtn}
                  onClick={handleCreateInvoice}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#059669")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#10B981")
                  }
                >
                  <Receipt size={16} />
                  Create Invoice
                </button>
              )}
            </div>
          </div>

          <div style={styles.mainGrid}>
            {/* Left Column */}
            <div style={styles.leftColumn}>
              {/* Customer Details Card */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div
                    style={{ ...styles.cardIcon, backgroundColor: "#EEF2FF" }}
                  >
                    <Users size={20} color="#4F46E5" />
                  </div>
                  <h3 style={styles.cardTitle}>Customer Details</h3>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Customer</label>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: "500",
                          color: "#111827",
                          margin: 0,
                        }}
                      >
                        {selectedOrder.customer?.name || "-"}
                      </p>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Order Date</label>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: "500",
                          color: "#111827",
                          margin: 0,
                        }}
                      >
                        {new Date(
                          selectedOrder.transactionDate,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.customer?.address && (
                    <div style={styles.addressBox}>
                      <div style={styles.addressIcon}>
                        <MapPin size={16} color="#4F46E5" />
                      </div>
                      <div style={styles.addressContent}>
                        <p style={styles.addressLabel}>SHIPPING ADDRESS</p>
                        <p style={styles.addressText}>
                          {selectedOrder.customer.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Card */}
              <div style={styles.card}>
                <div style={styles.lineItemsHeader}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{ ...styles.cardIcon, backgroundColor: "#EEF2FF" }}
                    >
                      <Package size={20} color="#4F46E5" />
                    </div>
                    <h3 style={styles.cardTitle}>Line Items</h3>
                  </div>
                </div>
                <table style={styles.lineItemsTable}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.th}>Item Details</th>
                      <th
                        style={{
                          ...styles.th,
                          textAlign: "center",
                          width: "100px",
                        }}
                      >
                        Quantity
                      </th>
                      <th
                        style={{
                          ...styles.th,
                          textAlign: "center",
                          width: "120px",
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        style={{
                          ...styles.th,
                          textAlign: "right",
                          width: "120px",
                        }}
                      >
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.lines.map((line, index) => (
                      <tr key={line.id || index}>
                        <td style={styles.td}>
                          <div style={styles.productCell}>
                            <div style={styles.productImage}>
                              {line.product?.imageUrl ? (
                                <img
                                  src={line.product.imageUrl}
                                  alt={line.product.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <Package size={24} color="#9CA3AF" />
                              )}
                            </div>
                            <div style={styles.productInfo}>
                              <span style={styles.productName}>
                                {line.product?.name || "-"}
                              </span>
                              <span style={styles.productSku}>
                                SKU: {line.product?.sku || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <span
                            style={{
                              ...styles.qtyInput,
                              display: "inline-block",
                              backgroundColor: "#F3F4F6",
                              border: "none",
                            }}
                          >
                            {Number(line.quantity)}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <span style={styles.priceText}>
                            {formatCurrency(line.unitPrice)}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <span style={styles.subtotalText}>
                            {formatCurrency(line.lineTotal)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Linked Invoice */}
              {hasInvoice && (
                <div
                  style={{
                    backgroundColor: "#F0FDF4",
                    border: "1px solid #10B981",
                    borderRadius: "16px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <CheckCircle size={24} color="#10B981" />
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#065F46",
                      }}
                    >
                      Invoice Created
                    </span>
                  </div>
                  {selectedOrder.childTransactions.map((invoice) => (
                    <div
                      key={invoice.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontWeight: "500", color: "#111827" }}>
                        {invoice.transactionNumber}
                      </span>
                      <button
                        style={{
                          ...styles.actionBtn,
                          borderColor: "#10B981",
                          color: "#10B981",
                        }}
                        onClick={() =>
                          navigate(`/customer-invoices?id=${invoice.id}`)
                        }
                      >
                        View Invoice →
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit/Delete for Draft */}
              {selectedOrder.status === "DRAFT" && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    style={{
                      ...styles.saveDraftBtn,
                      flex: 1,
                      justifyContent: "center",
                    }}
                    onClick={() => handleEditOrder(selectedOrder)}
                  >
                    <Edit size={16} />
                    Edit Order
                  </button>
                  <button
                    style={{
                      ...styles.saveDraftBtn,
                      flex: 1,
                      justifyContent: "center",
                      color: "#EF4444",
                      borderColor: "#EF4444",
                    }}
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} />
                    Delete Order
                  </button>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div style={styles.rightColumn}>
              {/* Order Summary Card */}
              <div style={styles.summaryCard}>
                <div style={styles.summaryHeader}>
                  <div style={styles.summaryIcon}>
                    <Receipt size={20} color="white" />
                  </div>
                  <span style={styles.summaryTitle}>Order Summary</span>
                </div>

                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>
                    Item Total ({totalItems} items)
                  </span>
                  <span style={styles.summaryValue}>
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Tax (GST 18%)</span>
                  <span style={styles.summaryValue}>{formatCurrency(tax)}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Shipping Fees</span>
                  <span style={styles.freeTag}>FREE</span>
                </div>

                <div style={styles.totalRow}>
                  <p style={styles.totalLabel}>Total Payable</p>
                  <p style={styles.totalAmount}>
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>

                {selectedOrder.status === "DRAFT" && (
                  <button
                    style={styles.submitBtn}
                    onClick={handleConfirm}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#059669")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#10B981")
                    }
                  >
                    <Check size={18} />
                    CONFIRM ORDER
                  </button>
                )}
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div style={styles.notesCard}>
                  <label style={styles.notesLabel}>Internal Notes</label>
                  <p style={{ fontSize: "14px", color: "#374151", margin: 0 }}>
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <span style={styles.footerText}>
              © 2023 Shiv Furniture Portal. All rights reserved.
            </span>
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

export default SalesOrders;
