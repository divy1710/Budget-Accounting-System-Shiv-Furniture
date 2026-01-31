import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderTree, ChevronRight, ChevronDown } from 'lucide-react';
import { analyticalAccountsApi } from '../services/api';

export default function AnalyticalAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', description: '', parentId: '' });

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await analyticalAccountsApi.getAll();
      setAccounts(res.data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, parentId: formData.parentId ? parseInt(formData.parentId) : null };
      if (editingAccount) {
        await analyticalAccountsApi.update(editingAccount.id, data);
      } else {
        await analyticalAccountsApi.create(data);
      }
      setShowModal(false);
      setEditingAccount(null);
      setFormData({ code: '', name: '', description: '', parentId: '' });
      fetchAccounts();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({ code: account.code, name: account.name, description: account.description || '', parentId: account.parentId?.toString() || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await analyticalAccountsApi.delete(id);
        fetchAccounts();
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const rootAccounts = accounts.filter(a => !a.parentId);
  const getChildren = (parentId) => accounts.filter(a => a.parentId === parentId);

  const renderAccount = (account, level = 0) => {
    const children = getChildren(account.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded[account.id];

    return (
      <div key={account.id}>
        <div className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 border-b border-gray-100`}
          style={{ paddingLeft: `${(level * 24) + 16}px` }}>
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button onClick={() => toggleExpand(account.id)} className="p-1 hover:bg-gray-200 rounded">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div className="p-2 bg-indigo-100 rounded-lg"><FolderTree size={16} className="text-indigo-600" /></div>
            <div>
              <span className="font-medium text-gray-900">{account.code}</span>
              <span className="text-gray-500 ml-2">{account.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleEdit(account)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
            <button onClick={() => handleDelete(account.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
          </div>
        </div>
        {isExpanded && children.map(child => renderAccount(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Analytical Accounts</h1>
        <button onClick={() => { setEditingAccount(null); setFormData({ code: '', name: '', description: '', parentId: '' }); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Add Account
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : (
          <div className="overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Hierarchy</span>
            </div>
            {rootAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No accounts found</div>
            ) : (
              rootAccounts.map(account => renderAccount(account))
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{editingAccount ? 'Edit Account' : 'Add Account'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Account</label>
                <select value={formData.parentId} onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">None (Root Level)</option>
                  {accounts.filter(a => a.id !== editingAccount?.id).map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
