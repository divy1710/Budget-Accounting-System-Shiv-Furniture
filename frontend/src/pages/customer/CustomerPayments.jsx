import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  LogOut,
  CreditCard,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { transactionsApi, paymentsApi } from "../../services/api";

export default function CustomerPayments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedInvoice = searchParams.get("invoice");
  
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");

  useEffect(() => {
    const customerData = localStorage.getItem("customerPortal");
    if (!customerData) {
      navigate("/customer/login");
      return;
    }
    setCustomer(JSON.parse(customerData));
  }, [navigate]);

  useEffect(() => {
    if (customer) {
      fetchOutstandingInvoices();
    }
  }, [customer]);

  const fetchOutstandingInvoices = async () => {
    try {
      const response = await transactionsApi.getAll({
        type: "CUSTOMER_INVOICE",
        contactId: customer.id,
      });
      const outstanding = response.data.filter(
        (inv) => inv.status === "CONFIRMED" && inv.paymentStatus !== "PAID"
      );
      setInvoices(outstanding);
      
      // Pre-select invoice if passed in URL
      if (preselectedInvoice) {
        const invoice = outstanding.find((inv) => inv.id === preselectedInvoice);
        if (invoice) {
          const paidAmount = invoice.paymentAllocations?.reduce(
            (sum, alloc) => sum + (alloc.amount || 0), 0
          ) || 0;
          setSelectedInvoices([{
            id: invoice.id,
            number: invoice.transactionNumber,
            total: invoice.totalAmount,
            balance: invoice.totalAmount - paidAmount,
            amount: invoice.totalAmount - paidAmount,
          }]);
        }
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("customerPortal");
    navigate("/customer/login");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getBalance = (invoice) => {
    const paidAmount = invoice.paymentAllocations?.reduce(
      (sum, alloc) => sum + (alloc.amount || 0), 0
    ) || 0;
    return invoice.totalAmount - paidAmount;
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const toggleInvoice = (invoice) => {
    const existing = selectedInvoices.find((s) => s.id === invoice.id);
    if (existing) {
      setSelectedInvoices(selectedInvoices.filter((s) => s.id !== invoice.id));
    } else {
      const balance = getBalance(invoice);
      setSelectedInvoices([
        ...selectedInvoices,
        {
          id: invoice.id,
          number: invoice.transactionNumber,
          total: invoice.totalAmount,
          balance: balance,
          amount: balance,
        },
      ]);
    }
  };

  const updateAmount = (invoiceId, amount) => {
    setSelectedInvoices(
      selectedInvoices.map((s) =>
        s.id === invoiceId
          ? { ...s, amount: Math.min(parseFloat(amount) || 0, s.balance) }
          : s
      )
    );
  };

  const totalPayment = selectedInvoices.reduce((sum, s) => sum + s.amount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedInvoices.length === 0 || totalPayment <= 0) {
      alert("Please select at least one invoice and enter payment amount");
      return;
    }

    setSubmitting(true);
    try {
      // Create payment via API
      await paymentsApi.create({
        contactId: customer.id,
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentMethod,
        reference: reference,
        totalAmount: totalPayment,
        allocations: selectedInvoices.map((s) => ({
          transactionId: s.id,
          amount: s.amount,
        })),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/customer/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Error creating payment:", error);
      alert(error.response?.data?.error || "Error processing payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your payment of {formatCurrency(totalPayment)} has been recorded successfully.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Shiv Furniture</h1>
                <p className="text-xs text-gray-500">Customer Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{customer?.name}</p>
                <p className="text-xs text-gray-500">{customer?.code}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button & Title */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/customer/dashboard"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Make a Payment</h2>
            <p className="text-gray-600">Select invoices and enter payment details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Outstanding Invoices */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Outstanding Invoices</h3>
              <p className="text-sm text-gray-500">Select invoices to pay</p>
            </div>

            {invoices.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="mx-auto mb-3 text-green-400" size={48} />
                <p className="text-lg font-medium text-gray-600">No outstanding invoices!</p>
                <p className="text-sm text-gray-500">All your invoices are paid.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invoices.map((invoice) => {
                  const balance = getBalance(invoice);
                  const isSelected = selectedInvoices.some((s) => s.id === invoice.id);
                  const overdue = isOverdue(invoice.dueDate);

                  return (
                    <div
                      key={invoice.id}
                      className={`p-4 transition cursor-pointer ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleInvoice(invoice)}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {invoice.transactionNumber}
                            </span>
                            {overdue && (
                              <span className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle size={12} />
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(invoice.transactionDate)}
                            </span>
                            <span>Due: {formatDate(invoice.dueDate)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(balance)}
                          </p>
                          <p className="text-xs text-gray-500">
                            of {formatCurrency(invoice.totalAmount)}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-3 ml-9" onClick={(e) => e.stopPropagation()}>
                          <label className="text-sm text-gray-600">Payment Amount</label>
                          <div className="relative mt-1">
                            <IndianRupee
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                              size={16}
                            />
                            <input
                              type="number"
                              min="0"
                              max={balance}
                              step="0.01"
                              value={selectedInvoices.find((s) => s.id === invoice.id)?.amount || 0}
                              onChange={(e) => updateAmount(invoice.id, e.target.value)}
                              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Details */}
          {selectedInvoices.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Enter reference number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary & Submit */}
          {selectedInvoices.length > 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-100">Total Payment Amount</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalPayment)}</p>
                </div>
                <div className="text-right text-blue-100">
                  <p>{selectedInvoices.length} invoice(s) selected</p>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || totalPayment <= 0}
                className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
