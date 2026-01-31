import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentsApi, contactsApi } from "../services/api";

function BillPayments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, form, detail
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [formData, setFormData] = useState({
    paymentType: "SEND",
    contactId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "bank",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Check if we should open a specific payment from URL params
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
      paymentType: payment.paymentType || "SEND",
      contactId: payment.contactId || "",
      amount: Number(payment.amount) || "",
      paymentDate: new Date(payment.paymentDate).toISOString().split("T")[0],
      paymentMethod: payment.paymentMethod || "bank",
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
        contactId: parseInt(formData.contactId),
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFilteredContacts = () => {
    if (formData.paymentType === "SEND") {
      return contacts.filter((c) => c.type === "VENDOR");
    }
    return contacts.filter((c) => c.type === "CUSTOMER");
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
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Partner
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                  Method
                </th>
                <th className="px-4 py-3 text-right text-white font-bold border-r border-gray-600">
                  Amount
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
                  <td className="px-4 py-3 border-r border-gray-700">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 ${
                        payment.paymentType === "SEND"
                          ? "bg-red-600/20 text-red-400 border-red-500"
                          : "bg-green-600/20 text-green-400 border-green-500"
                      }`}
                    >
                      {payment.paymentType === "SEND" ? "↑ Send" : "↓ Receive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {payment.contact?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-white border-r border-gray-700">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-cyan-400 capitalize border-r border-gray-700">
                    {payment.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-bold border-r border-gray-700">
                    {formatCurrency(payment.amount)}
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
                    colSpan="7"
                    className="px-4 py-12 text-center text-gray-400 bg-gray-800"
                  >
                    No payments found. Click "+ New" to create one.
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
            : "💳 New Bill Payment"}
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
        {/* Payment Type */}
        <div className="p-6 border-b border-gray-700">
          <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide mb-4">
            Payment Type
          </label>
          <div className="flex gap-6">
            <label
              className={`flex items-center gap-3 cursor-pointer px-6 py-4 rounded-xl border-2 transition-all ${
                formData.paymentType === "SEND"
                  ? "bg-red-600/20 border-red-500 text-red-400"
                  : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
              }`}
            >
              <input
                type="radio"
                name="paymentType"
                value="SEND"
                checked={formData.paymentType === "SEND"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentType: e.target.value,
                    contactId: "",
                  })
                }
                className="w-5 h-5 text-red-600"
              />
              <span className="font-medium text-lg">↑ Send Money</span>
            </label>
            <label
              className={`flex items-center gap-3 cursor-pointer px-6 py-4 rounded-xl border-2 transition-all ${
                formData.paymentType === "RECEIVE"
                  ? "bg-green-600/20 border-green-500 text-green-400"
                  : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
              }`}
            >
              <input
                type="radio"
                name="paymentType"
                value="RECEIVE"
                checked={formData.paymentType === "RECEIVE"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentType: e.target.value,
                    contactId: "",
                  })
                }
                className="w-5 h-5 text-green-600"
              />
              <span className="font-medium text-lg">↓ Receive Money</span>
            </label>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Partner */}
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
                Partner
              </label>
              <select
                value={formData.contactId}
                onChange={(e) =>
                  setFormData({ ...formData, contactId: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              >
                <option value="">
                  Select{" "}
                  {formData.paymentType === "SEND" ? "Vendor" : "Customer"}
                </option>
                {getFilteredContacts().map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                auto fill partner name from Invoice/Bill
              </span>
            </div>

            {/* Date */}
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
              <span className="text-xs text-gray-500">
                (Default Today Date)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Amount */}
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
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-800 text-cyan-400 text-xl font-bold rounded-lg border-2 border-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                min="0"
                step="0.01"
                required
              />
              <span className="text-xs text-gray-500">
                (auto fill amount due from Invoice/Bill)
              </span>
            </div>

            {/* Payment Via */}
            <div className="space-y-2">
              <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
                Payment Via
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              >
                <option value="bank">🏦 Bank</option>
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI</option>
                <option value="card">💳 Card</option>
              </select>
              <span className="text-xs text-gray-500">
                (Default Bank can be selectable to Cash)
              </span>
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <label className="block text-gray-400 text-sm font-medium uppercase tracking-wide">
              Reference
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              placeholder="Bank ref, UPI ID, etc."
              className="w-full px-4 py-3 bg-gray-800 text-cyan-400 rounded-lg border-2 border-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Note */}
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
        </div>

        {/* Actions */}
        <div className="flex gap-4 p-6 border-t border-gray-700">
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
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm uppercase tracking-wide">
                Payment No.
              </span>
              <span className="text-2xl font-bold text-white bg-gray-800 px-4 py-1 rounded-lg border border-gray-600">
                {selectedPayment.paymentNumber}
              </span>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 border-b border-gray-700">
            {selectedPayment.status === "DRAFT" && (
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

            {/* Status Indicators */}
            <div className="flex gap-2 ml-auto">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedPayment.status === "DRAFT"
                    ? "bg-yellow-600/20 text-yellow-400 border-yellow-500 shadow-lg shadow-yellow-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                ● Draft
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedPayment.status === "CONFIRMED"
                    ? "bg-green-600/20 text-green-400 border-green-500 shadow-lg shadow-green-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                ● Confirmed
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedPayment.status === "CANCELLED"
                    ? "bg-red-600/20 text-red-400 border-red-500 shadow-lg shadow-red-500/10"
                    : "bg-gray-800 text-gray-500 border-gray-700"
                }`}
              >
                ● Cancelled
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <label className="text-gray-400 text-sm uppercase tracking-wide">
                    Payment Type
                  </label>
                  <div className="flex gap-6 mt-3">
                    <span
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
                        selectedPayment.paymentType === "SEND"
                          ? "bg-red-600/20 text-red-400 border-red-500"
                          : "bg-gray-800 text-gray-500 border-gray-700"
                      }`}
                    >
                      ↑ Send
                    </span>
                    <span
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
                        selectedPayment.paymentType === "RECEIVE"
                          ? "bg-green-600/20 text-green-400 border-green-500"
                          : "bg-gray-800 text-gray-500 border-gray-700"
                      }`}
                    >
                      ↓ Receive
                    </span>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <label className="text-gray-400 text-sm uppercase tracking-wide">
                    Partner
                  </label>
                  <p className="text-white text-xl font-medium mt-2">
                    {selectedPayment.contact?.name || "-"}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-5 rounded-xl border-2 border-cyan-500">
                  <label className="text-gray-400 text-sm uppercase tracking-wide">
                    Amount
                  </label>
                  <p className="text-3xl font-bold text-cyan-400 mt-2">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <label className="text-gray-400 text-sm uppercase tracking-wide">
                    Date
                  </label>
                  <p className="text-white text-lg font-medium mt-2">
                    {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <label className="text-gray-400 text-sm uppercase tracking-wide">
                    Payment Via
                  </label>
                  <p className="text-white text-lg font-medium mt-2 capitalize">
                    {selectedPayment.paymentMethod}
                  </p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <label className="text-gray-400 text-sm uppercase tracking-wide">
                    Reference
                  </label>
                  <p className="text-cyan-400 text-lg font-medium mt-2">
                    {selectedPayment.reference || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {selectedPayment.notes && (
            <div className="mx-6 mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <label className="text-gray-400 text-sm uppercase tracking-wide">
                Note
              </label>
              <p className="text-white mt-2">{selectedPayment.notes}</p>
            </div>
          )}

          {/* Allocated Transactions */}
          {selectedPayment.allocations?.length > 0 && (
            <div className="mx-6 mb-6">
              <label className="text-gray-400 text-sm uppercase tracking-wide block mb-3">
                Applied to
              </label>
              <div className="border-2 border-gray-600 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-700 to-gray-600">
                      <th className="px-4 py-3 text-left text-white font-bold border-r border-gray-600">
                        Transaction
                      </th>
                      <th className="px-4 py-3 text-right text-white font-bold">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPayment.allocations.map((alloc, index) => (
                      <tr
                        key={alloc.id}
                        className={`border-t-2 border-gray-600 ${
                          index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                        }`}
                      >
                        <td className="px-4 py-3 border-r border-gray-700">
                          <button
                            onClick={() => {
                              const type = alloc.transaction?.type;
                              if (type === "VENDOR_BILL") {
                                navigate(
                                  `/vendor-bills?id=${alloc.transactionId}`,
                                );
                              } else if (type === "CUSTOMER_INVOICE") {
                                navigate(
                                  `/customer-invoices?id=${alloc.transactionId}`,
                                );
                              }
                            }}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            {alloc.transaction?.transactionNumber ||
                              alloc.transactionId}{" "}
                            →
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right text-yellow-400 font-bold">
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
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-light text-white text-center mb-8 tracking-wide">
          Bill Payment
        </h1>

        {view === "list" && renderListView()}
        {view === "form" && renderFormView()}
        {view === "detail" && renderDetailView()}
      </div>
    </div>
  );
}

export default BillPayments;
