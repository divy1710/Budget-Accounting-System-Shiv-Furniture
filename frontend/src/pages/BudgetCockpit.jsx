import { useState, useEffect } from "react";
import { dashboardApi } from "../services/api";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function BudgetCockpit() {
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cockpitRes, trendRes] = await Promise.all([
          dashboardApi.getBudgetCockpit({ year, month }),
          dashboardApi.getYearlyTrend(year),
        ]);
        setData(cockpitRes.data);
        setTrend(trendRes.data);
      } catch (error) {
        console.error("Failed to fetch budget data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (percent) => {
    if (percent >= 100) return "text-red-600 bg-red-50";
    if (percent >= 80) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getBarColor = (percent) => {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Budget Cockpit</h1>
        <div className="flex items-center gap-4">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <span className="text-gray-500">Total Budgeted</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(data.totals.totalBudgeted)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp size={20} className="text-orange-600" />
              </div>
              <span className="text-gray-500">Total Actual</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(data.totals.totalActual)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-lg ${data.totals.totalRemaining >= 0 ? "bg-green-100" : "bg-red-100"}`}
              >
                {data.totals.totalRemaining >= 0 ? (
                  <TrendingDown size={20} className="text-green-600" />
                ) : (
                  <AlertTriangle size={20} className="text-red-600" />
                )}
              </div>
              <span className="text-gray-500">Remaining</span>
            </div>
            <p
              className={`text-2xl font-bold ${data.totals.totalRemaining >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(data.totals.totalRemaining)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-lg ${getStatusColor(data.totals.overallUtilization)}`}
              >
                <BarChart3 size={20} />
              </div>
              <span className="text-gray-500">Utilization</span>
            </div>
            <p
              className={`text-2xl font-bold ${data.totals.overallUtilization >= 100 ? "text-red-600" : data.totals.overallUtilization >= 80 ? "text-yellow-600" : "text-green-600"}`}
            >
              {data.totals.overallUtilization.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Account Breakdown */}
      {data && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">
              Budget by Analytical Account - {months[month - 1]} {year}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.summary
              .filter((s) => s.budgetedAmount > 0)
              .map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-900">
                        {item.code}
                      </span>
                      <span className="text-gray-500 ml-2">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(item.utilizationPercent)}`}
                      >
                        {item.utilizationPercent.toFixed(0)}% used
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getBarColor(item.utilizationPercent)}`}
                          style={{
                            width: `${Math.min(item.utilizationPercent, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 w-48 text-right">
                      {formatCurrency(item.actualAmount)} /{" "}
                      {formatCurrency(item.budgetedAmount)}
                    </div>
                  </div>
                </div>
              ))}
            {data.summary.filter((s) => s.budgetedAmount > 0).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No budget data for this period
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yearly Trend */}
      {trend && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">
              Yearly Trend - {year}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-2">
              {trend.months.map((m) => {
                const maxValue = Math.max(
                  ...trend.months.map((x) => Math.max(x.budgeted, x.actual)),
                );
                const budgetHeight =
                  maxValue > 0 ? (m.budgeted / maxValue) * 150 : 0;
                const actualHeight =
                  maxValue > 0 ? (m.actual / maxValue) * 150 : 0;

                return (
                  <div key={m.month} className="flex flex-col items-center">
                    <div className="flex gap-1 items-end h-40 mb-2">
                      <div
                        className="w-4 bg-blue-200 rounded-t"
                        style={{ height: `${budgetHeight}px` }}
                        title={`Budget: ${formatCurrency(m.budgeted)}`}
                      />
                      <div
                        className="w-4 bg-green-500 rounded-t"
                        style={{ height: `${actualHeight}px` }}
                        title={`Actual: ${formatCurrency(m.actual)}`}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {months[m.month - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 rounded"></div>
                <span className="text-sm text-gray-600">Budgeted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Actual</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
