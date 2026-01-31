import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Building2,
  LogOut,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { transactionsApi } from "../../services/api";

export default function CustomerInvoices() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
      fetchInvoices();
    }
  }, [customer]);

  const fetchInvoices = async () => {
    try {
      const response = await transactionsApi.getAll({
        type: "CUSTOMER_INVOICE",
        contactId: customer.id,
      });
      setInvoices(response.data.filter((inv) => inv.status === "CONFIRMED"));
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

  const isOverdue = (dueDate, status) => {
    return status !== "PAID" && new Date(dueDate) < new Date();
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.transactionNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.reference?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && invoice.paymentStatus === "PAID") ||
      (statusFilter === "pending" && invoice.paymentStatus !== "PAID") ||
      (statusFilter === "overdue" &&
        isOverdue(invoice.dueDate, invoice.paymentStatus));

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        {/* Back Button & Title */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/customer/dashboard"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Invoices</h2>
            <p className="text-gray-600">View and manage your invoices</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="text-lg font-medium text-gray-500">
                No invoices found
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Your invoices will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 md:p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          invoice.paymentStatus === "PAID"
                            ? "bg-green-100"
                            : isOverdue(invoice.dueDate, invoice.paymentStatus)
                              ? "bg-red-100"
                              : "bg-yellow-100"
                        }`}
                      >
                        {invoice.paymentStatus === "PAID" ? (
                          <CheckCircle className="text-green-600" size={24} />
                        ) : isOverdue(
                            invoice.dueDate,
                            invoice.paymentStatus,
                          ) ? (
                          <AlertCircle className="text-red-600" size={24} />
                        ) : (
                          <Clock className="text-yellow-600" size={24} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {invoice.transactionNumber}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(invoice.transactionDate)}
                          </span>
                          {invoice.dueDate && (
                            <span
                              className={`flex items-center gap-1 ${
                                isOverdue(
                                  invoice.dueDate,
                                  invoice.paymentStatus,
                                )
                                  ? "text-red-600"
                                  : ""
                              }`}
                            >
                              Due: {formatDate(invoice.dueDate)}
                            </span>
                          )}
                        </div>
                        {invoice.reference && (
                          <p className="text-sm text-gray-400 mt-1">
                            Ref: {invoice.reference}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            invoice.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-700"
                              : invoice.paymentStatus === "PARTIAL"
                                ? "bg-yellow-100 text-yellow-700"
                                : isOverdue(
                                      invoice.dueDate,
                                      invoice.paymentStatus,
                                    )
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {isOverdue(invoice.dueDate, invoice.paymentStatus) &&
                          invoice.paymentStatus !== "PAID"
                            ? "OVERDUE"
                            : invoice.paymentStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/customer/invoices/${invoice.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </Link>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Download PDF"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
