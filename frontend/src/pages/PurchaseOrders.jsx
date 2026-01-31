import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Check,
  FileText,
  Calendar,
  AlertTriangle,
  RefreshCw,
  X,
} from "lucide-react";
import {
  transactionsApi,
  contactsApi,
  productsApi,
  analyticalAccountsApi,
} from "../services/api";

function PurchaseOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [analyticalAccounts, setAnalyticalAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, form, detail
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [budgetWarnings, setBudgetWarnings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [internalNotes, setInternalNotes] = useState("");
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    vendorId: "",
    reference: "",
    transactionDate: new Date().toISOString().split("T")[0],
    expectedArrival: "",
    lines: [
      { productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, vendorsRes, productsRes, analyticalRes] =
        await Promise.all([
          transactionsApi.getAll({ type: "PURCHASE_ORDER" }),
          contactsApi.getVendors(),
          productsApi.getAll(),
          analyticalAccountsApi.getAll(),
        ]);
      setOrders(ordersRes.data);
      setVendors(vendorsRes.data);
      setProducts(productsRes.data);
      setAnalyticalAccounts(analyticalRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    setSelectedOrder(null);
    setFormData({
      vendorId: "",
      reference: "",
      transactionDate: new Date().toISOString().split("T")[0],
      expectedArrival: "",
      lines: [
        { productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 },
      ],
    });
    setBudgetWarnings([]);
    setInternalNotes("");
    setView("form");
  };

  const handleViewOrder = async (order) => {
    try {
      const res = await transactionsApi.getById(order.id);
      setSelectedOrder(res.data);

      // Check budget warnings
      if (res.data.status === "DRAFT") {
        try {
          const warningsRes = await transactionsApi.getBudgetWarnings(order.id);
          setBudgetWarnings(warningsRes.data);
        } catch {
          setBudgetWarnings([]);
        }
      } else {
        setBudgetWarnings([]);
      }

      setView("detail");
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setFormData({
      vendorId: order.vendorId || "",
      reference: order.reference || "",
      transactionDate: new Date(order.transactionDate)
        .toISOString()
        .split("T")[0],
      expectedArrival: order.expectedArrival
        ? new Date(order.expectedArrival).toISOString().split("T")[0]
        : "",
      lines: order.lines.map((line) => ({
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

    // Auto-fill price from product
    if (field === "productId") {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        newLines[index].unitPrice = Number(product.purchasePrice);
      }
    }

    setFormData({ ...formData, lines: newLines });
  };

  const calculateLineTotal = (line) => {
    return line.quantity * line.unitPrice;
  };

  const calculateSubtotal = () => {
    return formData.lines.reduce(
      (sum, line) => sum + calculateLineTotal(line),
      0
    );
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.12; // 12% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e, saveAsDraft = true) => {
    if (e) e.preventDefault();
    try {
      const data = {
        type: "PURCHASE_ORDER",
        vendorId: parseInt(formData.vendorId),
        reference: formData.reference,
        transactionDate: formData.transactionDate,
        lines: formData.lines.map((line) => ({
          productId: parseInt(line.productId),
          analyticalAccountId: line.analyticalAccountId
            ? parseInt(line.analyticalAccountId)
            : null,
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice),
          gstRate: 12,
        })),
      };

      let result;
      if (selectedOrder) {
        result = await transactionsApi.update(selectedOrder.id, data);
      } else {
        result = await transactionsApi.create(data);
      }

      // If confirming directly
      if (!saveAsDraft && result.data?.id) {
        await transactionsApi.confirm(result.data.id);
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

    if (budgetWarnings.length > 0) {
      const proceed = window.confirm(
        `Warning: ${budgetWarnings.length} line(s) exceed the approved budget. Do you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    try {
      await transactionsApi.confirm(selectedOrder.id);
      await fetchData();
      const res = await transactionsApi.getById(selectedOrder.id);
      setSelectedOrder(res.data);
      setBudgetWarnings([]);
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

  const handleCreateBill = async () => {
    if (!selectedOrder) return;

    try {
      const res = await transactionsApi.createBillFromPO(selectedOrder.id);
      navigate(`/vendor-bills?id=${res.data.id}`);
    } catch (error) {
      console.error("Error creating bill:", error);
      alert(error.response?.data?.error || "Error creating bill");
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
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const generatePONumber = () => {
    const year = new Date().getFullYear();
    const num = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
    return `PO-${year}-${num}`;
  };

  // Styles
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  };

  const buttonPrimaryStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#4F46E5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  };

  const buttonSecondaryStyle = {
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
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1F2937",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: "6px",
  };

  // Pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1F2937",
              margin: "0 0 8px 0",
            }}
          >
            Purchase Orders
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>
            Manage purchase orders and vendor transactions.
          </p>
        </div>
        <button onClick={handleNewOrder} style={buttonPrimaryStyle}>
          <Plus size={18} />
          New Purchase Order
        </button>
      </div>

      {/* Table Card */}
      <div style={cardStyle}>
        {loading ? (
          <div
            style={{ padding: "48px", textAlign: "center", color: "#6B7280" }}
          >
            Loading...
          </div>
        ) : (
          <>
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
                    PO Number
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
                    Vendor
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
                    Date
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "right",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Amount
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <td style={{ padding: "20px 24px" }}>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#1F2937",
                          margin: 0,
                        }}
                      >
                        {order.transactionNumber}
                      </p>
                      {order.reference && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#9CA3AF",
                            margin: "4px 0 0 0",
                          }}
                        >
                          Ref: {order.reference}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      <span style={{ fontSize: "14px", color: "#4B5563" }}>
                        {order.vendor?.name || "-"}
                      </span>
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      <span style={{ fontSize: "14px", color: "#4B5563" }}>
                        {formatDate(order.transactionDate)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "20px 24px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#1F2937",
                      }}
                    >
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td style={{ padding: "20px 24px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          backgroundColor:
                            order.status === "DRAFT"
                              ? "#F3F4F6"
                              : order.status === "CONFIRMED"
                                ? "#D1FAE5"
                                : "#FEE2E2",
                          color:
                            order.status === "DRAFT"
                              ? "#374151"
                              : order.status === "CONFIRMED"
                                ? "#065F46"
                                : "#991B1B",
                        }}
                      >
                        {order.status}
                      </span>
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
                          onClick={() => handleViewOrder(order)}
                          style={{
                            padding: "8px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#6B7280",
                          }}
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        {order.status === "DRAFT" && (
                          <>
                            <button
                              onClick={() => handleEditOrder(order)}
                              style={{
                                padding: "8px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#6B7280",
                              }}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this order?"
                                  )
                                ) {
                                  try {
                                    await transactionsApi.delete(order.id);
                                    fetchData();
                                  } catch (error) {
                                    alert("Error deleting order");
                                  }
                                }
                              }}
                              style={{
                                padding: "8px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#EF4444",
                              }}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: "48px",
                        textAlign: "center",
                        color: "#6B7280",
                      }}
                    >
                      No purchase orders found. Click "New Purchase Order" to
                      create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {orders.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderTop: "1px solid #E5E7EB",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6B7280" }}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, orders.length)} of{" "}
                  {orders.length} entries
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      background: "white",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          padding: "8px 14px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "6px",
                          background:
                            currentPage === page ? "#4F46E5" : "white",
                          color: currentPage === page ? "white" : "#374151",
                          cursor: "pointer",
                          fontWeight: currentPage === page ? "600" : "400",
                        }}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      background: "white",
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

  // Form View (Create/Edit Purchase Order)
  const renderFormView = () => {
    const poNumber = selectedOrder?.transactionNumber || generatePONumber();
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();

    // Calculate total budget warning amount
    const totalWarningAmount = budgetWarnings.reduce((sum, w) => {
      const exceeded = w.lineTotal - w.remaining;
      return sum + (exceeded > 0 ? exceeded : 0);
    }, 0);

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
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#1F2937",
                margin: 0,
              }}
            >
              Create Purchase Order
            </h1>
            <span
              style={{
                padding: "6px 14px",
                backgroundColor: "#F3F4F6",
                color: "#374151",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              DRAFT
            </span>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => handleSubmit(null, true)}
              style={buttonSecondaryStyle}
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(null, false)}
              style={buttonPrimaryStyle}
            >
              Confirm Order
            </button>
          </div>
        </div>

        {/* PO Info */}
        <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
          {poNumber} • New transaction entry
        </p>

        {/* Budget Warning Alert */}
        {budgetWarnings.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#FEF3C7",
              border: "1px solid #F59E0B",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertTriangle size={20} color="#D97706" />
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#92400E",
                    margin: 0,
                  }}
                >
                  Budget Threshold Alert
                </p>
                <p
                  style={{ fontSize: "13px", color: "#A16207", margin: "4px 0 0 0" }}
                >
                  Line items exceed the remaining quarterly allocation by{" "}
                  {formatCurrency(totalWarningAmount)}.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/budgets")}
              style={{
                background: "none",
                border: "none",
                color: "#D97706",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              View Analytics →
            </button>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div style={{ display: "flex", gap: "24px" }}>
          {/* Left Column - Form */}
          <div style={{ flex: 1 }}>
            <div style={cardStyle}>
              <div style={{ padding: "24px" }}>
                {/* Form Fields */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Vendor</label>
                    <select
                      value={formData.vendorId}
                      onChange={(e) =>
                        setFormData({ ...formData, vendorId: e.target.value })
                      }
                      style={{
                        ...inputStyle,
                        backgroundColor: "white",
                        cursor: "pointer",
                      }}
                      required
                    >
                      <option value="">Search and select supplier...</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>PO Date</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="date"
                        value={formData.transactionDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transactionDate: e.target.value,
                          })
                        }
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Reference</label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) =>
                        setFormData({ ...formData, reference: e.target.value })
                      }
                      placeholder="e.g. QTN-9921"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Expected Arrival</label>
                    <input
                      type="date"
                      value={formData.expectedArrival}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedArrival: e.target.value,
                        })
                      }
                      placeholder="mm/dd/yyyy"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Order Line Items */}
                <div
                  style={{
                    borderTop: "1px solid #E5E7EB",
                    paddingTop: "24px",
                  }}
                >
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
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1F2937",
                        margin: 0,
                      }}
                    >
                      ORDER LINE ITEMS
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        background: "none",
                        border: "none",
                        color: "#4F46E5",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={16} />
                      Add a product
                    </button>
                  </div>

                  {/* Lines Table */}
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                        <th
                          style={{
                            padding: "12px 8px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#6B7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Product
                        </th>
                        <th
                          style={{
                            padding: "12px 8px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#6B7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Analytic Account
                        </th>
                        <th
                          style={{
                            padding: "12px 8px",
                            textAlign: "center",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#6B7280",
                            textTransform: "uppercase",
                            width: "70px",
                          }}
                        >
                          Qty
                        </th>
                        <th
                          style={{
                            padding: "12px 8px",
                            textAlign: "right",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#6B7280",
                            textTransform: "uppercase",
                            width: "100px",
                          }}
                        >
                          Unit Price
                        </th>
                        <th
                          style={{
                            padding: "12px 8px",
                            textAlign: "right",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#6B7280",
                            textTransform: "uppercase",
                            width: "100px",
                          }}
                        >
                          Total
                        </th>
                        <th style={{ width: "40px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lines.map((line, index) => {
                        const product = products.find(
                          (p) => p.id === parseInt(line.productId)
                        );
                        const account = analyticalAccounts.find(
                          (a) => a.id === parseInt(line.analyticalAccountId)
                        );
                        return (
                          <tr
                            key={index}
                            style={{ borderBottom: "1px solid #F3F4F6" }}
                          >
                            <td style={{ padding: "12px 8px" }}>
                              <select
                                value={line.productId}
                                onChange={(e) =>
                                  handleLineChange(
                                    index,
                                    "productId",
                                    e.target.value
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  color: "#1F2937",
                                }}
                                required
                              >
                                <option value="">Select product</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <select
                                value={line.analyticalAccountId}
                                onChange={(e) =>
                                  handleLineChange(
                                    index,
                                    "analyticalAccountId",
                                    e.target.value
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  color: "#6B7280",
                                }}
                              >
                                <option value="">Auto / Select</option>
                                {analyticalAccounts.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) =>
                                  handleLineChange(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  textAlign: "center",
                                }}
                                min="1"
                                required
                              />
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <span
                                  style={{ color: "#10B981", fontSize: "14px" }}
                                >
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  value={line.unitPrice}
                                  onChange={(e) =>
                                    handleLineChange(
                                      index,
                                      "unitPrice",
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    textAlign: "right",
                                  }}
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 8px",
                                textAlign: "right",
                                fontWeight: "600",
                                color: "#4F46E5",
                              }}
                            >
                              {formatCurrency(calculateLineTotal(line))}
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(index)}
                                style={{
                                  padding: "6px",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#9CA3AF",
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Add new line link */}
                  <button
                    type="button"
                    onClick={handleAddLine}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "12px 8px",
                      background: "none",
                      border: "none",
                      color: "#9CA3AF",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} />
                    Add new line
                  </button>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div style={{ ...cardStyle, marginTop: "24px" }}>
              <div style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#1F2937",
                      margin: 0,
                    }}
                  >
                    INTERNAL NOTES
                  </h3>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9CA3AF",
                      cursor: "pointer",
                    }}
                  >
                    ⋮
                  </button>
                </div>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Add terms or specific instructions for the warehouse team..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#6B7280",
                    minHeight: "80px",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Financial Summary */}
          <div style={{ width: "280px" }}>
            <div style={cardStyle}>
              <div style={{ padding: "24px" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#1F2937",
                    margin: "0 0 20px 0",
                  }}
                >
                  FINANCIAL SUMMARY
                </h3>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#6B7280" }}>
                    Untaxed Amount
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#1F2937",
                    }}
                  >
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#6B7280" }}>
                    Taxes (12%)
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#1F2937",
                    }}
                  >
                    {formatCurrency(tax)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: "1px solid #E5E7EB",
                    marginBottom: "24px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1F2937",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#1F2937",
                    }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={() => handleSubmit(null, false)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    backgroundColor: "#4F46E5",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <Check size={18} />
                  Confirm Order
                </button>

                <button
                  style={{
                    width: "100%",
                    padding: "14px",
                    backgroundColor: "white",
                    color: "#374151",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <FileText size={18} />
                  Create Bill
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ ...cardStyle, marginTop: "24px" }}>
              <div style={{ padding: "24px" }}>
                <h3
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 16px 0",
                  }}
                >
                  RECENT ACTIVITY
                </h3>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#4F46E5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    AU
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#1F2937",
                        margin: 0,
                      }}
                    >
                      Admin User
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#9CA3AF",
                        margin: "2px 0 0 0",
                      }}
                    >
                      Created draft PO • 12:45 PM
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#F59E0B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "14px",
                    }}
                  >
                    📊
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#1F2937",
                        margin: 0,
                      }}
                    >
                      Budget System
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#9CA3AF",
                        margin: "2px 0 0 0",
                      }}
                    >
                      Budget warning triggered • 12:46 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div style={{ marginTop: "24px" }}>
          <button
            onClick={() => setView("list")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              background: "none",
              border: "none",
              color: "#6B7280",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} />
            Back to List
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <p style={{ fontSize: "13px", color: "#9CA3AF" }}>
            Shiv Furniture ERP v4.2.0 • Cloud Sync Active •{" "}
            <span style={{ color: "#4F46E5", cursor: "pointer" }}>
              Support Portal
            </span>
          </p>
        </div>
      </div>
    );
  };

  // Detail View
  const renderDetailView = () => {
    if (!selectedOrder) return null;

    const hasBill = selectedOrder.childTransactions?.length > 0;
    const subtotal = selectedOrder.lines?.reduce(
      (sum, l) => sum + Number(l.lineTotal || 0),
      0
    );
    const tax = subtotal * 0.12;
    const total = subtotal + tax;

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
              onClick={() => setView("list")}
              style={{
                padding: "10px",
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={20} color="#374151" />
            </button>
            <div>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                {selectedOrder.transactionNumber}
              </h1>
              <p
                style={{ fontSize: "14px", color: "#6B7280", margin: "4px 0 0 0" }}
              >
                {selectedOrder.vendor?.name || "Vendor"} •{" "}
                {formatDate(selectedOrder.transactionDate)}
              </p>
            </div>
            <span
              style={{
                padding: "6px 14px",
                backgroundColor:
                  selectedOrder.status === "DRAFT"
                    ? "#F3F4F6"
                    : selectedOrder.status === "CONFIRMED"
                      ? "#D1FAE5"
                      : "#FEE2E2",
                color:
                  selectedOrder.status === "DRAFT"
                    ? "#374151"
                    : selectedOrder.status === "CONFIRMED"
                      ? "#065F46"
                      : "#991B1B",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {selectedOrder.status}
            </span>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {selectedOrder.status === "DRAFT" && (
              <>
                <button onClick={handleConfirm} style={buttonPrimaryStyle}>
                  <Check size={18} />
                  Confirm
                </button>
                <button
                  onClick={() => handleEditOrder(selectedOrder)}
                  style={buttonSecondaryStyle}
                >
                  <Edit size={18} />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    ...buttonSecondaryStyle,
                    color: "#EF4444",
                    borderColor: "#FCA5A5",
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            {selectedOrder.status === "CONFIRMED" && !hasBill && (
              <button onClick={handleCreateBill} style={buttonPrimaryStyle}>
                <FileText size={18} />
                Create Bill
              </button>
            )}
          </div>
        </div>

        {/* Budget Warning */}
        {budgetWarnings.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#FEF3C7",
              border: "1px solid #F59E0B",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertTriangle size={20} color="#D97706" />
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#92400E",
                    margin: 0,
                  }}
                >
                  Budget Threshold Alert
                </p>
                <p
                  style={{ fontSize: "13px", color: "#A16207", margin: "4px 0 0 0" }}
                >
                  {budgetWarnings.length} line(s) exceed the approved budget.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/budgets")}
              style={{
                background: "none",
                border: "none",
                color: "#D97706",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              View Analytics →
            </button>
          </div>
        )}

        {/* Main Content */}
        <div style={{ display: "flex", gap: "24px" }}>
          {/* Left - Order Details */}
          <div style={{ flex: 1 }}>
            <div style={cardStyle}>
              <div style={{ padding: "24px" }}>
                {/* Order Info */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                    marginBottom: "24px",
                    paddingBottom: "24px",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Vendor</label>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: "500",
                        color: "#1F2937",
                        margin: 0,
                      }}
                    >
                      {selectedOrder.vendor?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <label style={labelStyle}>PO Date</label>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: "500",
                        color: "#1F2937",
                        margin: 0,
                      }}
                    >
                      {formatDate(selectedOrder.transactionDate)}
                    </p>
                  </div>
                  <div>
                    <label style={labelStyle}>Reference</label>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: "500",
                        color: "#1F2937",
                        margin: 0,
                      }}
                    >
                      {selectedOrder.reference || "-"}
                    </p>
                  </div>
                </div>

                {/* Lines Table */}
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#1F2937",
                    margin: "0 0 16px 0",
                  }}
                >
                  ORDER LINE ITEMS
                </h3>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <th
                        style={{
                          padding: "12px 8px",
                          textAlign: "left",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6B7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Product
                      </th>
                      <th
                        style={{
                          padding: "12px 8px",
                          textAlign: "left",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6B7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Analytic Account
                      </th>
                      <th
                        style={{
                          padding: "12px 8px",
                          textAlign: "center",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6B7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Qty
                      </th>
                      <th
                        style={{
                          padding: "12px 8px",
                          textAlign: "right",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6B7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        style={{
                          padding: "12px 8px",
                          textAlign: "right",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6B7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.lines?.map((line, index) => (
                      <tr
                        key={line.id}
                        style={{ borderBottom: "1px solid #F3F4F6" }}
                      >
                        <td style={{ padding: "16px 8px" }}>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#1F2937",
                            }}
                          >
                            {line.product?.name || "-"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 8px" }}>
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#6B7280",
                            }}
                          >
                            {line.analyticalAccount?.name || "-"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "16px 8px",
                            textAlign: "center",
                            fontSize: "14px",
                            color: "#1F2937",
                          }}
                        >
                          {Number(line.quantity)}
                        </td>
                        <td
                          style={{
                            padding: "16px 8px",
                            textAlign: "right",
                            fontSize: "14px",
                            color: "#1F2937",
                          }}
                        >
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td
                          style={{
                            padding: "16px 8px",
                            textAlign: "right",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#4F46E5",
                          }}
                        >
                          {formatCurrency(line.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #E5E7EB" }}>
                      <td
                        colSpan="4"
                        style={{
                          padding: "16px 8px",
                          textAlign: "right",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1F2937",
                        }}
                      >
                        Subtotal
                      </td>
                      <td
                        style={{
                          padding: "16px 8px",
                          textAlign: "right",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1F2937",
                        }}
                      >
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          padding: "8px",
                          textAlign: "right",
                          fontSize: "14px",
                          color: "#6B7280",
                        }}
                      >
                        Tax (12%)
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "right",
                          fontSize: "14px",
                          color: "#6B7280",
                        }}
                      >
                        {formatCurrency(tax)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          padding: "16px 8px",
                          textAlign: "right",
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#1F2937",
                        }}
                      >
                        Total
                      </td>
                      <td
                        style={{
                          padding: "16px 8px",
                          textAlign: "right",
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#1F2937",
                        }}
                      >
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Linked Bill */}
            {hasBill && (
              <div style={{ ...cardStyle, marginTop: "24px" }}>
                <div style={{ padding: "24px" }}>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1F2937",
                      margin: "0 0 16px 0",
                    }}
                  >
                    LINKED BILLS
                  </h3>
                  {selectedOrder.childTransactions.map((bill) => (
                    <div
                      key={bill.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        backgroundColor: "#F0FDF4",
                        borderRadius: "8px",
                        border: "1px solid #BBF7D0",
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "12px" }}
                      >
                        <Check size={18} color="#16A34A" />
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#166534",
                          }}
                        >
                          {bill.transactionNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/vendor-bills?id=${bill.id}`)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#4F46E5",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                      >
                        View Bill
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Summary */}
          <div style={{ width: "280px" }}>
            <div style={cardStyle}>
              <div style={{ padding: "24px" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#1F2937",
                    margin: "0 0 20px 0",
                  }}
                >
                  ORDER SUMMARY
                </h3>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#6B7280" }}>
                    Subtotal
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#1F2937",
                    }}
                  >
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#6B7280" }}>
                    Tax (12%)
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#1F2937",
                    }}
                  >
                    {formatCurrency(tax)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: "1px solid #E5E7EB",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1F2937",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#1F2937",
                    }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <p style={{ fontSize: "13px", color: "#9CA3AF" }}>
            Shiv Furniture ERP v4.2.0 • Cloud Sync Active •{" "}
            <span style={{ color: "#4F46E5", cursor: "pointer" }}>
              Support Portal
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F9FAFB",
        padding: "24px",
      }}
    >
      {view === "list" && renderListView()}
      {view === "form" && renderFormView()}
      {view === "detail" && renderDetailView()}
    </div>
  );
}

export default PurchaseOrders;
