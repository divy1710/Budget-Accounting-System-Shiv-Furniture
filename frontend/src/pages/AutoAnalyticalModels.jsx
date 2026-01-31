import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Archive,
  RotateCcw,
  Settings,
  Check,
  X,
  Clock,
  Filter,
  Users,
  Package,
  Grid3X3,
  BarChart3,
  Save,
  CheckCircle,
} from "lucide-react";
import {
  autoAnalyticalApi,
  productsApi,
  analyticalAccountsApi,
  contactsApi,
  categoriesApi,
} from "../services/api";

const PARTNER_TAGS = [
  "Wholesale",
  "Premium",
  "B2B",
  "MSME",
  "Retailer",
  "Local",
  "VIP",
];

export default function AutoAnalyticalModels() {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [models, setModels] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [formData, setFormData] = useState({
    partnerTag: "",
    partnerId: "",
    categoryId: "",
    productId: "",
    analyticalAccountId: "",
    status: "DRAFT",
    sequence: 10,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, [showArchived, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modelsRes, productsRes, accountsRes, contactsRes, categoriesRes] =
        await Promise.all([
          autoAnalyticalApi.getAll(),
          productsApi.getAll(),
          analyticalAccountsApi.getAll(),
          contactsApi.getAll(),
          categoriesApi.getAll(),
        ]);

      let filtered = modelsRes.data;
      if (showArchived) {
        filtered = filtered.filter((m) => !m.isActive);
      } else {
        filtered = filtered.filter((m) => m.isActive);
      }
      if (statusFilter !== "all") {
        filtered = filtered.filter((m) => m.status === statusFilter);
      }

      setModels(filtered);
      setProducts(productsRes.data.filter((p) => p.isActive));
      setAccounts(accountsRes.data.filter((a) => a.isActive));
      setContacts(contactsRes.data.filter((c) => c.isActive));
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingModel(null);
    setSelectedTags([]);
    setFormData({
      partnerTag: "",
      partnerId: "",
      categoryId: "",
      productId: "",
      analyticalAccountId: "",
      status: "DRAFT",
      sequence: 10,
      isActive: true,
    });
    setView("form");
  };

  const handleEdit = (model) => {
    setEditingModel(model);
    setSelectedTags(
      model.partnerTag ? model.partnerTag.split(",").filter(Boolean) : [],
    );
    setFormData({
      partnerTag: model.partnerTag || "",
      partnerId: model.partnerId?.toString() || "",
      categoryId: model.categoryId?.toString() || "",
      productId: model.productId?.toString() || "",
      analyticalAccountId: model.analyticalAccountId?.toString() || "",
      status: model.status || "DRAFT",
      sequence: model.sequence || 10,
      isActive: model.isActive !== false,
    });
    setView("form");
  };

  const handleSubmit = async () => {
    if (!formData.analyticalAccountId) {
      alert("Please select an Analytic to Apply");
      return;
    }

    try {
      const data = {
        partnerTag: selectedTags.length > 0 ? selectedTags.join(",") : null,
        partnerId: formData.partnerId ? parseInt(formData.partnerId) : null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        productId: formData.productId ? parseInt(formData.productId) : null,
        analyticalAccountId: parseInt(formData.analyticalAccountId),
        status: formData.status,
      };

      if (editingModel) {
        await autoAnalyticalApi.update(editingModel.id, data);
      } else {
        await autoAnalyticalApi.create(data);
      }

      setView("list");
      setEditingModel(null);
      fetchData();
    } catch (error) {
      console.error("Failed to save model:", error);
      alert(
        "Failed to save: " + (error.response?.data?.error || error.message),
      );
    }
  };

  const handleArchive = async (model) => {
    if (
      window.confirm(
        `Are you sure you want to ${model.isActive ? "archive" : "restore"} this model?`,
      )
    ) {
      try {
        await autoAnalyticalApi.update(model.id, {
          ...model,
          isActive: !model.isActive,
        });
        fetchData();
      } catch (error) {
        console.error("Failed to update model:", error);
      }
    }
  };

  const handleAddTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  const getCriteriaCount = (model) => {
    let count = 0;
    if (model.partnerTag) count++;
    if (model.partnerId) count++;
    if (model.categoryId) count++;
    if (model.productId) count++;
    return count;
  };

  // Styles
  const containerStyle = {
    maxWidth: "1000px",
    margin: "0 auto",
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
    cursor: "pointer",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#4F46E5",
    marginBottom: "8px",
  };

  const buttonPrimaryStyle = {
    padding: "12px 24px",
    backgroundColor: "#4F46E5",
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
            <h1 style={titleStyle}>Auto Analytic Model</h1>
            <p style={subtitleStyle}>
              Define logic for automatic analytic account assignment on move
              lines
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
              <Plus size={16} /> New Model
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {["all", "DRAFT", "CONFIRMED", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                border: statusFilter === status ? "none" : "1px solid #E5E7EB",
                backgroundColor: statusFilter === status ? "#EEF2FF" : "white",
                color: statusFilter === status ? "#4F46E5" : "#6B7280",
              }}
            >
              {status === "all"
                ? "All"
                : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div style={cardStyle}>
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
                      Status
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
                      Partner
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
                      Tags
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
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Analytic
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
                  {models.map((model) => (
                    <tr
                      key={model.id}
                      onClick={() => handleEdit(model)}
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
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor:
                              model.status === "CONFIRMED"
                                ? "#D1FAE5"
                                : model.status === "CANCELLED"
                                  ? "#FEE2E2"
                                  : "#FEF3C7",
                            color:
                              model.status === "CONFIRMED"
                                ? "#065F46"
                                : model.status === "CANCELLED"
                                  ? "#991B1B"
                                  : "#92400E",
                          }}
                        >
                          {model.status === "CONFIRMED" ? (
                            <Check size={12} />
                          ) : model.status === "CANCELLED" ? (
                            <X size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {model.status.charAt(0) +
                            model.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", color: "#374151" }}>
                        {model.partner?.name || (
                          <span style={{ color: "#9CA3AF" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {model.partnerTag ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            {model.partnerTag.split(",").map((tag, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: "#EEF2FF",
                                  color: "#4F46E5",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#9CA3AF" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px", color: "#374151" }}>
                        {model.category?.name || (
                          <span style={{ color: "#9CA3AF" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            backgroundColor: "#DBEAFE",
                            color: "#1D4ED8",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {model.analyticalAccount?.name}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(model);
                          }}
                          style={{
                            padding: "8px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "6px",
                            color: "#6B7280",
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(model);
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
                        >
                          {model.isActive ? (
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
              {models.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "#6B7280",
                  }}
                >
                  <Settings
                    size={48}
                    style={{ margin: "0 auto 16px", color: "#D1D5DB" }}
                  />
                  <p style={{ fontWeight: "500" }}>No models found</p>
                  <p style={{ fontSize: "14px", color: "#9CA3AF" }}>
                    Create a model to auto-apply analytics
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#4F46E5",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle size={20} style={{ color: "white" }} />
          </div>
          <p
            style={{ fontSize: "14px", color: "#6B7280", marginBottom: "4px" }}
          >
            Shiv Furniture ERP - Analytics Management Module
          </p>
          <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
            © 2024 Shiv Furniture. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div style={containerStyle}>
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
          <h1 style={titleStyle}>Auto Analytic Model</h1>
          <p style={subtitleStyle}>
            Define logic for automatic analytic account assignment on move lines
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={handleSubmit} style={buttonPrimaryStyle}>
            <Save size={16} /> Save Changes
          </button>
          <button onClick={() => setView("list")} style={buttonSecondaryStyle}>
            Discard
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div
        style={{
          ...cardStyle,
          marginBottom: "24px",
          padding: "8px",
          display: "flex",
          gap: "0",
        }}
      >
        {["DRAFT", "CONFIRMED", "CANCELLED"].map((status) => (
          <button
            key={status}
            onClick={() => setFormData({ ...formData, status })}
            style={{
              flex: 1,
              padding: "14px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              border: "none",
              backgroundColor:
                formData.status === status
                  ? status === "DRAFT"
                    ? "#EEF2FF"
                    : status === "CONFIRMED"
                      ? "#D1FAE5"
                      : "#FEE2E2"
                  : "transparent",
              color:
                formData.status === status
                  ? status === "DRAFT"
                    ? "#4F46E5"
                    : status === "CONFIRMED"
                      ? "#065F46"
                      : "#991B1B"
                  : "#6B7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {status === "DRAFT" && <Edit size={16} />}
            {status === "CONFIRMED" && <Check size={16} />}
            {status === "CANCELLED" && <X size={16} />}
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "24px",
        }}
      >
        {/* Left Column - Trigger Conditions */}
        <div>
          <div style={cardStyle}>
            {/* Trigger Conditions Section */}
            <div style={{ padding: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: "#EEF2FF",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Filter size={16} style={{ color: "#4F46E5" }} />
                </div>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1F2937",
                  }}
                >
                  Trigger Conditions
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                {/* Partner */}
                <div>
                  <label style={labelStyle}>Partner</label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={formData.partnerId}
                      onChange={(e) =>
                        setFormData({ ...formData, partnerId: e.target.value })
                      }
                      style={selectStyle}
                    >
                      <option value="">Select Partner</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name}
                        </option>
                      ))}
                    </select>
                    <Users
                      size={16}
                      style={{
                        position: "absolute",
                        right: "40px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9CA3AF",
                      }}
                    />
                  </div>
                </div>

                {/* Partner Tag */}
                <div>
                  <label style={labelStyle}>Partner Tag</label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          backgroundColor: "#EEF2FF",
                          color: "#4F46E5",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            color: "#4F46E5",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setShowTagDropdown(!showTagDropdown)}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "white",
                          border: "1px dashed #D1D5DB",
                          borderRadius: "6px",
                          fontSize: "13px",
                          color: "#6B7280",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Plus size={14} /> Add Tag
                      </button>
                      {showTagDropdown && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            marginTop: "4px",
                            backgroundColor: "white",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            zIndex: 10,
                            minWidth: "150px",
                          }}
                        >
                          {PARTNER_TAGS.filter(
                            (t) => !selectedTags.includes(t),
                          ).map((tag) => (
                            <button
                              key={tag}
                              onClick={() => handleAddTag(tag)}
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "10px 16px",
                                textAlign: "left",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "14px",
                                color: "#374151",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#F3F4F6")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product */}
                <div>
                  <label style={labelStyle}>Product</label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={formData.productId}
                      onChange={(e) =>
                        setFormData({ ...formData, productId: e.target.value })
                      }
                      style={selectStyle}
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <Package
                      size={16}
                      style={{
                        position: "absolute",
                        right: "40px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9CA3AF",
                      }}
                    />
                  </div>
                </div>

                {/* Product Category */}
                <div>
                  <label style={labelStyle}>Product Category</label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={formData.categoryId}
                      onChange={(e) =>
                        setFormData({ ...formData, categoryId: e.target.value })
                      }
                      style={selectStyle}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Grid3X3
                      size={16}
                      style={{
                        position: "absolute",
                        right: "40px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9CA3AF",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Model Metadata Section */}
            <div
              style={{
                padding: "24px",
                borderTop: "1px solid #E5E7EB",
                backgroundColor: "#FAFAFA",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: "#EEF2FF",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Settings size={16} style={{ color: "#4F46E5" }} />
                </div>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1F2937",
                  }}
                >
                  Model Metadata
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "13px", color: "#6B7280" }}>
                    Created By
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#1F2937",
                      fontWeight: "500",
                    }}
                  >
                    Admin User
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "13px", color: "#6B7280" }}>
                    Date Created
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#1F2937",
                      fontWeight: "500",
                    }}
                  >
                    {editingModel
                      ? new Date(editingModel.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )
                      : new Date().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "13px", color: "#6B7280" }}>
                    Sequence
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#1F2937",
                      fontWeight: "500",
                    }}
                  >
                    {formData.sequence}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "13px", color: "#6B7280" }}>
                    Last Modified
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#1F2937",
                      fontWeight: "500",
                    }}
                  >
                    {editingModel ? "2 hours ago" : "Just now"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Analytic Result */}
        <div>
          {/* Analytic Result Card */}
          <div
            style={{
              backgroundColor: "#4F46E5",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BarChart3 size={16} style={{ color: "white" }} />
              </div>
              <span
                style={{ fontSize: "16px", fontWeight: "600", color: "white" }}
              >
                Analytic Result
              </span>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Analytic to Apply
              </label>
              <select
                value={formData.analyticalAccountId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    analyticalAccountId: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#1F2937",
                  outline: "none",
                  boxSizing: "border-box",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "16px",
                  paddingRight: "40px",
                  cursor: "pointer",
                }}
              >
                <option value="">Select Analytic Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                When conditions are met, the system will automatically tag
                transactions with the selected analytic account.
              </p>
            </div>
          </div>

          {/* Model Priority Card */}
          <div style={cardStyle}>
            <div style={{ padding: "20px" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1F2937",
                  marginBottom: "8px",
                  marginTop: 0,
                }}
              >
                Model Priority
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  lineHeight: "1.5",
                  marginBottom: "16px",
                  marginTop: 0,
                }}
              >
                If multiple models match, the one with the lowest sequence
                number is applied first.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "16px",
                  borderTop: "1px solid #E5E7EB",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Active Status
                </span>
                <button
                  onClick={() =>
                    setFormData({ ...formData, isActive: !formData.isActive })
                  }
                  style={{
                    width: "48px",
                    height: "28px",
                    borderRadius: "14px",
                    backgroundColor: formData.isActive ? "#4F46E5" : "#D1D5DB",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "white",
                      position: "absolute",
                      top: "2px",
                      left: formData.isActive ? "22px" : "2px",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "48px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#4F46E5",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <CheckCircle size={20} style={{ color: "white" }} />
        </div>
        <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "4px" }}>
          Shiv Furniture ERP - Analytics Management Module
        </p>
        <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
          © 2024 Shiv Furniture. All rights reserved.
        </p>
      </div>
    </div>
  );
}
