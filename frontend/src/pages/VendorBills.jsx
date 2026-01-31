import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  Home,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Printer,
  Download,
  Paperclip,
  CreditCard,
  AlertTriangle,
  FileText,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Save,
  Calendar,
  DollarSign,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  transactionsApi,
  contactsApi,
  productsApi,
  analyticalAccountsApi,
  paymentsApi,
} from "../services/api";

function VendorBills() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bills, setBills] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [analyticalAccounts, setAnalyticalAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selectedBill, setSelectedBill] = useState(null);
  const [budgetWarnings, setBudgetWarnings] = useState([]);
  const [internalNotes, setInternalNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    vendorId: "",
    reference: "",
    transactionDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    lines: [
      { productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const billId = searchParams.get("id");
    if (billId && bills.length > 0) {
      const bill = bills.find((b) => b.id === billId);
      if (bill) {
        handleViewBill(bill);
      }
    }
  }, [searchParams, bills]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsRes, vendorsRes, productsRes, analyticalRes] =
        await Promise.all([
          transactionsApi.getAll({ type: "VENDOR_BILL" }),
          contactsApi.getVendors(),
          productsApi.getAll(),
          analyticalAccountsApi.getAll(),
        ]);
      setBills(billsRes.data);
      setVendors(vendorsRes.data);
      setProducts(productsRes.data);
      setAnalyticalAccounts(analyticalRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewBill = () => {
    setSelectedBill(null);
    setFormData({
      vendorId: "",
      reference: "",
      transactionDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      lines: [
        { productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 },
      ],
    });
    setBudgetWarnings([]);
    setInternalNotes("");
    setView("form");
  };

  const handleViewBill = async (bill) => {
    try {
      const res = await transactionsApi.getById(bill.id);
      setSelectedBill(res.data);
      setInternalNotes(res.data.notes || "");

      if (res.data.status === "DRAFT") {
        const warningsRes = await transactionsApi.getBudgetWarnings(bill.id);
        setBudgetWarnings(warningsRes.data);
      } else {
        setBudgetWarnings([]);
      }

      setView("detail");
    } catch (error) {
      console.error("Error fetching bill:", error);
    }
  };

  const handleEditBill = (bill) => {
    setSelectedBill(bill);
    setFormData({
      vendorId: bill.vendorId || "",
      reference: bill.reference || "",
      transactionDate: new Date(bill.transactionDate)
        .toISOString()
        .split("T")[0],
      dueDate: bill.dueDate
        ? new Date(bill.dueDate).toISOString().split("T")[0]
        : "",
      lines: bill.lines.map((line) => ({
        productId: line.productId,
        analyticalAccountId: line.analyticalAccountId || "",
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      })),
    });
    setInternalNotes(bill.notes || "");
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
        newLines[index].unitPrice = Number(product.purchasePrice);
      }
    }

    setFormData({ ...formData, lines: newLines });
  };

  const calculateLineTotal = (line) => {
    return line.quantity * line.unitPrice;
  };

  const calculateTotal = () => {
    return formData.lines.reduce(
      (sum, line) => sum + calculateLineTotal(line),
      0,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        type: "VENDOR_BILL",
        vendorId: parseInt(formData.vendorId),
        reference: formData.reference,
        transactionDate: formData.transactionDate,
        dueDate: formData.dueDate || null,
        notes: internalNotes,
        lines: formData.lines.map((line) => ({
          productId: parseInt(line.productId),
          analyticalAccountId: line.analyticalAccountId
            ? parseInt(line.analyticalAccountId)
            : null,
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice),
          gstRate: 0,
        })),
      };

      if (selectedBill) {
        await transactionsApi.update(selectedBill.id, data);
      } else {
        await transactionsApi.create(data);
      }

      await fetchData();
      setView("list");
    } catch (error) {
      console.error("Error saving bill:", error);
      alert(error.response?.data?.error || "Error saving bill");
    }
  };

  const handleConfirm = async () => {
    if (!selectedBill) return;

    if (budgetWarnings.length > 0) {
      const proceed = window.confirm(
        `Warning: ${budgetWarnings.length} line(s) exceed the approved budget. Do you want to proceed anyway?`,
      );
      if (!proceed) return;
    }

    try {
      await transactionsApi.confirm(selectedBill.id);
      await fetchData();
      const res = await transactionsApi.getById(selectedBill.id);
      setSelectedBill(res.data);
    } catch (error) {
      console.error("Error confirming bill:", error);
      alert(error.response?.data?.error || "Error confirming bill");
    }
  };

  const handleCancel = async () => {
    if (!selectedBill) return;
    if (!window.confirm("Are you sure you want to cancel this bill?")) return;

    try {
      await transactionsApi.cancel(selectedBill.id);
      await fetchData();
      const res = await transactionsApi.getById(selectedBill.id);
      setSelectedBill(res.data);
    } catch (error) {
      console.error("Error cancelling bill:", error);
      alert(error.response?.data?.error || "Error cancelling bill");
    }
  };

  const handlePay = async () => {
    if (!selectedBill) return;

    try {
      const res = await paymentsApi.createFromTransaction(selectedBill.id);
      navigate(`/bill-payments?id=${res.data.id}`);
    } catch (error) {
      console.error("Error creating payment:", error);
      alert(error.response?.data?.error || "Error creating payment");
    }
  };

  const handleDelete = async () => {
    if (!selectedBill) return;
    if (!window.confirm("Are you sure you want to delete this bill?")) return;

    try {
      await transactionsApi.delete(selectedBill.id);
      await fetchData();
      setView("list");
    } catch (error) {
      console.error("Error deleting bill:", error);
      alert(error.response?.data?.error || "Error deleting bill");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedBill) return;
    try {
      await transactionsApi.update(selectedBill.id, { notes: internalNotes });
      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Error saving notes");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isLineOverBudget = (lineId) => {
    return budgetWarnings.some((w) => w.lineId === lineId);
  };

  const getWarningForLine = (lineId) => {
    return budgetWarnings.find((w) => w.lineId === lineId);
  };

  const calculatePaymentInfo = () => {
    if (!selectedBill) return { paidAmount: 0, amountDue: 0 };

    const total = Number(selectedBill.totalAmount) || 0;
    const paidAmount = Number(selectedBill.paidAmount || 0);
    const amountDue = total - paidAmount;

    return { paidAmount, amountDue };
  };

  const calculateDetailTotals = () => {
    if (!selectedBill) return { untaxed: 0, taxes: 0, total: 0 };
    const untaxed =
      selectedBill.lines?.reduce(
        (sum, line) => sum + Number(line.lineTotal || 0),
        0,
      ) || 0;
    const taxes =
      selectedBill.lines?.reduce(
        (sum, line) => sum + Number(line.gstAmount || 0),
        0,
      ) || 0;
    return { untaxed, taxes, total: untaxed + taxes };
  };

  const totalPages = Math.ceil(bills.length / itemsPerPage);
  const paginatedBills = bills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getStatusBadge = (status) => {
    const styles = {
      DRAFT: { bg: "#FEF3C7", color: "#92400E", border: "#F59E0B" },
      CONFIRMED: { bg: "#D1FAE5", color: "#065F46", border: "#10B981" },
      CANCELLED: { bg: "#FEE2E2", color: "#991B1B", border: "#EF4444" },
    };
    const s = styles[status] || styles.DRAFT;
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: s.bg,
          color: s.color,
          border: `1px solid ${s.border}`,
        }}
      >
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      PAID: { bg: "#D1FAE5", color: "#065F46" },
      PARTIALLY_PAID: { bg: "#FEF3C7", color: "#92400E" },
      NOT_PAID: { bg: "#FEE2E2", color: "#991B1B" },
    };
    const s = styles[status] || styles.NOT_PAID;
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: "500",
          backgroundColor: s.bg,
          color: s.color,
        }}
      >
        {status?.replace("_", " ")}
      </span>
    );
  };

  // List View
  const renderListView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#111827",
              margin: 0,
            }}
          >
            Vendor Bills
          </h1>
          <p style={{ color: "#6B7280", marginTop: "4px", fontSize: "14px" }}>
            Manage your vendor bills and payments
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "white",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <Home size={18} />
            Home
          </button>
          <button
            onClick={handleNewBill}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <Plus size={18} />
            New Bill
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#6B7280",
            }}
          >
            Loading bills...
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB" }}>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Bill Number
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Vendor
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Reference
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Bill Date
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Due Date
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "right",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Total
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Payment
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedBills.map((bill) => (
                  <tr
                    key={bill.id}
                    style={{
                      borderBottom: "1px solid #E5E7EB",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#F9FAFB")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "white")
                    }
                  >
                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          fontWeight: "600",
                          color: "#4F46E5",
                        }}
                      >
                        {bill.transactionNumber}
                      </span>
                    </td>
                    <td style={{ padding: "16px", color: "#374151" }}>
                      {bill.vendor?.name || "-"}
                    </td>
                    <td style={{ padding: "16px", color: "#6B7280" }}>
                      {bill.reference || "-"}
                    </td>
                    <td style={{ padding: "16px", color: "#374151" }}>
                      {formatDate(bill.transactionDate)}
                    </td>
                    <td style={{ padding: "16px", color: "#374151" }}>
                      {formatDate(bill.dueDate)}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      {getStatusBadge(bill.status)}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      {bill.status === "CONFIRMED" &&
                        getPaymentStatusBadge(bill.paymentStatus)}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleViewBill(bill)}
                          style={{
                            padding: "8px",
                            backgroundColor: "#EEF2FF",
                            color: "#4F46E5",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        {bill.status === "DRAFT" && (
                          <>
                            <button
                              onClick={() => handleEditBill(bill)}
                              style={{
                                padding: "8px",
                                backgroundColor: "#FEF3C7",
                                color: "#92400E",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                handleDelete();
                              }}
                              style={{
                                padding: "8px",
                                backgroundColor: "#FEE2E2",
                                color: "#991B1B",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        padding: "60px",
                        textAlign: "center",
                        color: "#6B7280",
                      }}
                    >
                      <FileText
                        size={48}
                        style={{ marginBottom: "16px", opacity: 0.5 }}
                      />
                      <p>No vendor bills found</p>
                      <p style={{ fontSize: "14px" }}>
                        Click "New Bill" to create one
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {bills.length > itemsPerPage && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderTop: "1px solid #E5E7EB",
                }}
              >
                <span style={{ color: "#6B7280", fontSize: "14px" }}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, bills.length)} of{" "}
                  {bills.length} bills
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: currentPage === 1 ? "#F3F4F6" : "white",
                      color: currentPage === 1 ? "#9CA3AF" : "#374151",
                      border: "1px solid #D1D5DB",
                      borderRadius: "6px",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "8px 12px",
                      backgroundColor:
                        currentPage === totalPages ? "#F3F4F6" : "white",
                      color: currentPage === totalPages ? "#9CA3AF" : "#374151",
                      border: "1px solid #D1D5DB",
                      borderRadius: "6px",
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
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
  );

  // Form View
  const renderFormView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setView("list")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              backgroundColor: "white",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={20} color="#374151" />
          </button>
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#111827",
                margin: 0,
              }}
            >
              {selectedBill ? `Edit Bill` : "New Vendor Bill"}
            </h1>
            <p style={{ color: "#6B7280", marginTop: "4px", fontSize: "14px" }}>
              {selectedBill
                ? `Editing ${selectedBill.transactionNumber}`
                : "Create a new vendor bill"}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: "white",
            color: "#374151",
            border: "1px solid #D1D5DB",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <Home size={18} />
          Home
        </button>
      </div>

      {/* Two Column Layout */}
      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}
      >
        {/* Left Column - Form */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "24px",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Vendor *
                </label>
                <select
                  value={formData.vendorId}
                  onChange={(e) =>
                    setFormData({ ...formData, vendorId: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Reference
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="SUP-25-001"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Bill Date *
                </label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionDate: e.target.value,
                    })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                />
              </div>
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "16px",
                }}
              >
                Line Items
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9FAFB" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      Product
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      Analytical Account
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        borderBottom: "1px solid #E5E7EB",
                        width: "100px",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        borderBottom: "1px solid #E5E7EB",
                        width: "120px",
                      }}
                    >
                      Unit Price
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        borderBottom: "1px solid #E5E7EB",
                        width: "120px",
                      }}
                    >
                      Total
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        borderBottom: "1px solid #E5E7EB",
                        width: "50px",
                      }}
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lines.map((line, index) => (
                    <tr
                      key={index}
                      style={{ borderBottom: "1px solid #E5E7EB" }}
                    >
                      <td style={{ padding: "12px" }}>
                        <select
                          value={line.productId}
                          onChange={(e) =>
                            handleLineChange(index, "productId", e.target.value)
                          }
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <select
                          value={line.analyticalAccountId}
                          onChange={(e) =>
                            handleLineChange(
                              index,
                              "analyticalAccountId",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        >
                          <option value="">Auto / Select</option>
                          {analyticalAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) =>
                            handleLineChange(index, "quantity", e.target.value)
                          }
                          min="1"
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "6px",
                            fontSize: "14px",
                            textAlign: "center",
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) =>
                            handleLineChange(index, "unitPrice", e.target.value)
                          }
                          min="0"
                          step="0.01"
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #D1D5DB",
                            borderRadius: "6px",
                            fontSize: "14px",
                            textAlign: "right",
                          }}
                        />
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        {formatCurrency(calculateLineTotal(line))}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(index)}
                          style={{
                            padding: "6px",
                            backgroundColor: "#FEE2E2",
                            color: "#991B1B",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={handleAddLine}
                style={{
                  marginTop: "12px",
                  padding: "8px 16px",
                  backgroundColor: "#EEF2FF",
                  color: "#4F46E5",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={16} />
                Add Line
              </button>
            </div>

            {/* Internal Notes */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Internal Notes
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add notes for internal reference..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#4F46E5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Save size={18} />
                {selectedBill ? "Update Bill" : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "white",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Financial Summary */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "20px",
              }}
            >
              Financial Summary
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#6B7280" }}>Subtotal</span>
                <span style={{ fontWeight: "500", color: "#111827" }}>
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#6B7280" }}>Taxes</span>
                <span style={{ fontWeight: "500", color: "#111827" }}>
                  {formatCurrency(0)}
                </span>
              </div>
              <div
                style={{
                  borderTop: "2px solid #E5E7EB",
                  paddingTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#4F46E5",
                  }}
                >
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Vendor Info */}
          {formData.vendorId && (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                padding: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "16px",
                }}
              >
                Vendor Details
              </h3>
              {(() => {
                const vendor = vendors.find(
                  (v) => v.id === parseInt(formData.vendorId),
                );
                return vendor ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#EEF2FF",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Building2 size={20} color="#4F46E5" />
                      </div>
                      <span style={{ fontWeight: "600", color: "#111827" }}>
                        {vendor.name}
                      </span>
                    </div>
                    {vendor.address && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          color: "#6B7280",
                          fontSize: "14px",
                        }}
                      >
                        <MapPin size={16} style={{ marginTop: "2px" }} />
                        <span>{vendor.address}</span>
                      </div>
                    )}
                    {vendor.gstin && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6B7280",
                        }}
                      >
                        <span style={{ fontWeight: "500" }}>GSTIN:</span>{" "}
                        {vendor.gstin}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Detail View
  const renderDetailView = () => {
    if (!selectedBill) return null;

    const paymentInfo = calculatePaymentInfo();
    const totals = calculateDetailTotals();
    const canPay =
      selectedBill.status === "CONFIRMED" && paymentInfo.amountDue > 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setView("list")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                backgroundColor: "white",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={20} color="#374151" />
            </button>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <h1
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Bill {selectedBill.transactionNumber}
                </h1>
                {getStatusBadge(selectedBill.status)}
              </div>
              {selectedBill.parentTransaction && (
                <p
                  style={{
                    color: "#4F46E5",
                    marginTop: "4px",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onClick={() =>
                    navigate(`/purchase-orders?id=${selectedBill.parentId}`)
                  }
                >
                  Draft bill auto-filled from PO{" "}
                  {selectedBill.parentTransaction.transactionNumber}
                  <ExternalLink size={14} />
                </p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {selectedBill.status === "DRAFT" && (
              <>
                <button
                  onClick={handleCancel}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    backgroundColor: "white",
                    color: "#DC2626",
                    border: "1px solid #FCA5A5",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    backgroundColor: "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <Check size={18} />
                  Confirm Bill
                </button>
              </>
            )}
          </div>
        </div>

        {/* Budget Warning */}
        {budgetWarnings.length > 0 && (
          <div
            style={{
              backgroundColor: "#FEF3C7",
              border: "1px solid #F59E0B",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <AlertTriangle size={24} color="#D97706" />
            <div>
              <p
                style={{
                  fontWeight: "600",
                  color: "#92400E",
                  marginBottom: "4px",
                }}
              >
                Exceeds Approved Budget
              </p>
              <p style={{ color: "#92400E", fontSize: "14px" }}>
                {budgetWarnings.length} line(s) exceed the approved budget
                amount. Consider adjusting the value or revising the budget.
              </p>
            </div>
          </div>
        )}

        {/* Date Cards Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <Calendar size={16} color="#6B7280" />
              <span style={{ fontSize: "13px", color: "#6B7280" }}>
                Bill Date
              </span>
            </div>
            <p
              style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}
            >
              {formatDate(selectedBill.transactionDate)}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <Clock size={16} color="#6B7280" />
              <span style={{ fontSize: "13px", color: "#6B7280" }}>
                Due Date
              </span>
            </div>
            <p
              style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}
            >
              {formatDate(selectedBill.dueDate)}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <DollarSign size={16} color="#6B7280" />
              <span style={{ fontSize: "13px", color: "#6B7280" }}>
                Total Amount
              </span>
            </div>
            <p
              style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}
            >
              {formatCurrency(selectedBill.totalAmount)}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <DollarSign size={16} color="#6B7280" />
                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                  Amount Due
                </span>
              </div>
              {paymentInfo.amountDue > 0 && (
                <span
                  style={{
                    padding: "2px 8px",
                    backgroundColor: "#FEE2E2",
                    color: "#991B1B",
                    fontSize: "11px",
                    fontWeight: "600",
                    borderRadius: "4px",
                  }}
                >
                  DUE
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: paymentInfo.amountDue > 0 ? "#DC2626" : "#059669",
              }}
            >
              {formatCurrency(paymentInfo.amountDue)}
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => window.print()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "white",
                color: "#374151",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <Printer size={16} />
              Print Bill
            </button>
            <button
              onClick={() => alert("Download PDF feature coming soon")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "white",
                color: "#374151",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <Download size={16} />
              Download PDF
            </button>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "white",
                color: "#374151",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <Paperclip size={16} />
              Attachments (0)
            </button>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {canPay && (
              <button
                onClick={handlePay}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "#4F46E5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <CreditCard size={18} />
                Register Payment
              </button>
            )}
            {selectedBill.status === "DRAFT" && (
              <>
                <button
                  onClick={() => handleEditBill(selectedBill)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    backgroundColor: "#EEF2FF",
                    color: "#4F46E5",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    backgroundColor: "#FEE2E2",
                    color: "#991B1B",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB" }}>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Product
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  UOM
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Unit Price
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Taxes
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedBill.lines?.map((line, index) => {
                const warning = getWarningForLine(line.id);
                const overBudget = isLineOverBudget(line.id);

                return (
                  <tr
                    key={line.id}
                    style={{
                      borderBottom: "1px solid #E5E7EB",
                      backgroundColor: overBudget ? "#FEF3C7" : "white",
                    }}
                  >
                    <td style={{ padding: "16px" }}>
                      <div>
                        <span
                          style={{
                            color: "#4F46E5",
                            fontWeight: "500",
                            cursor: "pointer",
                          }}
                        >
                          {line.product?.code || `PROD-${index + 1}`}
                        </span>
                        <p style={{ color: "#111827", marginTop: "4px" }}>
                          {line.product?.name || "-"}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: "16px", color: "#6B7280" }}>
                      {line.product?.description || "-"}
                      {warning && (
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "8px",
                            backgroundColor: "#FEF3C7",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "#92400E",
                          }}
                        >
                          Budget: {formatCurrency(warning.budgetedAmount)} |
                          Remaining: {formatCurrency(warning.remaining)}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        color: "#111827",
                        fontWeight: "500",
                      }}
                    >
                      {Number(line.quantity)}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        color: "#6B7280",
                      }}
                    >
                      {line.product?.uom || "Unit"}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "right",
                        color: "#111827",
                      }}
                    >
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      {Number(line.gstRate || 0) > 0 ? (
                        <span
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#DBEAFE",
                            color: "#1E40AF",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          GST {line.gstRate}%
                        </span>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>-</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {formatCurrency(line.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "24px",
              borderTop: "1px solid #E5E7EB",
              backgroundColor: "#F9FAFB",
            }}
          >
            <div style={{ width: "300px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span style={{ color: "#6B7280" }}>Untaxed Amount</span>
                <span style={{ color: "#111827" }}>
                  {formatCurrency(totals.untaxed)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <span style={{ color: "#6B7280" }}>Taxes</span>
                <span style={{ color: "#111827" }}>
                  {formatCurrency(totals.taxes)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "16px",
                  borderTop: "2px solid #E5E7EB",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {formatCurrency(selectedBill.totalAmount)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px",
                  backgroundColor:
                    paymentInfo.amountDue > 0 ? "#FEE2E2" : "#D1FAE5",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    fontWeight: "500",
                    color: paymentInfo.amountDue > 0 ? "#991B1B" : "#065F46",
                  }}
                >
                  Amount Due
                </span>
                <span
                  style={{
                    fontWeight: "700",
                    color: paymentInfo.amountDue > 0 ? "#DC2626" : "#059669",
                  }}
                >
                  {formatCurrency(paymentInfo.amountDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Vendor Details & Notes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {/* Vendor Details */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Vendor Details
            </h3>
            {selectedBill.vendor && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#EEF2FF",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Building2 size={24} color="#4F46E5" />
                  </div>
                  <div>
                    <p
                      style={{
                        fontWeight: "600",
                        color: "#111827",
                        fontSize: "16px",
                      }}
                    >
                      {selectedBill.vendor.name}
                    </p>
                    {selectedBill.vendor.email && (
                      <p style={{ color: "#6B7280", fontSize: "14px" }}>
                        {selectedBill.vendor.email}
                      </p>
                    )}
                  </div>
                </div>
                {selectedBill.vendor.address && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      padding: "12px",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                    }}
                  >
                    <MapPin
                      size={16}
                      color="#6B7280"
                      style={{ marginTop: "2px" }}
                    />
                    <span style={{ color: "#374151", fontSize: "14px" }}>
                      {selectedBill.vendor.address}
                    </span>
                  </div>
                )}
                {selectedBill.vendor.gstin && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      GSTIN
                    </span>
                    <p
                      style={{
                        fontWeight: "600",
                        color: "#111827",
                        marginTop: "4px",
                      }}
                    >
                      {selectedBill.vendor.gstin}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Internal Notes
            </h3>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
                resize: "vertical",
                marginBottom: "16px",
              }}
            />
            <button
              onClick={handleSaveNotes}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: "#4F46E5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <Save size={16} />
              Save Note
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "#9CA3AF",
            fontSize: "12px",
          }}
        >
          Shiv Furniture ERP • Financial Management Module • v4.2.0
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F9FAFB",
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {view === "list" && renderListView()}
        {view === "form" && renderFormView()}
        {view === "detail" && renderDetailView()}
      </div>
    </div>
  );
}

export default VendorBills;
