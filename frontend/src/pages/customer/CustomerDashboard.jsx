import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FileText,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  Building2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { transactionsApi } from "../../services/api";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    const customerData = localStorage.getItem("customerPortal");
    if (!customerData) {
      navigate("/login");
      return;
    }
    setCustomer(JSON.parse(customerData));
  }, [navigate]);

  useEffect(() => {
    if (customer) {
      fetchInvoices();
    }
  }, [customer]);

  const fetchInvoices = async () => {
    try {
      const response = await transactionsApi.getAll({
        type: "CUSTOMER_INVOICE",
        contactId: customer.id,
      });
      const data = response.data;
      setInvoices(data);

      // Calculate stats
      const confirmed = data.filter((inv) => inv.status === "CONFIRMED");
      const paid = confirmed.filter((inv) => inv.paymentStatus === "PAID");
      const pending = confirmed.filter((inv) => inv.paymentStatus !== "PAID");

      setStats({
        total: data.length,
        pending: pending.length,
        paid: paid.length,
        overdue: pending.filter((inv) => new Date(inv.dueDate) < new Date())
          .length,
        totalAmount: confirmed.reduce(
          (sum, inv) => sum + (inv.totalAmount || 0),
          0,
        ),
        paidAmount: paid.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        pendingAmount: pending.reduce(
          (sum, inv) => sum + (inv.totalAmount || 0),
          0,
        ),
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("customerPortal");
    navigate("/login");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const recentInvoices = invoices
    .filter((inv) => inv.status === "CONFIRMED")
    .slice(0, 5);

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
                <h1 className="text-lg font-bold text-gray-900">
                  Shiv Furniture
                </h1>
                <p className="text-xs text-gray-500">Customer Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {customer?.name}
                </p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {customer?.name?.split(" ")[0]}!
          </h2>
          <p className="text-gray-600 mt-1">
            Here's an overview of your account with Shiv Furniture.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
                <p className="text-sm text-gray-500">Total Invoices</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
                <p className="text-sm text-gray-500">Pending Payment</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
                <p className="text-sm text-gray-500">Paid Invoices</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overdue}
                </p>
                <p className="text-sm text-gray-500">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} />
              <span className="text-blue-100">Total Billed</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(stats.totalAmount)}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle size={20} />
              <span className="text-green-100">Amount Paid</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(stats.paidAmount)}
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} />
              <span className="text-orange-100">Outstanding</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(stats.pendingAmount)}
            </p>
          </div>
        </div>

        {/* Quick Actions & Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to="/customer/invoices"
                className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
              >
                <FileText size={20} />
                <span className="font-medium">View All Invoices</span>
              </Link>
              <Link
                to="/customer/payments"
                className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
              >
                <CreditCard size={20} />
                <span className="font-medium">Make a Payment</span>
              </Link>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Invoices
              </h3>
              <Link
                to="/customer/invoices"
                className="text-sm text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto mb-2 text-gray-300" size={40} />
                <p>No invoices found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/customer/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="text-blue-600" size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {invoice.transactionNumber}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar size={12} />
                          {formatDate(invoice.transactionDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          invoice.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-700"
                            : invoice.paymentStatus === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {invoice.paymentStatus}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
