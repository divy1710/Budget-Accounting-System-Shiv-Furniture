import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transactionsApi } from "../../services/api";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);

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
      fetchStats();
    }
  }, [customer]);

  const fetchStats = async () => {
    try {
      const response = await transactionsApi.getAll({
        type: "CUSTOMER_INVOICE",
        contactId: customer.id,
      });
      const data = response.data.filter((inv) => inv.status === "CONFIRMED");

      const paid = data.filter((inv) => inv.paymentStatus === "PAID");
      const pending = data.filter((inv) => inv.paymentStatus !== "PAID");

      setStats({
        total: data.length,
        paid: paid.length,
        pending: pending.length,
        totalAmount: data.reduce(
          (sum, inv) => sum + Number(inv.totalAmount || 0),
          0,
        ),
        pendingAmount: pending.reduce((sum, inv) => {
          const due =
            Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0);
          return sum + due;
        }, 0),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Shiv Furniture</h1>
              <p className="text-sm text-gray-400">Customer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-medium">{customer?.name}</p>
              <p className="text-sm text-gray-400">{customer?.code}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition"
              title="Logout"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Welcome */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-light text-white mb-2">
            Welcome, {customer?.name}
          </h2>
          <p className="text-gray-400">Manage your invoices and payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
            <div className="text-gray-400 text-sm mb-2">Total Invoices</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/30 to-gray-800 border border-green-700/50 rounded-xl p-6 shadow-xl">
            <div className="text-green-400 text-sm mb-2">Paid Invoices</div>
            <div className="text-3xl font-bold text-green-400">
              {stats.paid}
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-900/30 to-gray-800 border border-pink-700/50 rounded-xl p-6 shadow-xl">
            <div className="text-pink-400 text-sm mb-2">Pending Invoices</div>
            <div className="text-3xl font-bold text-pink-400">
              {stats.pending}
            </div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 mb-10 shadow-xl">
          <h3 className="text-white font-medium mb-4">Payment Summary</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-gray-400 text-sm mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalAmount)}
              </div>
            </div>
            <div>
              <div className="text-pink-400 text-sm mb-1">Amount Due</div>
              <div className="text-2xl font-bold text-pink-400">
                {formatCurrency(stats.pendingAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/customer/invoices")}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all"
          >
            📄 View My Invoices
          </button>
          <button
            onClick={() => navigate("/customer/payments")}
            className="px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-xl font-medium hover:from-gray-600 hover:to-gray-500 border border-gray-600 transition-all"
          >
            💳 Payment History
          </button>
        </div>
      </div>
    </div>
  );
}
