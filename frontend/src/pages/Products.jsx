import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Home,
  ArrowLeft,
  Edit,
  Archive,
  Package,
  Plus,
  Search,
  RotateCcw,
  Info,
  DollarSign,
  Grid3X3,
  Trash2,
  Check,
  ChevronRight,
} from "lucide-react";
import {
  productsApi,
  categoriesApi,
  analyticalAccountsApi,
} from "../services/api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function Products() {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analyticalAccounts, setAnalyticalAccounts] = useState([]);
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
    costCenters: [],
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchAnalyticalAccounts();
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

  const fetchAnalyticalAccounts = async () => {
    try {
      const res = await analyticalAccountsApi.getAll();
      setAnalyticalAccounts(res.data);
    } catch (error) {
      console.error("Failed to fetch analytical accounts:", error);
    }
  };

  const handleNew = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      categoryId: "",
      salesPrice: "",
      purchasePrice: "",
      costCenters: [],
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
      costCenters: product.costCenters || [],
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

  const handleAddCostCenter = () => {
    setFormData({
      ...formData,
      costCenters: [...formData.costCenters, { name: "", allocation: "" }],
    });
  };

  const handleRemoveCostCenter = (index) => {
    const newCostCenters = formData.costCenters.filter((_, i) => i !== index);
    setFormData({ ...formData, costCenters: newCostCenters });
  };

  const handleCostCenterChange = (index, field, value) => {
    const newCostCenters = [...formData.costCenters];
    newCostCenters[index][field] = value;
    setFormData({ ...formData, costCenters: newCostCenters });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Styles
  const containerStyle = {
    maxWidth: "900px",
    margin: "0 auto",
  };

  const breadcrumbStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#6B7280",
    marginBottom: "16px",
  };

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1F2937",
    margin: "0 0 8px 0",
  };

  const subtitleStyle = {
    fontSize: "14px",
    color: "#6B7280",
    margin: 0,
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
    marginBottom: "24px",
  };

  const sectionStyle = {
    padding: "24px",
    borderBottom: "1px solid #E5E7EB",
  };

  const sectionTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: "20px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1F2937",
    outline: "none",
    boxSizing: "border-box",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    paddingRight: "40px",
  };

  const buttonPrimaryStyle = {
    padding: "12px 24px",
    backgroundColor: "#1F2937",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const buttonSecondaryStyle = {
    padding: "10px 20px",
    backgroundColor: "white",
    color: "#374151",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  // List View
  if (view === "list") {
    return (
      <div style={containerStyle}>
        {/* Breadcrumb */}
        <div style={breadcrumbStyle}>
          <Home size={14} />
          <span>Home</span>
          <ChevronRight size={14} />
          <span>Inventory</span>
          <ChevronRight size={14} />
          <span style={{ color: "#1F2937", fontWeight: "500" }}>
            Product Master
          </span>
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={titleStyle}>Product Master</h1>
            <p style={subtitleStyle}>
              Configure furniture items, pricing, and cost center allocations.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowArchived(!showArchived)}
              style={{
                ...buttonSecondaryStyle,
                backgroundColor: showArchived ? "#FEF3C7" : "white",
              }}
            >
              <Archive size={16} />
              {showArchived ? "Show Active" : "Archived"}
            </button>
            <button onClick={handleNew} style={buttonPrimaryStyle}>
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div style={cardStyle}>
          {/* Search Bar */}
          <div
            style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB" }}
          >
            <div style={{ position: "relative", maxWidth: "400px" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                }}
              />
              <input
                type="text"
                placeholder="Search products or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "40px" }}
              />
            </div>
          </div>

          {/* Products Table */}
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid #E5E7EB",
                  borderTopColor: "#4F46E5",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9FAFB" }}>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Product
                    </th>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Category
                    </th>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Sales Price
                    </th>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Purchase Price
                    </th>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => handleEdit(product)}
                      style={{
                        borderBottom: "1px solid #E5E7EB",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#F9FAFB")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "white")
                      }
                    >
                      <td style={{ padding: "16px 24px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              backgroundColor: "#EEF2FF",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Package size={18} style={{ color: "#4F46E5" }} />
                          </div>
                          <span style={{ fontWeight: "500", color: "#1F2937" }}>
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {product.category ? (
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "500",
                              backgroundColor: "#DBEAFE",
                              color: "#2563EB",
                            }}
                          >
                            {product.category.name}
                          </span>
                        ) : (
                          <span style={{ color: "#9CA3AF", fontSize: "14px" }}>
                            Uncategorized
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "16px 24px",
                          textAlign: "right",
                          fontWeight: "500",
                          color: "#059669",
                        }}
                      >
                        {formatCurrency(product.salesPrice)}
                      </td>
                      <td
                        style={{
                          padding: "16px 24px",
                          textAlign: "right",
                          color: "#6B7280",
                        }}
                      >
                        {formatCurrency(product.purchasePrice)}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(product);
                          }}
                          style={{
                            padding: "8px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "6px",
                            color: "#6B7280",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#EEF2FF";
                            e.currentTarget.style.color = "#4F46E5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = "#6B7280";
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(product);
                          }}
                          style={{
                            padding: "8px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "6px",
                            color: "#6B7280",
                            marginLeft: "4px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#FEF2F2";
                            e.currentTarget.style.color = "#DC2626";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = "#6B7280";
                          }}
                        >
                          {product.isActive ? (
                            <Archive size={16} />
                          ) : (
                            <RotateCcw size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "#6B7280",
                  }}
                >
                  <Package
                    size={48}
                    style={{ margin: "0 auto 16px", color: "#D1D5DB" }}
                  />
                  <p style={{ fontWeight: "500" }}>
                    {showArchived
                      ? "No archived products"
                      : "No products found"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
            © 2024 Shiv Furniture ERP Systems. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div style={containerStyle}>
      {/* Breadcrumb */}
      <div style={breadcrumbStyle}>
        <Home size={14} />
        <span>Home</span>
        <ChevronRight size={14} />
        <span>Inventory</span>
        <ChevronRight size={14} />
        <span style={{ color: "#1F2937", fontWeight: "500" }}>
          Product Master
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={titleStyle}>Product Master</h1>
          <p style={subtitleStyle}>
            Configure furniture items, pricing, and cost center allocations.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setView("list")} style={buttonSecondaryStyle}>
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={() => editingProduct && handleArchive(editingProduct)}
            style={buttonSecondaryStyle}
          >
            <Archive size={16} /> Archive
          </button>
          <button onClick={handleSubmit} style={buttonPrimaryStyle}>
            <Check size={16} /> Confirm
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div style={cardStyle}>
        {/* Basic Information Section */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#EEF2FF",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Info size={14} style={{ color: "#4F46E5" }} />
            </div>
            Basic Information
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={inputStyle}
                placeholder="e.g. Ergonomic Office Chair - Blue"
              />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryInput(true)}
                  style={{
                    fontSize: "13px",
                    color: "#4F46E5",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  + Create New
                </button>
              </div>
              {showCategoryInput ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new category name"
                    style={{ ...inputStyle, flex: 1 }}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateCategory}
                    style={{ ...buttonPrimaryStyle, padding: "10px 16px" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowCategoryInput(false);
                      setNewCategoryName("");
                    }}
                    style={{ ...buttonSecondaryStyle, padding: "10px 16px" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  style={selectStyle}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Details Section */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#EEF2FF",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign size={14} style={{ color: "#4F46E5" }} />
            </div>
            Pricing Details
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Purchase Price</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6B7280",
                    fontWeight: "500",
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: e.target.value })
                  }
                  style={{ ...inputStyle, paddingLeft: "36px" }}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Sales Price</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6B7280",
                    fontWeight: "500",
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salesPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, salesPrice: e.target.value })
                  }
                  style={{ ...inputStyle, paddingLeft: "36px" }}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Associated Analyticals Section */}
        <div style={{ ...sectionStyle, borderBottom: "none" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div style={sectionTitleStyle}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: "#EEF2FF",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Grid3X3 size={14} style={{ color: "#4F46E5" }} />
              </div>
              Associated Analyticals
            </div>
            <button
              type="button"
              onClick={handleAddCostCenter}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                backgroundColor: "#EEF2FF",
                color: "#4F46E5",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              <Plus size={16} /> Add Cost Center
            </button>
          </div>

          {formData.costCenters.length > 0 && (
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9FAFB" }}>
                    <th
                      style={{
                        padding: "12px 20px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Cost Center Name
                    </th>
                    <th
                      style={{
                        padding: "12px 20px",
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Allocation %
                    </th>
                    <th
                      style={{
                        padding: "12px 20px",
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.costCenters.map((cc, index) => (
                    <tr key={index} style={{ borderTop: "1px solid #E5E7EB" }}>
                      <td style={{ padding: "12px 20px" }}>
                        <select
                          value={cc.name}
                          onChange={(e) =>
                            handleCostCenterChange(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          style={{ ...selectStyle, backgroundColor: "white" }}
                        >
                          <option value="">Select cost center</option>
                          {analyticalAccounts.map((acc) => (
                            <option key={acc.id} value={acc.name}>
                              {acc.name}
                            </option>
                          ))}
                          <option value="Main Warehouse Logistics">
                            Main Warehouse Logistics
                          </option>
                          <option value="Retail Showroom A">
                            Retail Showroom A
                          </option>
                          <option value="Manufacturing Unit">
                            Manufacturing Unit
                          </option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={cc.allocation}
                            onChange={(e) =>
                              handleCostCenterChange(
                                index,
                                "allocation",
                                e.target.value,
                              )
                            }
                            style={{
                              ...inputStyle,
                              width: "80px",
                              textAlign: "center",
                              backgroundColor: "white",
                            }}
                            placeholder="0"
                          />
                          <span style={{ color: "#6B7280" }}>%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveCostCenter(index)}
                          style={{
                            padding: "8px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#4F46E5",
                            borderRadius: "6px",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#EEF2FF")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Product Master Entry Button */}
      <button
        onClick={handleNew}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "14px 24px",
          backgroundColor: "white",
          color: "#4F46E5",
          border: "2px dashed #C7D2FE",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          marginBottom: "32px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#EEF2FF";
          e.currentTarget.style.borderColor = "#4F46E5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "white";
          e.currentTarget.style.borderColor = "#C7D2FE";
        }}
      >
        <Plus size={18} /> New Product Master Entry
      </button>

      {/* Footer */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
          © 2024 Shiv Furniture ERP Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
