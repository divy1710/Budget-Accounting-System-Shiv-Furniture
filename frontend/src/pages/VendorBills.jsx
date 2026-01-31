import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [view, setView] = useState("list"); // list, form, detail
  const [selectedBill, setSelectedBill] = useState(null);
  const [budgetWarnings, setBudgetWarnings] = useState([]);

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
    // Check if we should open a specific bill from URL params
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
    setView("form");
  };

  const handleViewBill = async (bill) => {
    try {
      const res = await transactionsApi.getById(bill.id);
      setSelectedBill(res.data);

      // Check budget warnings
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

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-500";
      case "CONFIRMED":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-500";
      case "PARTIALLY_PAID":
        return "bg-yellow-500";
      case "NOT_PAID":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isLineOverBudget = (lineId) => {
    return budgetWarnings.some((w) => w.lineId === lineId);
  };

  const getWarningForLine = (lineId) => {
    return budgetWarnings.find((w) => w.lineId === lineId);
  };

  // Calculate payment amounts
  const calculatePaymentInfo = () => {
    if (!selectedBill) return { paidCash: 0, paidBank: 0, amountDue: 0 };

    const total = Number(selectedBill.totalAmount);
    const paidAmount = Number(selectedBill.paidAmount || 0);
    const amountDue = total - paidAmount;

    // For simplicity, showing all paid as bank
    return {
      paidCash: 0,
      paidBank: paidAmount,
      amountDue: amountDue,
    };
  };

  // List View
  const renderListView = () => (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewBill}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all"
          >
            + New
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 border border-gray-600 transition-all"
          >
            🏠 Home
          </button>
          <button
            onClick={() => setView("list")}
            className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 border border-gray-600 transition-all"
          >
            ← Back
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-white text-center py-8">Loading...</div>
      ) : (
        <div className="border-2 border-gray-600 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-700 to-gray-600">
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Bill No.
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Vendor Name
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Bill Date
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Due Date
                </th>
                <th className="px-4 py-3 text-right text-white font-bold border-r border-gray-600">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-white font-bold border-r border-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-white font-bold">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill, index) => (
                <tr
                  key={bill.id}
                  onClick={() => handleViewBill(bill)}
                  className={`border-t-2 border-gray-600 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                  }`}
                >
                  <td className="px-4 py-3 text-white font-medium border-r border-gray-700">
                    {bill.transactionNumber}
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {bill.vendor?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-cyan-400 border-r border-gray-700">
                    {bill.reference || "-"}
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {new Date(bill.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {bill.dueDate
                      ? new Date(bill.dueDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-bold border-r border-gray-700">
                    {formatCurrency(bill.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-700">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 ${
                        bill.status === "DRAFT"
                          ? "bg-yellow-600/20 text-yellow-400 border-yellow-500"
                          : bill.status === "CONFIRMED"
                            ? "bg-green-600/20 text-green-400 border-green-500"
                            : "bg-red-600/20 text-red-400 border-red-500"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {bill.status === "CONFIRMED" && (
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 ${
                          bill.paymentStatus === "PAID"
                            ? "bg-green-600/20 text-green-400 border-green-500"
                            : bill.paymentStatus === "PARTIALLY_PAID"
                              ? "bg-yellow-600/20 text-yellow-400 border-yellow-500"
                              : "bg-red-600/20 text-red-400 border-red-500"
                        }`}
                      >
                        {bill.paymentStatus.replace("_", " ")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center text-gray-400 bg-gray-800"
                  >
                    No vendor bills found. Click "+ New" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Form View
  const renderFormView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {selectedBill
            ? `Edit: ${selectedBill.transactionNumber}`
            : "New Vendor Bill"}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Home
          </button>
          <button
            onClick={() => setView("list")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-lg p-6 space-y-6"
      >
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-400 mb-1">Vendor Name</label>
            <select
              value={formData.vendorId}
              onChange={(e) =>
                setFormData({ ...formData, vendorId: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1">Bill Date</label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) =>
                  setFormData({ ...formData, transactionDate: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-gray-400 mb-1">Bill Reference</label>
          <input
            type="text"
            value={formData.reference}
            onChange={(e) =>
              setFormData({ ...formData, reference: e.target.value })
            }
            placeholder="SUP-25-001"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Lines Table */}
        <div className="border border-gray-700 rounded">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-3 py-2 text-left text-white w-12">Sr.</th>
                <th className="px-3 py-2 text-left text-white">Product</th>
                <th className="px-3 py-2 text-left text-cyan-400">
                  Budget Analytics
                </th>
                <th className="px-3 py-2 text-center text-white w-24">Qty</th>
                <th className="px-3 py-2 text-right text-white w-32">
                  Unit Price
                </th>
                <th className="px-3 py-2 text-right text-white w-32">Total</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {formData.lines.map((line, index) => (
                <tr key={index} className="border-t border-gray-700">
                  <td className="px-3 py-2 text-white">{index + 1}</td>
                  <td className="px-3 py-2">
                    <select
                      value={line.productId}
                      onChange={(e) =>
                        handleLineChange(index, "productId", e.target.value)
                      }
                      className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
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
                  <td className="px-3 py-2">
                    <select
                      value={line.analyticalAccountId}
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          "analyticalAccountId",
                          e.target.value,
                        )
                      }
                      className="w-full px-2 py-1 bg-gray-700 text-cyan-400 rounded border border-gray-600"
                    >
                      <option value="">Auto / Select</option>
                      {analyticalAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) =>
                        handleLineChange(index, "quantity", e.target.value)
                      }
                      className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-center"
                      min="1"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={(e) =>
                        handleLineChange(index, "unitPrice", e.target.value)
                      }
                      className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-right"
                      min="0"
                      step="0.01"
                      required
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-white">
                    {formatCurrency(calculateLineTotal(line))}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-600">
                <td colSpan="5" className="px-3 py-2">
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Add Line
                  </button>
                </td>
                <td className="px-3 py-2 text-right font-bold text-white">
                  {formatCurrency(calculateTotal())}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {selectedBill ? "Update" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  // Detail View
  const renderDetailView = () => {
    if (!selectedBill) return null;

    const paymentInfo = calculatePaymentInfo();
    const canPay =
      selectedBill.status === "CONFIRMED" && paymentInfo.amountDue > 0;

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex justify-between items-center bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewBill}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all"
            >
              + New
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 border border-gray-600 transition-all"
            >
              🏠 Home
            </button>
            <button
              onClick={() => setView("list")}
              className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 border border-gray-600 transition-all"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm uppercase tracking-wide">
                    Vendor Bill No.
                  </span>
                  <span className="text-2xl font-bold text-white bg-gray-800 px-4 py-1 rounded-lg border border-gray-600">
                    {selectedBill.transactionNumber}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">Vendor Name</span>
                    <span className="text-white font-medium px-3 py-1 bg-gray-800 rounded border border-gray-600">
                      {selectedBill.vendor?.name || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">
                      Bill Reference
                    </span>
                    <span className="text-cyan-400 font-medium px-3 py-1 bg-gray-800 rounded border border-gray-600">
                      {selectedBill.reference || "-"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-3">
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
                  <span className="text-gray-400 text-sm">Bill Date</span>
                  <span className="text-white font-medium">
                    {new Date(
                      selectedBill.transactionDate,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
                  <span className="text-gray-400 text-sm">Due Date</span>
                  <span className="text-white font-medium">
                    {selectedBill.dueDate
                      ? new Date(selectedBill.dueDate).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                {selectedBill.status === "CONFIRMED" && (
                  <div className="flex justify-end">
                    <span
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 ${
                        selectedBill.paymentStatus === "PAID"
                          ? "bg-green-600/20 text-green-400 border-green-500"
                          : selectedBill.paymentStatus === "PARTIALLY_PAID"
                            ? "bg-yellow-600/20 text-yellow-400 border-yellow-500"
                            : "bg-red-600/20 text-red-400 border-red-500"
                      }`}
                    >
                      {selectedBill.paymentStatus === "PAID"
                        ? "✓ Paid"
                        : selectedBill.paymentStatus === "PARTIALLY_PAID"
                          ? "◐ Partial"
                          : "○ Not Paid"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 border-b border-gray-700">
            {selectedBill.status === "DRAFT" && (
              <>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                >
                  ✓ Confirm
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 border border-gray-600 transition-all flex items-center gap-2"
                >
                  🖨 Print
                </button>
                <button
                  onClick={() => alert("Send feature coming soon")}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 border border-gray-600 transition-all flex items-center gap-2"
                >
                  📧 Send
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-700 text-red-400 rounded-lg text-sm font-medium hover:bg-gray-600 border border-gray-600 transition-all flex items-center gap-2"
                >
                  ✕ Cancel
                </button>
              </>
            )}
            {canPay && (
              <button
                onClick={handlePay}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg text-sm font-medium hover:from-pink-700 hover:to-pink-800 shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2"
              >
                💳 Pay
              </button>
            )}
            <button
              onClick={() => navigate("/budgets")}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg text-sm font-medium hover:from-cyan-700 hover:to-cyan-800 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              💰 Budget
            </button>

            {/* Status Indicators */}
            <div className="flex gap-2 ml-auto">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedBill.status === "DRAFT"
                    ? "bg-yellow-600/20 text-yellow-400 border-yellow-500 shadow-lg shadow-yellow-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                ● Draft
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedBill.status === "CONFIRMED"
                    ? "bg-green-600/20 text-green-400 border-green-500 shadow-lg shadow-green-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                ● Confirmed
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedBill.status === "CANCELLED"
                    ? "bg-red-600/20 text-red-400 border-red-500 shadow-lg shadow-red-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                ● Cancelled
              </span>
            </div>
          </div>

          {/* Budget Warning */}
          {budgetWarnings.length > 0 && (
            <div className="mx-6 mt-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500 rounded-xl p-5 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3 text-yellow-400 mb-3">
                <span className="text-2xl">⚠️</span>
                <span className="font-bold text-lg">
                  Exceeds Approved Budget
                </span>
              </div>
              <p className="text-yellow-200">
                The entered amount is higher than the remaining budget amount
                for this budget line. Consider adjusting the value or revise the
                budget.
              </p>
            </div>
          )}

          {/* Lines Table */}
          <div className="m-6">
            <div className="border-2 border-gray-600 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-700 to-gray-600">
                    <th className="px-4 py-3 text-left text-white font-bold w-16 border-r border-gray-600">
                      Sr.
                    </th>
                    <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-cyan-400 font-bold border-r border-gray-600">
                      Budget Analytics
                    </th>
                    <th className="px-4 py-3 text-center text-white font-bold w-28 border-r border-gray-600">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-white font-bold w-36 border-r border-gray-600">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-white font-bold w-40">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.lines.map((line, index) => {
                    const warning = getWarningForLine(line.id);
                    const overBudget = isLineOverBudget(line.id);

                    return (
                      <tr
                        key={line.id}
                        className={`border-t-2 border-gray-600 transition-colors ${
                          overBudget
                            ? "bg-gradient-to-r from-orange-900/30 to-red-900/20"
                            : index % 2 === 0
                              ? "bg-gray-800"
                              : "bg-gray-800/50"
                        } hover:bg-gray-700/50`}
                      >
                        <td className="px-4 py-3 text-white font-medium border-r border-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-white border-r border-gray-700">
                          {line.product?.name || "-"}
                        </td>
                        <td
                          className={`px-4 py-3 border-r border-gray-700 ${overBudget ? "text-orange-400" : "text-cyan-400"}`}
                        >
                          <span className="font-medium">
                            {line.analyticalAccount?.name || "-"}
                          </span>
                          {warning && (
                            <div className="text-xs text-orange-300 mt-1 bg-orange-900/30 px-2 py-1 rounded">
                              💰 Budget:{" "}
                              {formatCurrency(warning.budgetedAmount)} |
                              Remaining: {formatCurrency(warning.remaining)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-white font-medium border-r border-gray-700">
                          {Number(line.quantity)}
                        </td>
                        <td className="px-4 py-3 text-right text-white border-r border-gray-700">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-yellow-400 font-bold text-lg">
                            {formatCurrency(line.lineTotal)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-500 bg-gradient-to-r from-gray-700 to-gray-600">
                    <td
                      colSpan="5"
                      className="px-4 py-4 text-right font-bold text-white text-lg"
                    >
                      Grand Total
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-cyan-400 font-bold text-xl bg-gray-800 px-4 py-2 rounded-lg border border-cyan-500">
                        {formatCurrency(selectedBill.totalAmount)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          {selectedBill.status === "CONFIRMED" && (
            <div className="flex justify-end mx-6 mb-6">
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-5 space-y-3 min-w-[300px] border border-gray-600 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">💵 Paid Via Cash</span>
                  <span className="text-white font-medium">
                    {formatCurrency(paymentInfo.paidCash)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🏦 Paid Via Bank</span>
                  <span className="text-white font-medium">
                    {formatCurrency(paymentInfo.paidBank)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-gray-600 pt-3">
                  <span className="text-gray-400 font-medium">Amount Due</span>
                  <span
                    className={`font-bold text-lg px-3 py-1 rounded-lg ${
                      paymentInfo.amountDue > 0
                        ? "text-red-400 bg-red-900/20 border border-red-500"
                        : "text-green-400 bg-green-900/20 border border-green-500"
                    }`}
                  >
                    {formatCurrency(paymentInfo.amountDue)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Linked PO */}
          {selectedBill.parentTransaction && (
            <div className="mx-6 mb-6 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-2 border-blue-500 rounded-xl p-5 shadow-lg shadow-blue-500/10">
              <div className="text-blue-400 font-bold text-lg mb-3 flex items-center gap-2">
                📋 Created from Purchase Order
              </div>
              <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                <span className="text-white font-medium">
                  {selectedBill.parentTransaction.transactionNumber}
                </span>
                <button
                  onClick={() =>
                    navigate(`/purchase-orders?id=${selectedBill.parentId}`)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  View PO →
                </button>
              </div>
            </div>
          )}

          {/* Edit/Delete for Draft */}
          {selectedBill.status === "DRAFT" && (
            <div className="flex gap-4 p-6 border-t border-gray-700">
              <button
                onClick={() => handleEditBill(selectedBill)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all"
              >
                ✏️ Edit Bill
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/20 transition-all"
              >
                🗑️ Delete Bill
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-light text-white text-center mb-8 tracking-wide">
          Vendor Bill
        </h1>

        {view === "list" && renderListView()}
        {view === "form" && renderFormView()}
        {view === "detail" && renderDetailView()}
      </div>
    </div>
  );
}

export default VendorBills;
