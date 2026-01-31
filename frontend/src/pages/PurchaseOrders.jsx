import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  const [formData, setFormData] = useState({
    vendorId: "",
    reference: "",
    transactionDate: new Date().toISOString().split("T")[0],
    lines: [{ productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, vendorsRes, productsRes, analyticalRes] = await Promise.all([
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
      lines: [{ productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 }],
    });
    setBudgetWarnings([]);
    setView("form");
  };

  const handleViewOrder = async (order) => {
    try {
      const res = await transactionsApi.getById(order.id);
      setSelectedOrder(res.data);
      
      // Check budget warnings
      if (res.data.status === "DRAFT") {
        const warningsRes = await transactionsApi.getBudgetWarnings(order.id);
        setBudgetWarnings(warningsRes.data);
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
      transactionDate: new Date(order.transactionDate).toISOString().split("T")[0],
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
      lines: [...formData.lines, { productId: "", analyticalAccountId: "", quantity: 1, unitPrice: 0 }],
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

  const calculateTotal = () => {
    return formData.lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        type: "PURCHASE_ORDER",
        vendorId: parseInt(formData.vendorId),
        reference: formData.reference,
        transactionDate: formData.transactionDate,
        lines: formData.lines.map((line) => ({
          productId: parseInt(line.productId),
          analyticalAccountId: line.analyticalAccountId ? parseInt(line.analyticalAccountId) : null,
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice),
          gstRate: 0, // No GST for now, can be added later
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
    
    // Show warning if there are budget warnings
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

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT": return "bg-gray-500";
      case "CONFIRMED": return "bg-green-500";
      case "CANCELLED": return "bg-red-500";
      default: return "bg-gray-500";
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

  // List View
  const renderListView = () => (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleNewOrder}
          className="px-6 py-2 bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700 transition"
        >
          New
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700 transition"
          >
            Home
          </button>
          <button
            onClick={() => setView("list")}
            className="px-6 py-2 bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700 transition"
          >
            Back
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-white text-center py-12">Loading...</div>
      ) : (
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="px-4 py-4 text-left text-gray-400 font-normal">PO No.</th>
                <th className="px-4 py-4 text-left text-gray-400 font-normal">Vendor Name</th>
                <th className="px-4 py-4 text-left text-gray-400 font-normal">Reference</th>
                <th className="px-4 py-4 text-left text-gray-400 font-normal">PO Date</th>
                <th className="px-4 py-4 text-right text-gray-400 font-normal">Total</th>
                <th className="px-4 py-4 text-center text-gray-400 font-normal">Status</th>
                <th className="px-4 py-4 text-center text-gray-400 font-normal">Bill</th>
              </tr>
            </thead>
            <tbody className="bg-gray-950">
              {orders.map((order, idx) => (
                <tr
                  key={order.id}
                  onClick={() => handleViewOrder(order)}
                  className={`border-t border-gray-800 hover:bg-gray-800 cursor-pointer transition ${
                    idx % 2 === 0 ? "bg-gray-950" : "bg-gray-900"
                  }`}
                >
                  <td className="px-4 py-4 text-white font-medium">{order.transactionNumber}</td>
                  <td className="px-4 py-4 text-white">{order.vendor?.name || "-"}</td>
                  <td className="px-4 py-4 text-gray-500">{order.reference || "-"}</td>
                  <td className="px-4 py-4 text-white">
                    {new Date(order.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right text-yellow-400 font-medium">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-3 py-1.5 rounded text-xs font-medium ${
                      order.status === "DRAFT" ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600" :
                      order.status === "CONFIRMED" ? "bg-green-600/20 text-green-400 border border-green-600" :
                      "bg-red-600/20 text-red-400 border border-red-600"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {order.childTransactions?.length > 0 ? (
                      <span className="text-green-400 font-medium">✓ Created</span>
                    ) : order.status === "CONFIRMED" ? (
                      <span className="text-yellow-400">Pending</span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                    No purchase orders found. Click "New" to create one.
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
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center bg-gray-900 rounded-lg p-4 border border-gray-700">
        <h1 className="text-2xl font-bold text-white">
          {selectedOrder ? `✏️ Edit: ${selectedOrder.transactionNumber}` : "📋 New Purchase Order"}
        </h1>
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

      <form onSubmit={handleSubmit} className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl">
        {/* Header Info */}
        <div className="p-6 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">Vendor Name</label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">from Contact Master - Many to one</span>
            </div>
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">PO Date</label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">Reference</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="REQ-25-0001"
              className="w-full px-4 py-3 bg-gray-800 text-cyan-400 rounded-lg border-2 border-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <span className="text-xs text-gray-500">Alpha numeric (text)</span>
          </div>
        </div>

        {/* Lines Table */}
        <div className="p-6">
          <div className="border-2 border-gray-600 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-700 to-gray-600">
                  <th className="px-4 py-3 text-left text-white font-bold w-16 border-r border-gray-600">Sr.</th>
                  <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">Product</th>
                  <th className="px-4 py-3 text-left text-cyan-400 font-bold border-r border-gray-600">Budget Analytics</th>
                  <th className="px-4 py-3 text-center text-white font-bold w-28 border-r border-gray-600">Qty</th>
                  <th className="px-4 py-3 text-right text-white font-bold w-36 border-r border-gray-600">Unit Price</th>
                  <th className="px-4 py-3 text-right text-white font-bold w-36 border-r border-gray-600">Total</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {formData.lines.map((line, index) => (
                  <tr key={index} className={`border-t-2 border-gray-600 ${index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"}`}>
                    <td className="px-4 py-3 text-white font-medium border-r border-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 border-r border-gray-700">
                      <select
                        value={line.productId}
                        onChange={(e) => handleLineChange(index, "productId", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                    <td className="px-4 py-3 border-r border-gray-700">
                      <select
                        value={line.analyticalAccountId}
                        onChange={(e) => handleLineChange(index, "analyticalAccountId", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 text-cyan-400 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="">Auto / Select</option>
                        {analyticalAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-700">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(index, "quantity", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-center focus:border-blue-500 focus:outline-none"
                        min="1"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-700">
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(index, "unitPrice", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-right focus:border-blue-500 focus:outline-none"
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-yellow-400 font-bold border-r border-gray-700">
                      {formatCurrency(calculateLineTotal(line))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all text-lg font-bold"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-500 bg-gradient-to-r from-gray-700 to-gray-600">
                  <td colSpan="5" className="px-4 py-4">
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-medium border border-blue-500/50"
                    >
                      + Add New Line
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-cyan-400 font-bold text-xl bg-gray-800 px-4 py-2 rounded-lg border border-cyan-500">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 p-6 border-t border-gray-700">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20 transition-all"
          >
            {selectedOrder ? "✓ Update Order" : "💾 Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 border border-gray-600 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  // Detail View
  const renderDetailView = () => {
    if (!selectedOrder) return null;

    const hasBill = selectedOrder.childTransactions?.length > 0;

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex justify-between items-center bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewOrder}
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
                  <span className="text-gray-400 text-sm uppercase tracking-wide">PO No.</span>
                  <span className="text-2xl font-bold text-white bg-gray-800 px-4 py-1 rounded-lg border border-gray-600">
                    {selectedOrder.transactionNumber}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">Vendor Name</span>
                    <span className="text-white font-medium px-3 py-1 bg-gray-800 rounded border border-gray-600">
                      {selectedOrder.vendor?.name || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">Reference</span>
                    <span className="text-cyan-400 font-medium px-3 py-1 bg-gray-800 rounded border border-gray-600">
                      {selectedOrder.reference || "-"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
                  <span className="text-gray-400 text-sm">PO Date</span>
                  <span className="text-white font-medium">
                    {new Date(selectedOrder.transactionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 border-b border-gray-700">
            {selectedOrder.status === "DRAFT" && (
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
            {selectedOrder.status === "CONFIRMED" && !hasBill && (
              <button
                onClick={handleCreateBill}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg text-sm font-medium hover:from-pink-700 hover:to-pink-800 shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2"
              >
                📄 Create Bill
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
              <span className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedOrder.status === "DRAFT" 
                  ? "bg-yellow-600/20 text-yellow-400 border-yellow-500 shadow-lg shadow-yellow-500/10" 
                  : "bg-gray-800 text-gray-500 border-gray-700"
              }`}>
                ● Draft
              </span>
              <span className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedOrder.status === "CONFIRMED" 
                  ? "bg-green-600/20 text-green-400 border-green-500 shadow-lg shadow-green-500/10" 
                  : "bg-gray-800 text-gray-500 border-gray-700"
              }`}>
                ● Confirmed
              </span>
              <span className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedOrder.status === "CANCELLED" 
                  ? "bg-red-600/20 text-red-400 border-red-500 shadow-lg shadow-red-500/10" 
                  : "bg-gray-800 text-gray-500 border-gray-700"
              }`}>
                ● Cancelled
              </span>
            </div>
          </div>

          {/* Budget Warning */}
          {budgetWarnings.length > 0 && (
            <div className="mx-6 mt-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500 rounded-xl p-5 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3 text-yellow-400 mb-3">
                <span className="text-2xl">⚠️</span>
                <span className="font-bold text-lg">Exceeds Approved Budget</span>
              </div>
              <p className="text-yellow-200">
                The entered amount is higher than the remaining budget amount for this budget line. 
                Consider adjusting the value or revise the budget.
              </p>
            </div>
          )}

          {/* Lines Table */}
          <div className="m-6">
            <div className="border-2 border-gray-600 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-700 to-gray-600">
                    <th className="px-4 py-3 text-left text-white font-bold w-16 border-r border-gray-600">Sr.</th>
                    <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">Product</th>
                    <th className="px-4 py-3 text-left text-cyan-400 font-bold border-r border-gray-600">Budget Analytics</th>
                    <th className="px-4 py-3 text-center text-white font-bold w-28 border-r border-gray-600">Qty</th>
                    <th className="px-4 py-3 text-right text-white font-bold w-36 border-r border-gray-600">Unit Price</th>
                    <th className="px-4 py-3 text-right text-white font-bold w-40">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines.map((line, index) => {
                    const warning = getWarningForLine(line.id);
                    const overBudget = isLineOverBudget(line.id);
                    
                    return (
                      <tr 
                        key={line.id} 
                        className={`border-t-2 border-gray-600 transition-colors ${
                          overBudget 
                            ? "bg-gradient-to-r from-orange-900/30 to-red-900/20" 
                            : index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                        } hover:bg-gray-700/50`}
                      >
                        <td className="px-4 py-3 text-white font-medium border-r border-gray-700">{index + 1}</td>
                        <td className="px-4 py-3 text-white border-r border-gray-700">{line.product?.name || "-"}</td>
                        <td className={`px-4 py-3 border-r border-gray-700 ${overBudget ? "text-orange-400" : "text-cyan-400"}`}>
                          <span className="font-medium">{line.analyticalAccount?.name || "-"}</span>
                          {warning && (
                            <div className="text-xs text-orange-300 mt-1 bg-orange-900/30 px-2 py-1 rounded">
                              💰 Budget: {formatCurrency(warning.budgetedAmount)} | 
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
                          <span className="text-yellow-400 font-bold text-lg">{formatCurrency(line.lineTotal)}</span>
                          <div className="text-xs text-gray-400 mt-1">
                            ({line.quantity} qty × {formatCurrency(line.unitPrice)})
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-500 bg-gradient-to-r from-gray-700 to-gray-600">
                    <td colSpan="5" className="px-4 py-4 text-right font-bold text-white text-lg">Grand Total</td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-cyan-400 font-bold text-xl bg-gray-800 px-4 py-2 rounded-lg border border-cyan-500">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Linked Bill */}
          {hasBill && (
            <div className="mx-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500 rounded-xl p-5 shadow-lg shadow-green-500/10">
              <div className="text-green-400 font-bold text-lg mb-3 flex items-center gap-2">
                ✓ Bill Created
              </div>
              {selectedOrder.childTransactions.map((bill) => (
                <div key={bill.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                  <span className="text-white font-medium">{bill.transactionNumber}</span>
                  <button
                    onClick={() => navigate(`/vendor-bills?id=${bill.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                  >
                    View Bill →
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Edit/Delete for Draft */}
          {selectedOrder.status === "DRAFT" && (
            <div className="flex gap-4 p-6 border-t border-gray-700">
              <button
                onClick={() => handleEditOrder(selectedOrder)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all"
              >
                ✏️ Edit Order
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/20 transition-all"
              >
                🗑️ Delete Order
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
          Purchase Order
        </h1>
        
        {view === "list" && renderListView()}
        {view === "form" && renderFormView()}
        {view === "detail" && renderDetailView()}
      </div>
    </div>
  );
}

export default PurchaseOrders;
