import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { paymentsApi, contactsApi } from '../services/api';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
};

export default function PaymentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contactType = searchParams.get('contactType') || 'VENDOR';

  const [contacts, setContacts] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState({});

  const [formData, setFormData] = useState({
    contactId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = contactType === 'VENDOR' ? await contactsApi.getVendors() : await contactsApi.getCustomers();
        setContacts(res.data);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, [contactType]);

  useEffect(() => {
    const fetchOutstanding = async () => {
      if (formData.contactId) {
        try {
          const res = await paymentsApi.getOutstanding(formData.contactId);
          setOutstanding(res.data);
          setSelectedAllocations({});
        } catch (error) {
          console.error('Failed to fetch outstanding:', error);
        }
      } else {
        setOutstanding([]);
        setSelectedAllocations({});
      }
    };
    fetchOutstanding();
  }, [formData.contactId]);

  const handleAllocationChange = (txnId, amount) => {
    setSelectedAllocations(prev => ({
      ...prev,
      [txnId]: amount
    }));
  };

  const getAllocationsTotal = () => {
    return Object.values(selectedAllocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const getOutstandingAmount = (txn) => {
    const total = parseFloat(txn.totalAmount) || 0;
    const paid = parseFloat(txn.paidAmount) || 0;
    return total - paid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const allocations = Object.entries(selectedAllocations)
        .filter(([_, amount]) => parseFloat(amount) > 0)
        .map(([txnId, amount]) => ({
          transactionId: parseInt(txnId),
          allocatedAmount: parseFloat(amount)
        }));

      await paymentsApi.create({
        ...formData,
        allocations
      });
      navigate(-1);
    } catch (error) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.error || 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  const allocationsTotal = getAllocationsTotal();
  const paymentAmount = parseFloat(formData.amount) || 0;
  const unallocated = paymentAmount - allocationsTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Record {contactType === 'VENDOR' ? 'Vendor' : 'Customer'} Payment
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {contactType === 'VENDOR' ? 'Vendor' : 'Customer'} *
              </label>
              <select required value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select {contactType === 'VENDOR' ? 'Vendor' : 'Customer'}</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
              <input type="date" required value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input type="number" required min="0.01" step="0.01" value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input type="text" value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Transaction ID, Cheque No, etc." />
            </div>
          </div>
        </div>

        {formData.contactId && outstanding.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Allocate to Outstanding {contactType === 'VENDOR' ? 'Bills' : 'Invoices'}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-40">Allocate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {outstanding.map((txn) => {
                    const outstandingAmt = getOutstandingAmount(txn);
                    return (
                      <tr key={txn.id}>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{txn.transactionNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{new Date(txn.transactionDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">{formatCurrency(txn.totalAmount)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-red-600">{formatCurrency(outstandingAmt)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input type="number" min="0" max={outstandingAmt} step="0.01"
                            value={selectedAllocations[txn.id] || ''}
                            onChange={(e) => handleAllocationChange(txn.id, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Payment Amount:</span>
                  <span>{formatCurrency(paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Allocated:</span>
                  <span>{formatCurrency(allocationsTotal)}</span>
                </div>
                <div className={`flex justify-between font-bold border-t pt-2 ${unallocated < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  <span>Unallocated:</span>
                  <span>{formatCurrency(unallocated)}</span>
                </div>
              </div>
            </div>
            {unallocated < 0 && (
              <p className="text-red-600 text-sm mt-2 text-right">Allocations cannot exceed payment amount</p>
            )}
          </div>
        )}

        {formData.contactId && outstanding.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
            No outstanding {contactType === 'VENDOR' ? 'bills' : 'invoices'} for this {contactType === 'VENDOR' ? 'vendor' : 'customer'}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes..." />
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving || unallocated < 0} 
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Check size={18} />
            {saving ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
