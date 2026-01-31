import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Receipt,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { dashboardApi } from "../services/api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentActivities(10),
        ]);
        setStats(statsRes.data);
        setActivities(activitiesRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          title: "Purchase Orders",
          value: stats.transactions.purchaseOrders,
          icon: ShoppingCart,
          color: "bg-blue-500",
        },
        {
          title: "Vendor Bills",
          value: stats.transactions.vendorBills,
          icon: Receipt,
          color: "bg-orange-500",
        },
        {
          title: "Sales Orders",
          value: stats.transactions.salesOrders,
          icon: FileText,
          color: "bg-green-500",
        },
        {
          title: "Customer Invoices",
          value: stats.transactions.customerInvoices,
          icon: FileText,
          color: "bg-purple-500",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Summary */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown size={20} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Accounts Payable</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(stats.outstanding.payable)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Outstanding to vendors</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-700">
                Accounts Receivable
              </h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.outstanding.receivable)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Due from customers</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard size={20} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Budget This Month</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats.budget.remaining)}
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Used: {formatCurrency(stats.budget.actual)}</span>
                <span>Budget: {formatCurrency(stats.budget.budgeted)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.budget.budgeted > 0 ? Math.min((stats.budget.actual / stats.budget.budgeted) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">Recent Activities</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {activities.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activities
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={index}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${activity.type === "payment" ? "bg-green-100" : "bg-blue-100"}`}
                  >
                    {activity.type === "payment" ? (
                      <CreditCard size={18} className="text-green-600" />
                    ) : (
                      <FileText size={18} className="text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {activity.number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.contact || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">
                    {formatCurrency(activity.amount)}
                  </p>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                      activity.status === "CONFIRMED" ||
                      activity.status === "POSTED"
                        ? "bg-green-100 text-green-700"
                        : activity.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
