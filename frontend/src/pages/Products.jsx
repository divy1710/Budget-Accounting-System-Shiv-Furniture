import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  ArrowLeft,
  Edit,
  Archive,
  Package,
  Plus,
  Search,
  RotateCcw,
} from "lucide-react";
import { productsApi, categoriesApi } from "../services/api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function Products() {
  const navigate = useNavigate();
  const [view, setView] = useState("list"); // list, form
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    salesPrice: "",
    purchasePrice: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [showArchived]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsApi.getAll();
      const filtered = showArchived
        ? res.data.filter((p) => !p.isActive)
        : res.data.filter((p) => p.isActive);
      setProducts(filtered);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleNew = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      categoryId: "",
      salesPrice: "",
      purchasePrice: "",
    });
    setView("form");
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId?.toString() || "",
      salesPrice: product.salesPrice?.toString() || "",
      purchasePrice: product.purchasePrice?.toString() || "",
    });
    setView("form");
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a product name");
      return;
    }

    try {
      const data = {
        name: formData.name,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        salesPrice: parseFloat(formData.salesPrice) || 0,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, data);
      } else {
        await productsApi.create(data);
      }

      setView("list");
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
      alert(
        "Failed to save product: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  const handleArchive = async (product) => {
    if (
      window.confirm(
        `Are you sure you want to ${product.isActive ? "archive" : "restore"} "${product.name}"?`,
      )
    ) {
      try {
        await productsApi.update(product.id, { isActive: !product.isActive });
        fetchProducts();
      } catch (error) {
        console.error("Failed to update product:", error);
      }
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await categoriesApi.create({ name: newCategoryName.trim() });
      setCategories([...categories, res.data]);
      setFormData({ ...formData, categoryId: res.data.id.toString() });
      setNewCategoryName("");
      setShowCategoryInput(false);
    } catch (error) {
      console.error("Failed to create category:", error);
      alert(
        "Failed to create category: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // List View
  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Product Master</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your product catalog
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showArchived
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Archive size={18} />
              {showArchived ? "Showing Archived" : "View Archived"}
            </button>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200"
            >
              <Plus size={18} /> Add Product
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search products or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              />
            </div>
          </div>

          {/* Products Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sales Price
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Purchase Price
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Margin
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => {
                    const margin =
                      product.salesPrice && product.purchasePrice
                        ? (
                            ((product.salesPrice - product.purchasePrice) /
                              product.salesPrice) *
                            100
                          ).toFixed(1)
                        : 0;
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-purple-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                              <Package size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                ID: #{product.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {product.category ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              Uncategorized
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(product.salesPrice)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-gray-600">
                            {formatCurrency(product.purchasePrice)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              margin > 20
                                ? "bg-green-100 text-green-700"
                                : margin > 10
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {margin}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleArchive(product)}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title={product.isActive ? "Archive" : "Restore"}
                            >
                              {product.isActive ? (
                                <Archive size={16} />
                              ) : (
                                <RotateCcw size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">
                    {showArchived
                      ? "No archived products"
                      : "No products found"}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {showArchived
                      ? "Archived products will appear here"
                      : "Create your first product to get started"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-800">
              {products.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-gray-800">
              {categories.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Avg. Margin</p>
            <p className="text-2xl font-bold text-green-600">
              {products.length > 0
                ? (
                    products.reduce((acc, p) => {
                      const margin =
                        p.salesPrice && p.purchasePrice
                          ? ((p.salesPrice - p.purchasePrice) / p.salesPrice) *
                            100
                          : 0;
                      return acc + margin;
                    }, 0) / products.length
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setView("list")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {editingProduct ? "Edit Product" : "New Product"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {editingProduct
              ? "Update product information"
              : "Add a new product to your catalog"}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              placeholder="Enter product name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            {showCategoryInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter new category name"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                  autoFocus
                />
                <button
                  onClick={handleCreateCategory}
                  className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowCategoryInput(false);
                    setNewCategoryName("");
                  }}
                  className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    if (e.target.value === "create") {
                      setShowCategoryInput(true);
                    } else {
                      setFormData({ ...formData, categoryId: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 appearance-none bg-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="create">+ Create New Category</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              💡 You can create a new category on the fly using "Create New
              Category"
            </p>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sales Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salesPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, salesPrice: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Margin Preview */}
          {formData.salesPrice && formData.purchasePrice && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">
                    Profit Margin
                  </p>
                  <p className="text-xs text-purple-400 mt-0.5">
                    Profit:{" "}
                    {formatCurrency(
                      parseFloat(formData.salesPrice) -
                        parseFloat(formData.purchasePrice),
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-700">
                    {(
                      ((parseFloat(formData.salesPrice) -
                        parseFloat(formData.purchasePrice)) /
                        parseFloat(formData.salesPrice)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setView("list")}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200 font-medium"
          >
            {editingProduct ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
