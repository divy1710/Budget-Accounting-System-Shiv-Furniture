import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Printer } from 'lucide-react';
import { transactionsApi } from '../services/api';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTransaction(); }, [id]);

  const fetchTransaction = async () => {
    try {
      const res = await transactionsApi.getById(id);
      setTransaction(res.data);
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (window.confirm('Confirm this transaction? Budget will be updated accordingly.')) {
      try {
        await transactionsApi.confirm(id);
        fetchTransaction();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to confirm');
      }
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Cancel this transaction?')) {
      try {
        await transactionsApi.cancel(id);
        fetchTransaction();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to cancel');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  if (!transaction) {
    return <div className="text-center py-8 text-gray-500">Transaction not found</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-700';
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isVendorType = transaction.type === 'PURCHASE_ORDER' || transaction.type === 'VENDOR_BILL';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{transaction.transactionNumber}</h1>
            <p className="text-gray-500">{transaction.type.replace('_', ' ')}</p>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm rounded-full ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {transaction.status === 'DRAFT' && (
            <>
              <button onClick={handleConfirm} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Check size={18} /> Confirm
              </button>
              <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                <X size={18} /> Cancel
              </button>
            </>
          )}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Printer size={18} /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Line Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">GST</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Analytical</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transaction.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{line.product?.code}</td>
                      <td className="px-6 py-4 text-gray-700">{line.description || line.product?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{line.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{formatCurrency(line.unitPrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">{line.gstRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{line.analyticalAccount?.code || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">{formatCurrency(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(transaction.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax:</span>
                    <span>{formatCurrency(transaction.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(transaction.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-2">Notes</h2>
              <p className="text-gray-600">{transaction.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">{isVendorType ? 'Vendor' : 'Customer'}</dt>
                <dd className="font-medium text-gray-900">{isVendorType ? transaction.vendor?.name : transaction.customer?.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Date</dt>
                <dd className="font-medium text-gray-900">{new Date(transaction.transactionDate).toLocaleDateString()}</dd>
              </div>
              {transaction.dueDate && (
                <div>
                  <dt className="text-sm text-gray-500">Due Date</dt>
                  <dd className="font-medium text-gray-900">{new Date(transaction.dueDate).toLocaleDateString()}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Payment Status</dt>
                <dd className="font-medium text-gray-900">{transaction.paymentStatus?.replace('_', ' ')}</dd>
              </div>
              {transaction.paidAmount > 0 && (
                <div>
                  <dt className="text-sm text-gray-500">Paid Amount</dt>
                  <dd className="font-medium text-green-600">{formatCurrency(transaction.paidAmount)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Payment Allocations */}
          {transaction.paymentAllocations && transaction.paymentAllocations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Payments</h2>
              <div className="space-y-3">
                {transaction.paymentAllocations.map((alloc) => (
                  <div key={alloc.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{alloc.payment?.paymentNumber}</p>
                      <p className="text-sm text-gray-500">{new Date(alloc.payment?.paymentDate).toLocaleDateString()}</p>
                    </div>
                    <span className="font-medium text-green-600">{formatCurrency(alloc.allocatedAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
