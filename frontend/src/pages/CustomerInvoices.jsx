import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  transactionsApi,
  contactsApi,
  productsApi,
  analyticalAccountsApi,
  paymentsApi,
} from "../services/api";

function CustomerInvoices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analyticalAccounts, setAnalyticalAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, form, detail
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [formData, setFormData] = useState({
    customerId: "",
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
        newLines[index].unitPrice = Number(product.salePrice);
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
          gstRate: 0,
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
      const res = await paymentsApi.createFromTransaction(selectedInvoice.id);
      navigate(`/invoice-payments?id=${res.data.id}`);
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
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate payment amounts
  const calculatePaymentInfo = () => {
    if (!selectedInvoice) return { paidCash: 0, paidBank: 0, amountDue: 0 };

    const total = Number(selectedInvoice.totalAmount);
    const paidAmount = Number(selectedInvoice.paidAmount || 0);
    const amountDue = total - paidAmount;

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
            onClick={handleNewInvoice}
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
                  Invoice No.
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Customer Name
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Invoice Date
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
              {invoices.map((invoice, index) => (
                <tr
                  key={invoice.id}
                  onClick={() => handleViewInvoice(invoice)}
                  className={`border-t-2 border-gray-600 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                  }`}
                >
                  <td className="px-4 py-3 text-white font-medium border-r border-gray-700">
                    {invoice.transactionNumber}
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {invoice.customer?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-pink-400 border-r border-gray-700">
                    {invoice.reference || "-"}
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {new Date(invoice.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-bold border-r border-gray-700">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-700">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 ${
                        invoice.status === "DRAFT"
                          ? "bg-yellow-600/20 text-yellow-400 border-yellow-500"
                          : invoice.status === "CONFIRMED"
                            ? "bg-green-600/20 text-green-400 border-green-500"
                            : "bg-red-600/20 text-red-400 border-red-500"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {invoice.status === "CONFIRMED" && (
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 ${
                          invoice.paymentStatus === "PAID"
                            ? "bg-green-600/20 text-green-400 border-green-500"
                            : invoice.paymentStatus === "PARTIALLY_PAID"
                              ? "bg-yellow-600/20 text-yellow-400 border-yellow-500"
                              : "bg-red-600/20 text-red-400 border-red-500"
                        }`}
                      >
                        {invoice.paymentStatus === "PAID"
                          ? "Paid"
                          : invoice.paymentStatus === "PARTIALLY_PAID"
                            ? "Partial"
                            : "Not Paid"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-12 text-center text-gray-400 bg-gray-800"
                  >
                    No customer invoices found. Click "+ New" to create one.
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
          {selectedInvoice
            ? `✏️ Edit: ${selectedInvoice.transactionNumber}`
            : "📄 New Customer Invoice"}
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

      <form
        onSubmit={handleSubmit}
        className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl"
      >
        {/* Header Info */}
        <div className="p-6 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
                Customer Name
              </label>
              <select
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                from Contact Master - Many to one
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
                  Invoice Date
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
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
              Reference
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              placeholder="Alpha numeric (text)"
              className="w-full px-4 py-3 bg-gray-800 text-pink-400 rounded-lg border-2 border-gray-600 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
          </div>
        </div>

        {/* Lines Table */}
        <div className="p-6">
          <div className="border-2 border-gray-600 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-700 to-gray-600">
                  <th className="px-4 py-3 text-left text-white font-bold w-16 border-r border-gray-600">
                    Sr. No.
                  </th>
                  <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-cyan-400 font-bold border-r border-gray-600">
                    Budget Analytics
                  </th>
                  <th className="px-4 py-3 text-center text-cyan-400 font-bold w-28 border-r border-gray-600">
                    <div>1</div>
                    <div className="text-xs">Qty</div>
                  </th>
                  <th className="px-4 py-3 text-right text-cyan-400 font-bold w-36 border-r border-gray-600">
                    <div>2</div>
                    <div className="text-xs">Unit Price</div>
                  </th>
                  <th className="px-4 py-3 text-right text-cyan-400 font-bold w-40">
                    <div>3</div>
                    <div className="text-xs">Total</div>
                  </th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {formData.lines.map((line, index) => (
                  <tr
                    key={index}
                    className={`border-t-2 border-gray-600 ${index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"}`}
                  >
                    <td className="px-4 py-3 text-white font-medium border-r border-gray-700">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-700">
                      <select
                        value={line.productId}
                        onChange={(e) =>
                          handleLineChange(index, "productId", e.target.value)
                        }
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
                      <span className="text-xs text-gray-500">
                        (from Product Master - Many to one)
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-700">
                      <select
                        value={line.analyticalAccountId}
                        onChange={(e) =>
                          handleLineChange(
                            index,
                            "analyticalAccountId",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 bg-gray-700 text-cyan-400 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="">Auto / Select</option>
                        {analyticalAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-500">
                        (from Analytical Master - Many to One)
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-700">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) =>
                          handleLineChange(index, "quantity", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-center focus:border-blue-500 focus:outline-none"
                        min="1"
                        required
                      />
                      <div className="text-xs text-gray-500 text-center">
                        Number
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-700">
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) =>
                          handleLineChange(index, "unitPrice", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-right focus:border-blue-500 focus:outline-none"
                        min="0"
                        step="0.01"
                        required
                      />
                      <div className="text-xs text-gray-500 text-right">
                        Monetary
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right border-r border-gray-700">
                      <span className="text-yellow-400 font-bold">
                        {formatCurrency(calculateLineTotal(line))}
                      </span>
                      <div className="text-xs text-gray-500">
                        ( {line.quantity} qty × {formatCurrency(line.unitPrice)}{" "}
                        )
                      </div>
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
                  <td className="px-4 py-4 text-right" colSpan="2">
                    <div className="text-gray-400 text-sm mb-1">Total</div>
                    <span className="text-yellow-400 font-bold text-xl bg-gray-800 px-4 py-2 rounded-lg border border-yellow-500">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </td>
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
            {selectedInvoice ? "✓ Update Invoice" : "💾 Save Draft"}
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
    if (!selectedInvoice) return null;

    const paymentInfo = calculatePaymentInfo();
    const canPay =
      selectedInvoice.status === "CONFIRMED" && paymentInfo.amountDue > 0;

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex justify-between items-center bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewInvoice}
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
                    Customer Invoice No.
                  </span>
                  <span className="text-2xl font-bold text-white bg-gray-800 px-4 py-1 rounded-lg border border-gray-600">
                    {selectedInvoice.transactionNumber}
                  </span>
                  <span className="text-xs text-gray-500">
                    ( auto generate Invoice Number + 1 of last Invoice No. )
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">Customer Name</span>
                    <span className="text-pink-400 font-medium px-3 py-1 bg-gray-800 rounded border border-gray-600">
                      {selectedInvoice.customer?.name || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">Reference</span>
                    <span className="text-pink-400 font-medium px-3 py-1 bg-gray-800 rounded border border-gray-600">
                      {selectedInvoice.reference || "-"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-3">
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
                  <span className="text-pink-400 text-sm">Invoice Date</span>
                  <span className="text-white font-medium">
                    {new Date(
                      selectedInvoice.transactionDate,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
                  <span className="text-gray-400 text-sm">Due Date</span>
                  <span className="text-white font-medium">
                    {selectedInvoice.dueDate
                      ? new Date(selectedInvoice.dueDate).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                {selectedInvoice.status === "CONFIRMED" && (
                  <div className="flex gap-2 justify-end">
                    <span
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 ${
                        selectedInvoice.paymentStatus === "PAID"
                          ? "bg-green-600/20 text-green-400 border-green-500"
                          : selectedInvoice.paymentStatus === "PARTIALLY_PAID"
                            ? "bg-yellow-600/20 text-yellow-400 border-yellow-500"
                            : "bg-red-600/20 text-red-400 border-red-500"
                      }`}
                    >
                      {selectedInvoice.paymentStatus === "PAID"
                        ? "Paid"
                        : selectedInvoice.paymentStatus === "PARTIALLY_PAID"
                          ? "Partial"
                          : "Not Paid"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 border-b border-gray-700">
            {selectedInvoice.status === "DRAFT" && (
              <>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg text-sm font-medium hover:from-pink-700 hover:to-pink-800 shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2 border border-pink-500"
                >
                  Confirm
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 border border-gray-600 transition-all"
                >
                  Print
                </button>
                <button
                  onClick={() => alert("Send feature coming soon")}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 border border-gray-600 transition-all"
                >
                  Send
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 border border-gray-600 transition-all"
                >
                  Cancel
                </button>
              </>
            )}
            {canPay && (
              <button
                onClick={handlePay}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 border border-purple-500"
              >
                Pay
              </button>
            )}

            {/* Status Indicators */}
            <div className="flex gap-2 ml-auto">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedInvoice.status === "DRAFT"
                    ? "bg-yellow-600/20 text-yellow-400 border-yellow-500 shadow-lg shadow-yellow-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                Draft
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedInvoice.status === "CONFIRMED"
                    ? "bg-green-600/20 text-green-400 border-green-500 shadow-lg shadow-green-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                Confirm
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedInvoice.status === "CANCELLED"
                    ? "bg-red-600/20 text-red-400 border-red-500 shadow-lg shadow-red-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                Cancelled
              </span>
            </div>
          </div>

          {/* Lines Table */}
          <div className="m-6">
            <div className="border-2 border-gray-600 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-700 to-gray-600">
                    <th className="px-4 py-3 text-left text-white font-bold w-16 border-r border-gray-600">
                      Sr. No.
                    </th>
                    <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-cyan-400 font-bold border-r border-gray-600">
                      Budget Analytics
                    </th>
                    <th className="px-4 py-3 text-center text-cyan-400 font-bold w-28 border-r border-gray-600">
                      <div>1</div>
                      <div className="text-xs">Qty</div>
                    </th>
                    <th className="px-4 py-3 text-right text-cyan-400 font-bold w-36 border-r border-gray-600">
                      <div>2</div>
                      <div className="text-xs">Unit Price</div>
                    </th>
                    <th className="px-4 py-3 text-right text-cyan-400 font-bold w-40">
                      <div>3</div>
                      <div className="text-xs">Total</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lines.map((line, index) => (
                    <tr
                      key={line.id}
                      className={`border-t-2 border-gray-600 transition-colors ${
                        index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                      } hover:bg-gray-700/50`}
                    >
                      <td className="px-4 py-3 text-white font-medium border-r border-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-white border-r border-gray-700">
                        {line.product?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-cyan-400 border-r border-gray-700">
                        {line.analyticalAccount?.name || "-"}
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
                        <div className="text-xs text-gray-400 mt-1">
                          ( {line.quantity} qty ×{" "}
                          {formatCurrency(line.unitPrice)} )
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-500 bg-gradient-to-r from-gray-700 to-gray-600">
                    <td
                      colSpan="5"
                      className="px-4 py-4 text-right font-bold text-white text-lg"
                    >
                      Total
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-yellow-400 font-bold text-xl bg-gray-800 px-4 py-2 rounded-lg border border-yellow-500">
                        {formatCurrency(selectedInvoice.totalAmount)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          {selectedInvoice.status === "CONFIRMED" && (
            <div className="flex justify-end mx-6 mb-6">
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-5 space-y-3 min-w-[300px] border border-gray-600 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Paid Via Cash</span>
                  <span className="text-white font-medium">
                    {formatCurrency(paymentInfo.paidCash)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Paid Via Bank</span>
                  <span className="text-white font-medium">
                    {formatCurrency(paymentInfo.paidBank)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-gray-600 pt-3">
                  <span className="text-pink-400 font-medium">Amount Due</span>
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
                <div className="text-xs text-gray-500 text-right">
                  ( Total - Payment )
                </div>
              </div>
            </div>
          )}

          {/* Payment Status Legend */}
          {selectedInvoice.status === "CONFIRMED" && (
            <div className="mx-6 mb-6 space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-600/20 text-green-400 border border-green-500 rounded text-sm">
                  Paid
                </span>
                <span className="text-gray-400 text-sm">If amount due = 0</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-500 rounded text-sm">
                  Partial
                </span>
                <span className="text-gray-400 text-sm">
                  If amount due &lt; Invoice Total
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500 rounded text-sm">
                  Not Paid
                </span>
                <span className="text-gray-400 text-sm">
                  If amount due = Invoice Total
                </span>
              </div>
            </div>
          )}

          {/* Linked SO */}
          {selectedInvoice.parentTransaction && (
            <div className="mx-6 mb-6 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-2 border-blue-500 rounded-xl p-5 shadow-lg shadow-blue-500/10">
              <div className="text-blue-400 font-bold text-lg mb-3 flex items-center gap-2">
                📋 Invoice created from SO
              </div>
              <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                <span className="text-white font-medium">
                  {selectedInvoice.parentTransaction.transactionNumber}
                </span>
                <button
                  onClick={() =>
                    navigate(`/sales-orders?id=${selectedInvoice.parentId}`)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  View SO →
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                fetch customer name, product, price, qty
              </div>
            </div>
          )}

          {/* Edit/Delete for Draft */}
          {selectedInvoice.status === "DRAFT" && (
            <div className="flex gap-4 p-6 border-t border-gray-700">
              <button
                onClick={() => handleEditInvoice(selectedInvoice)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all"
              >
                ✏️ Edit Invoice
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/20 transition-all"
              >
                🗑️ Delete Invoice
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
          Customer Invoice
        </h1>

        {view === "list" && renderListView()}
        {view === "form" && renderFormView()}
        {view === "detail" && renderDetailView()}
      </div>
    </div>
  );
}

export default CustomerInvoices;
