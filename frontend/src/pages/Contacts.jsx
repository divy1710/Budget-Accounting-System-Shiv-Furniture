import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Building2, User } from "lucide-react";
import { contactsApi } from "../services/api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "CUSTOMER",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
  });

  useEffect(() => {
    fetchContacts();
  }, [typeFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = typeFilter ? { type: typeFilter } : {};
      const res = await contactsApi.getAll(params);
      setContacts(res.data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await contactsApi.update(editingContact.id, formData);
      } else {
        await contactsApi.create(formData);
      }
      setShowModal(false);
      setEditingContact(null);
      setFormData({
        name: "",
        type: "CUSTOMER",
        email: "",
        phone: "",
        address: "",
        gstNumber: "",
      });
      fetchContacts();
    } catch (error) {
      console.error("Failed to save contact:", error);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      type: contact.type,
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      gstNumber: contact.gstNumber || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await contactsApi.delete(id);
        fetchContacts();
      } catch (error) {
        console.error("Failed to delete contact:", error);
      }
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(filter.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Contacts</h1>
        <button
          onClick={() => {
            setEditingContact(null);
            setFormData({
              name: "",
              type: "CUSTOMER",
              email: "",
              phone: "",
              address: "",
              gstNumber: "",
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Add Contact
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
              placeholder="Search contacts..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="CUSTOMER">Customers</option>
            <option value="VENDOR">Vendors</option>
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST Number
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${contact.type === "CUSTOMER" ? "bg-green-100" : "bg-blue-100"}`}
                        >
                          {contact.type === "CUSTOMER" ? (
                            <User size={16} className="text-green-600" />
                          ) : (
                            <Building2 size={16} className="text-blue-600" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {contact.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${contact.type === "CUSTOMER" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {contact.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {contact.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {contact.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {contact.gstNumber || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredContacts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No contacts found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingContact ? "Edit Contact" : "Add Contact"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="VENDOR">Vendor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, gstNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
