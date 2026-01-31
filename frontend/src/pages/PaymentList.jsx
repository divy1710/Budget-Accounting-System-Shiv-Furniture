import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Ban, Search, CreditCard } from "lucide-react";
import { paymentsApi, contactsApi } from "../services/api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function PaymentList({ contactType, title }) {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchPayments();
  }, [contactType, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await paymentsApi.getAll(params);
      // Filter by contact type
      const filteredPayments = res.data.filter(
        (p) => p.contact?.type === contactType,
      );
      setPayments(filteredPayments);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async (id) => {
    if (
      window.confirm("Void this payment? This will reverse all allocations.")
    ) {
      try {
        await paymentsApi.void(id);
        fetchPayments();
      } catch (error) {
        console.error("Failed to void:", error);
        alert(error.response?.data?.error || "Failed to void payment");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "POSTED":
        return "bg-green-100 text-green-700";
      case "VOIDED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.paymentNumber.toLowerCase().includes(filter.toLowerCase()) ||
      p.contact?.name?.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <button
          onClick={() => navigate(`/payments/new?contactType=${contactType}`)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Record Payment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="POSTED">Posted</option>
            <option value="VOIDED">Voided</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {contactType === "VENDOR" ? "Vendor" : "Customer"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CreditCard size={16} className="text-green-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {payment.paymentNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {payment.contact?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {payment.paymentMethod?.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => navigate(`/payments/${payment.id}`)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye size={16} />
                      </button>
                      {payment.status === "POSTED" && (
                        <button
                          onClick={() => handleVoid(payment.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No payments found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
