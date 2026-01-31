import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentsApi, contactsApi } from "../services/api";

function InvoicePayments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, form, detail
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [formData, setFormData] = useState({
    paymentType: "RECEIVE",
    partnerId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const paymentId = searchParams.get("id");
    if (paymentId && payments.length > 0) {
      const payment = payments.find((p) => p.id === paymentId);
      if (payment) {
        handleViewPayment(payment);
      }
    }
  }, [searchParams, payments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, customersRes] = await Promise.all([
        paymentsApi.getAll({ type: "RECEIVE" }),
        contactsApi.getCustomers(),
      ]);
      setPayments(paymentsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPayment = () => {
    setSelectedPayment(null);
    setFormData({
      paymentType: "RECEIVE",
      partnerId: "",
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
    });
    setView("form");
  };

  const handleViewPayment = async (payment) => {
    try {
      const res = await paymentsApi.getById(payment.id);
      setSelectedPayment(res.data);
      setView("detail");
    } catch (error) {
      console.error("Error fetching payment:", error);
    }
  };

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      paymentType: payment.paymentType || "RECEIVE",
      partnerId: payment.partnerId || "",
      amount: Number(payment.amount),
      paymentDate: new Date(payment.paymentDate).toISOString().split("T")[0],
      reference: payment.reference || "",
      notes: payment.notes || "",
    });
    setView("form");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        paymentType: formData.paymentType,
        partnerId: parseInt(formData.partnerId),
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        reference: formData.reference,
        notes: formData.notes,
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
      const res = await paymentsApi.getById(selectedPayment.id);
      setSelectedPayment(res.data);
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert(error.response?.data?.error || "Error confirming payment");
    }
  };

  const handleCancel = async () => {
    if (!selectedPayment) return;
    if (!window.confirm("Are you sure you want to cancel this payment?"))
      return;

    try {
      await paymentsApi.cancel(selectedPayment.id);
      await fetchData();
      const res = await paymentsApi.getById(selectedPayment.id);
      setSelectedPayment(res.data);
    } catch (error) {
      console.error("Error cancelling payment:", error);
      alert(error.response?.data?.error || "Error cancelling payment");
    }
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    if (!window.confirm("Are you sure you want to delete this payment?"))
      return;

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
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // List View
  const renderListView = () => (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewPayment}
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
                  Payment No.
                </th>
                <th className="px-4 py-3 text-center text-white font-bold border-r border-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Partner
                </th>
                <th className="px-4 py-3 text-right text-white font-bold border-r border-gray-600">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Date
                </th>
                <th className="px-4 py-3 text-center text-white font-bold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr
                  key={payment.id}
                  onClick={() => handleViewPayment(payment)}
                  className={`border-t-2 border-gray-600 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                  }`}
                >
                  <td className="px-4 py-3 text-white font-medium border-r border-gray-700">
                    {payment.paymentNumber}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-700">
                    <span className="px-3 py-1.5 rounded-lg text-xs font-medium border-2 bg-green-600/20 text-green-400 border-green-500">
                      Receive
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {payment.partner?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold border-r border-gray-700 text-green-400">
                    + {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 ${
                        payment.status === "DRAFT"
                          ? "bg-yellow-600/20 text-yellow-400 border-yellow-500"
                          : payment.status === "CONFIRMED"
                            ? "bg-green-600/20 text-green-400 border-green-500"
                            : "bg-red-600/20 text-red-400 border-red-500"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-12 text-center text-gray-400 bg-gray-800"
                  >
                    No invoice payments found. Click "+ New" to create one.
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
          {selectedPayment
            ? `✏️ Edit: ${selectedPayment.paymentNumber}`
            : "💳 New Invoice Payment"}
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
        className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl p-6 space-y-6"
      >
        {/* Payment Type */}
        <div className="flex items-center gap-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="text-gray-400 font-medium">Payment Type</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="paymentType"
              value="SEND"
              checked={formData.paymentType === "SEND"}
              onChange={(e) =>
                setFormData({ ...formData, paymentType: e.target.value })
              }
              className="w-5 h-5 text-red-600"
            />
            <span className="text-red-400 font-medium">Send</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="paymentType"
              value="RECEIVE"
              checked={formData.paymentType === "RECEIVE"}
              onChange={(e) =>
                setFormData({ ...formData, paymentType: e.target.value })
              }
              className="w-5 h-5 text-green-600"
            />
            <span className="text-green-400 font-medium">Receive</span>
          </label>
          <span className="text-xs text-gray-500">
            (Select Receive for customer invoices)
          </span>
        </div>

        {/* Partner */}
        <div className="space-y-2">
          <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
            Partner
          </label>
          <select
            value={formData.partnerId}
            onChange={(e) =>
              setFormData({ ...formData, partnerId: e.target.value })
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
          <span className="text-xs text-gray-500">from Contact Master</span>
        </div>

        {/* Amount & Date Row */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
              Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="0"
              className="w-full px-4 py-3 bg-gray-800 text-green-400 rounded-lg border-2 border-gray-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all text-xl font-bold"
              min="0"
              step="0.01"
              required
            />
            <span className="text-xs text-gray-500">
              Monetary - from Invoice due amount
            </span>
          </div>
          <div className="space-y-2">
            <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
              Date
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) =>
                setFormData({ ...formData, paymentDate: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
            <span className="text-xs text-gray-500">Default today</span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
            Note
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Alpha numeric (text)"
            rows="3"
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-700">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20 transition-all"
          >
            {selectedPayment ? "✓ Update Payment" : "💾 Save Draft"}
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
    if (!selectedPayment) return null;

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex justify-between items-center bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewPayment}
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
                    Payment Number
                  </span>
                  <span className="text-2xl font-bold text-white bg-gray-800 px-4 py-1 rounded-lg border border-gray-600">
                    {selectedPayment.paymentNumber}
                  </span>
                  <span className="text-xs text-gray-500">
                    ( auto generate Payment Number + 1 of last Pay No. )
                  </span>
                </div>
              </div>
              <div className="text-right space-y-3">
                <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
                  <span className="text-gray-400 text-sm">Date</span>
                  <span className="text-white font-medium">
                    {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 border-b border-gray-700">
            {selectedPayment.status === "DRAFT" && (
              <>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 border border-green-500"
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

            {/* Status Indicators */}
            <div className="flex gap-2 ml-auto">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedPayment.status === "DRAFT"
                    ? "bg-yellow-600/20 text-yellow-400 border-yellow-500 shadow-lg shadow-yellow-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                Draft
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedPayment.status === "CONFIRMED"
                    ? "bg-green-600/20 text-green-400 border-green-500 shadow-lg shadow-green-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                Confirm
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedPayment.status === "CANCELLED"
                    ? "bg-red-600/20 text-red-400 border-red-500 shadow-lg shadow-red-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                Cancelled
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6 space-y-6">
            {/* Payment Type */}
            <div className="flex items-center gap-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
              <span className="text-gray-400 font-medium">Payment Type</span>
              <label className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPayment.paymentType === "SEND"
                      ? "border-red-500 bg-red-500"
                      : "border-gray-600"
                  }`}
                >
                  {selectedPayment.paymentType === "SEND" && (
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  )}
                </span>
                <span className="text-red-400 font-medium">Send</span>
              </label>
              <label className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPayment.paymentType === "RECEIVE"
                      ? "border-green-500 bg-green-500"
                      : "border-gray-600"
                  }`}
                >
                  {selectedPayment.paymentType === "RECEIVE" && (
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  )}
                </span>
                <span className="text-green-400 font-medium">Receive</span>
              </label>
            </div>

            {/* Partner */}
            <div className="space-y-2 p-4 bg-gray-800 rounded-lg border border-gray-600">
              <label className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                Partner
              </label>
              <div className="text-xl text-white font-medium">
                {selectedPayment.partner?.name || "-"}
              </div>
              <span className="text-xs text-gray-500">from Invoice</span>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 p-4 bg-gray-800 rounded-lg border border-gray-600">
                <label className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                  Amount
                </label>
                <div className="text-2xl text-green-400 font-bold">
                  + {formatCurrency(selectedPayment.amount)}
                </div>
                <span className="text-xs text-gray-500">
                  from Invoice due amount
                </span>
              </div>
              <div className="space-y-2 p-4 bg-gray-800 rounded-lg border border-gray-600">
                <label className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                  Date
                </label>
                <div className="text-xl text-white font-medium">
                  {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                </div>
                <span className="text-xs text-gray-500">Default today</span>
              </div>
            </div>

            {/* Notes */}
            {selectedPayment.notes && (
              <div className="space-y-2 p-4 bg-gray-800 rounded-lg border border-gray-600">
                <label className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                  Note
                </label>
                <div className="text-white whitespace-pre-wrap">
                  {selectedPayment.notes}
                </div>
                <span className="text-xs text-gray-500">
                  Alpha numeric (text)
                </span>
              </div>
            )}
          </div>

          {/* Linked Invoice */}
          {selectedPayment.transaction && (
            <div className="mx-6 mb-6 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-2 border-purple-500 rounded-xl p-5 shadow-lg shadow-purple-500/10">
              <div className="text-purple-400 font-bold text-lg mb-3 flex items-center gap-2">
                📄 Payment created from Invoice
              </div>
              <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                <span className="text-white font-medium">
                  {selectedPayment.transaction.transactionNumber}
                </span>
                <button
                  onClick={() =>
                    navigate(
                      `/customer-invoices?id=${selectedPayment.transactionId}`,
                    )
                  }
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium"
                >
                  View Invoice →
                </button>
              </div>
            </div>
          )}

          {/* Edit/Delete for Draft */}
          {selectedPayment.status === "DRAFT" && (
            <div className="flex gap-4 p-6 border-t border-gray-700">
              <button
                onClick={() => handleEditPayment(selectedPayment)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all"
              >
                ✏️ Edit Payment
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/20 transition-all"
              >
                🗑️ Delete Payment
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-light text-white text-center mb-8 tracking-wide">
          Invoice Payment
        </h1>

        {view === "list" && renderListView()}
        {view === "form" && renderFormView()}
        {view === "detail" && renderDetailView()}
      </div>
    </div>
  );
}

export default InvoicePayments;
