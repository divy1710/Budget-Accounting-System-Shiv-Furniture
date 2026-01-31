import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transactionsApi, paymentsApi } from "../../services/api";

export default function CustomerInvoices() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);

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
      // Only show confirmed invoices
      setInvoices(response.data.filter((inv) => inv.status === "CONFIRMED"));
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
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateAmountDue = (invoice) => {
    const total = Number(invoice.totalAmount || 0);
    const paid = Number(invoice.paidAmount || 0);
    return total - paid;
  };

  // Razorpay Payment Handler
  const handlePayNow = async (invoice) => {
    const amountDue = calculateAmountDue(invoice);

    if (amountDue <= 0) {
      alert("This invoice is already paid.");
      return;
    }

    setPayingInvoiceId(invoice.id);

    // Check if Razorpay script is loaded
    if (!window.Razorpay) {
      // Load Razorpay script dynamically
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => initiateRazorpayPayment(invoice, amountDue);
      script.onerror = () => {
        alert("Failed to load payment gateway. Please try again.");
        setPayingInvoiceId(null);
      };
      document.body.appendChild(script);
    } else {
      initiateRazorpayPayment(invoice, amountDue);
    }
  };

  const initiateRazorpayPayment = (invoice, amountDue) => {
    const options = {
      key: "rzp_test_1234567890", // Replace with your Razorpay Key ID
      amount: Math.round(amountDue * 100), // Amount in paise
      currency: "INR",
      name: "Shiv Furniture",
      description: `Payment for Invoice ${invoice.transactionNumber}`,
      image: "/logo.png", // Your logo URL
      order_id: "", // This would come from backend in production
      handler: async function (response) {
        // Payment successful
        console.log("Payment successful:", response);

        try {
          // Create payment record in the system
          const paymentData = {
            paymentType: "RECEIVE",
            partnerId: customer.id,
            amount: amountDue,
            paymentDate: new Date().toISOString().split("T")[0],
            reference: response.razorpay_payment_id || "RAZORPAY",
            notes: `Online payment for invoice ${invoice.transactionNumber}`,
            transactionId: invoice.id,
          };

          // Create and confirm payment
          const paymentRes = await paymentsApi.create(paymentData);
          await paymentsApi.confirm(paymentRes.data.id);

          // Refresh invoices
          await fetchInvoices();

          alert("Payment successful! Thank you for your payment.");
        } catch (error) {
          console.error("Error recording payment:", error);
          alert(
            "Payment received but there was an error recording it. Please contact support.",
          );
        }

        setPayingInvoiceId(null);
      },
      prefill: {
        name: customer?.name || "",
        email: customer?.email || "",
        contact: customer?.phone || "",
      },
      notes: {
        invoice_number: invoice.transactionNumber,
        customer_id: customer?.id,
      },
      theme: {
        color: "#3B82F6",
      },
      modal: {
        ondismiss: function () {
          setPayingInvoiceId(null);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        alert(`Payment failed: ${response.error.description}`);
        setPayingInvoiceId(null);
      });
      rzp.open();
    } catch (error) {
      console.error("Error opening Razorpay:", error);
      alert("Error initiating payment. Please try again.");
      setPayingInvoiceId(null);
    }
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
      <div className="max-w-6xl mx-auto">
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

        {/* Title */}
        <h2 className="text-3xl font-light text-white text-center mb-8">
          Customer Invoice Portal View
        </h2>

        {/* Notice */}
        <div className="text-center mb-6">
          <span className="text-pink-400 text-sm">
            Contact can only view own Invoice
          </span>
        </div>

        {/* Invoice Table */}
        <div className="border-2 border-gray-600 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                <th className="px-4 py-3 text-left text-pink-400 font-medium border-r border-gray-600">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-pink-400 font-medium border-r border-gray-600">
                  Invoice Date
                </th>
                <th className="px-4 py-3 text-left text-pink-400 font-medium border-r border-gray-600">
                  Due Date
                </th>
                <th className="px-4 py-3 text-right text-pink-400 font-medium border-r border-gray-600">
                  Amount Due
                </th>
                <th className="px-4 py-3 text-right text-pink-400 font-medium border-r border-gray-600">
                  Amount Due
                </th>
                <th className="px-4 py-3 text-center text-pink-400 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-12 text-center text-gray-400 bg-gray-900"
                  >
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice, index) => {
                  const amountDue = calculateAmountDue(invoice);
                  const isPaid =
                    invoice.paymentStatus === "PAID" || amountDue <= 0;
                  const isPayingThis = payingInvoiceId === invoice.id;

                  return (
                    <tr
                      key={invoice.id}
                      className={`border-t border-gray-700 transition-colors ${
                        index % 2 === 0 ? "bg-gray-900" : "bg-gray-900/50"
                      } hover:bg-gray-800/50`}
                    >
                      <td className="px-4 py-3 text-pink-400 font-medium border-r border-gray-700">
                        {invoice.transactionNumber}
                      </td>
                      <td className="px-4 py-3 text-pink-400 border-r border-gray-700">
                        {formatDate(invoice.transactionDate)}
                      </td>
                      <td className="px-4 py-3 text-pink-400 border-r border-gray-700">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-right text-white border-r border-gray-700">
                        {formatCurrency(amountDue)} Rs
                      </td>
                      <td className="px-4 py-3 text-right text-white border-r border-gray-700">
                        {formatCurrency(amountDue)} Rs
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPaid ? (
                          <span className="text-green-400 font-medium">
                            Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePayNow(invoice)}
                            disabled={isPayingThis}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              isPayingThis
                                ? "bg-gray-600 text-gray-400 cursor-wait"
                                : "bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 shadow-lg shadow-pink-500/20"
                            }`}
                          >
                            {isPayingThis ? "Processing..." : "Pay Now"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Payment Flow Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Clicking on Pay Now, it will open payment provider (Razorpay)</p>
          <p className="mt-2">
            On Successful Status - Change the status of invoice from{" "}
            <span className="text-pink-400">Pay Now</span> → →{" "}
            <span className="text-green-400">Paid</span>
          </p>
        </div>

        {/* Payment Methods Info */}
        <div className="mt-6 flex justify-center">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 inline-block">
            <p className="text-gray-400 text-sm mb-2">Cards, UPI & More</p>
            <div className="flex flex-wrap gap-4 text-gray-500 text-xs">
              <span>💳 UPI / QR</span>
              <span>💳 Cards</span>
              <span>🏦 Net banking</span>
              <span>📱 EMI</span>
              <span>⏰ Pay Later</span>
              <span>👛 Wallet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
