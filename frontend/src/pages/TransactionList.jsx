import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Check, X, Search } from 'lucide-react';
import { transactionsApi, contactsApi, productsApi, analyticalAccountsApi } from '../services/api';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export default function TransactionList({ type, title }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchTransactions(); }, [type, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = { type };
      if (statusFilter) params.status = statusFilter;
      const res = await transactionsApi.getAll(params);
      setTransactions(res.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    if (window.confirm('Confirm this transaction? Budget will be updated accordingly.')) {
      try {
        await transactionsApi.confirm(id);
        fetchTransactions();
      } catch (error) {
        console.error('Failed to confirm:', error);
        alert(error.response?.data?.error || 'Failed to confirm');
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this transaction?')) {
      try {
        await transactionsApi.cancel(id);
        fetchTransactions();
      } catch (error) {
        console.error('Failed to cancel:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-700';
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-700';
      case 'NOT_PAID': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredTransactions = transactions.filter(t =>
    t.transactionNumber.toLowerCase().includes(filter.toLowerCase()) ||
    t.vendor?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    t.customer?.name?.toLowerCase().includes(filter.toLowerCase())
  );

  const isVendorType = type === 'PURCHASE_ORDER' || type === 'VENDOR_BILL';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <button onClick={() => navigate(`/transactions/new?type=${type}`)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Create New
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search..." value={filter} onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{isVendorType ? 'Vendor' : 'Customer'}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{txn.transactionNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(txn.transactionDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{isVendorType ? txn.vendor?.name : txn.customer?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">{formatCurrency(txn.totalAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(txn.status)}`}>{txn.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(txn.paymentStatus)}`}>{txn.paymentStatus?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => navigate(`/transactions/${txn.id}`)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye size={16} />
                      </button>
                      {txn.status === 'DRAFT' && (
                        <>
                          <button onClick={() => handleConfirm(txn.id)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg">
                            <Check size={16} />
                          </button>
                          <button onClick={() => handleCancel(txn.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && <div className="text-center py-8 text-gray-500">No transactions found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
