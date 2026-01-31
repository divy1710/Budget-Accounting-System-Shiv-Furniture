import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import {
  transactionsApi,
  contactsApi,
  productsApi,
  analyticalAccountsApi,
} from "../services/api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const typeConfig = {
  PURCHASE_ORDER: {
    title: "Purchase Order",
    contactType: "VENDOR",
    contactLabel: "Vendor",
  },
  VENDOR_BILL: {
    title: "Vendor Bill",
    contactType: "VENDOR",
    contactLabel: "Vendor",
  },
  SALES_ORDER: {
    title: "Sales Order",
    contactType: "CUSTOMER",
    contactLabel: "Customer",
  },
  CUSTOMER_INVOICE: {
    title: "Customer Invoice",
    contactType: "CUSTOMER",
    contactLabel: "Customer",
  },
};

export default function TransactionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "PURCHASE_ORDER";
  const config = typeConfig[type] || typeConfig.PURCHASE_ORDER;

  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    type,
    vendorId: "",
    customerId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    lines: [
      {
        productId: "",
        description: "",
        quantity: 1,
        unitPrice: "",
        gstRate: 18,
        analyticalAccountId: "",
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsRes, productsRes, accountsRes] = await Promise.all([
          config.contactType === "VENDOR"
            ? contactsApi.getVendors()
            : contactsApi.getCustomers(),
          productsApi.getAll(),
          analyticalAccountsApi.getAll(),
        ]);
        setContacts(contactsRes.data);
        setProducts(productsRes.data);
        setAccounts(accountsRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [config.contactType]);

  const handleProductChange = (index, productId) => {
    const product = products.find((p) => p.id === parseInt(productId));
    const newLines = [...formData.lines];
    newLines[index] = {
      ...newLines[index],
      productId,
      description: product?.name || "",
      unitPrice:
        config.contactType === "VENDOR"
          ? product?.purchasePrice || ""
          : product?.salePrice || "",
      gstRate: product?.gstRate || 18,
    };
    setFormData({ ...formData, lines: newLines });
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        {
          productId: "",
          description: "",
          quantity: 1,
          unitPrice: "",
          gstRate: 18,
          analyticalAccountId: "",
        },
      ],
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length > 1) {
      const newLines = formData.lines.filter((_, i) => i !== index);
      setFormData({ ...formData, lines: newLines });
    }
  };

  const calculateLineTotal = (line) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    const gst = parseFloat(line.gstRate) || 0;
    return qty * price * (1 + gst / 100);
  };

  const calculateTotals = () => {
    const subtotal = formData.lines.reduce(
      (sum, line) =>
        sum +
        (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0),
      0,
    );
    const taxAmount = formData.lines.reduce(
      (sum, line) =>
        sum +
        ((parseFloat(line.quantity) || 0) *
          (parseFloat(line.unitPrice) || 0) *
          (parseFloat(line.gstRate) || 0)) /
          100,
      0,
    );
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await transactionsApi.create(formData);
      navigate(-1);
    } catch (error) {
      console.error("Failed to save:", error);
      alert(error.response?.data?.error || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">New {config.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Transaction Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {config.contactLabel} *
              </label>
              <select
                required
                value={
                  config.contactType === "VENDOR"
                    ? formData.vendorId
                    : formData.customerId
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [config.contactType === "VENDOR"
                      ? "vendorId"
                      : "customerId"]: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select {config.contactLabel}</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.transactionDate}
                onChange={(e) =>
                  setFormData({ ...formData, transactionDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Line Items</h2>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus size={18} /> Add Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                    Unit Price
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">
                    GST %
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Analytical A/c
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                    Total
                  </th>
                  <th className="px-4 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formData.lines.map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <select
                        required
                        value={line.productId}
                        onChange={(e) =>
                          handleProductChange(index, e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) =>
                          handleLineChange(index, "description", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) =>
                          handleLineChange(index, "quantity", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) =>
                          handleLineChange(index, "unitPrice", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.gstRate}
                        onChange={(e) =>
                          handleLineChange(index, "gstRate", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={line.analyticalAccountId}
                        onChange={(e) =>
                          handleLineChange(
                            index,
                            "analyticalAccountId",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Auto</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(calculateLineTotal(line))}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        disabled={formData.lines.length === 1}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax:</span>
                <span>{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
