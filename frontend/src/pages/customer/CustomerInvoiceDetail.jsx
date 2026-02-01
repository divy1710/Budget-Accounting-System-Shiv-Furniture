import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Printer,
  CreditCard,
  Building2,
  LogOut,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Package,
} from "lucide-react";
import { transactionsApi } from "../../services/api";
import { generateInvoicePDF } from "../../services/pdfGenerator";

export default function CustomerInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [invoice, setInvoice] = useState(null);
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
    if (customer && id) {
      fetchInvoice();
    }
  }, [customer, id]);

  const fetchInvoice = async () => {
    try {
      const response = await transactionsApi.getById(id);
      setInvoice(response.data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-lg font-medium text-gray-500">Invoice not found</p>
          <Link
            to="/customer/invoices"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            ← Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const paidAmount =
    invoice.paymentAllocations?.reduce(
      (sum, alloc) => sum + (alloc.amount || 0),
      0,
    ) || 0;
  const balanceDue = (invoice.totalAmount || 0) - paidAmount;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Hidden in print */}
      <header className="bg-white shadow-sm print:hidden">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button & Actions - Hidden in print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            to="/customer/invoices"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Back to Invoices
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={() => generateInvoicePDF(invoice)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Download size={18} />
              Download PDF
            </button>
            {invoice.paymentStatus !== "PAID" && (
              <Link
                to={`/customer/payments?invoice=${invoice.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <CreditCard size={18} />
                Pay Now
              </Link>
            )}
          </div>
        </div>

        {/* Invoice Document */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:rounded-none">
          {/* Invoice Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg print:bg-blue-50">
                    <Building2 className="text-blue-600" size={32} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Shiv Furniture
                    </h1>
                    <p className="text-gray-500">Premium Quality Furniture</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>123 Furniture Market, Industrial Area</p>
                  <p>Mumbai, Maharashtra 400001</p>
                  <p>GSTIN: 27AABCS1234A1ZV</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  INVOICE
                </h2>
                <p className="text-xl font-semibold text-blue-600">
                  {invoice.transactionNumber}
                </p>
                <div className="mt-4 space-y-1 text-sm text-gray-600">
                  <p className="flex items-center justify-end gap-2">
                    <Calendar size={14} />
                    Date: {formatDate(invoice.transactionDate)}
                  </p>
                  {invoice.dueDate && <p>Due: {formatDate(invoice.dueDate)}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="p-8 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Bill To
                </h3>
                <p className="font-semibold text-gray-900">
                  {invoice.contact?.name}
                </p>
                <p className="text-gray-600 text-sm">{invoice.contact?.code}</p>
                {invoice.contact?.address && (
                  <p className="text-gray-600 text-sm mt-1">
                    {invoice.contact.address}
                  </p>
                )}
                {invoice.contact?.gstNumber && (
                  <p className="text-gray-600 text-sm">
                    GSTIN: {invoice.contact.gstNumber}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    invoice.paymentStatus === "PAID"
                      ? "bg-green-100 text-green-700"
                      : invoice.paymentStatus === "PARTIAL"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {invoice.paymentStatus === "PAID" ? (
                    <CheckCircle size={18} />
                  ) : (
                    <Clock size={18} />
                  )}
                  <span className="font-semibold">{invoice.paymentStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="p-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">
                    Item
                  </th>
                  <th className="text-center py-3 text-sm font-semibold text-gray-600">
                    Qty
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-600">
                    Unit Price
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-600">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines?.map((line, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Package className="text-gray-500" size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {line.product?.name || line.description}
                          </p>
                          {line.product?.code && (
                            <p className="text-xs text-gray-500">
                              {line.product.code}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center text-gray-600">
                      {line.quantity} {line.product?.unit || "pcs"}
                    </td>
                    <td className="py-4 text-right text-gray-600">
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td className="py-4 text-right font-medium text-gray-900">
                      {formatCurrency(line.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
                {paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Paid</span>
                      <span>-{formatCurrency(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-blue-600 border-t pt-2">
                      <span>Balance Due</span>
                      <span>{formatCurrency(balanceDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.paymentAllocations?.length > 0 && (
            <div className="p-8 bg-gray-50 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                Payment History
              </h3>
              <div className="space-y-2">
                {invoice.paymentAllocations.map((alloc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="text-green-600" size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {alloc.payment?.paymentNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(alloc.payment?.paymentDate)}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(alloc.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">
              For any queries, please contact us at accounts@shivfurniture.com
            </p>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
