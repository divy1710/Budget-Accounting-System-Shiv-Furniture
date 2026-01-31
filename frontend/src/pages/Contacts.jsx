import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Building2,
  User,
  X,
  Upload,
  ArrowLeft,
  Archive,
  MapPin,
  Tag,
  Cloud,
} from "lucide-react";
import { contactsApi } from "../services/api";

const AVAILABLE_TAGS = [
  "Supplier",
  "VIP Client",
  "Furniture Maker",
  "B2B",
  "MSME",
  "Retailer",
  "Local",
];

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedContact, setSelectedContact] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "CUSTOMER",
    email: "",
    phone: "",
    jobTitle: "",
    street: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    imageUrl: "",
    tags: [],
  });

  useEffect(() => {
    fetchContacts();
  }, [typeFilter, showArchived]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (!showArchived) params.isActive = true;
      const res = await contactsApi.getAll(params);
      setContacts(res.data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "CUSTOMER",
      email: "",
      phone: "",
      jobTitle: "",
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      imageUrl: "",
      tags: [],
    });
  };

  const handleNew = () => {
    resetForm();
    setSelectedContact(null);
    setViewMode("new");
  };

  const handleEdit = (contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name || "",
      type: contact.type || "CUSTOMER",
      email: contact.email || "",
      phone: contact.phone || "",
      jobTitle: contact.jobTitle || "",
      street: contact.street || "",
      city: contact.city || "",
      state: contact.state || "",
      country: contact.country || "",
      pincode: contact.pincode || "",
      imageUrl: contact.imageUrl || "",
      tags: contact.tags ? contact.tags.split(",").filter(Boolean) : [],
    });
    setViewMode("edit");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedContact(null);
    resetForm();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", file);

      const response = await fetch("http://localhost:5000/api/upload/image", {
        method: "POST",
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Make sure Cloudinary is configured.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tags: formData.tags.join(","),
      };

      if (selectedContact) {
        await contactsApi.update(selectedContact.id, payload);
      } else {
        await contactsApi.create(payload);
      }
      handleBack();
      fetchContacts();
    } catch (error) {
      console.error("Failed to save contact:", error);
      alert("Failed to save contact. " + (error.response?.data?.error || ""));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to archive this contact?")) {
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

  // Styles
  const containerStyle = {
    maxWidth: "900px",
    margin: "0 auto",
  };

  const headerStyle = {
    marginBottom: "24px",
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
    color: "#4F46E5",
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
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const tagStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    backgroundColor: "#EEF2FF",
    color: "#4F46E5",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
  };

  const buttonPrimaryStyle = {
    padding: "12px 24px",
    backgroundColor: "#2563EB",
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
    padding: "12px 24px",
    backgroundColor: "white",
    color: "#374151",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  };

  const buttonDangerOutlineStyle = {
    padding: "12px 24px",
    backgroundColor: "white",
    color: "#DC2626",
    border: "1px solid #DC2626",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  // Form View (New/Edit)
  if (viewMode === "new" || viewMode === "edit") {
    return (
      <div style={containerStyle}>
        {/* Header */}
        <div
          style={{
            ...headerStyle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1 style={titleStyle}>Contact Master</h1>
            <p style={subtitleStyle}>
              Manage supplier, customer, and internal lead profiles for Shiv
              Furniture.
            </p>
          </div>
          <button
            onClick={handleBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        </div>

        {/* Form Card */}
        <div style={cardStyle}>
          {/* Contact Photo Section */}
          <div
            style={{
              ...sectionStyle,
              display: "flex",
              alignItems: "center",
              gap: "24px",
              backgroundColor: "#FAFAFA",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#EEF2FF",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #C7D2FE",
                overflow: "hidden",
              }}
            >
              {formData.imageUrl ? (
                <img
                  src={formData.imageUrl}
                  alt="Contact"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <User size={32} style={{ color: "#A5B4FC" }} />
              )}
            </div>
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1F2937",
                  margin: "0 0 4px 0",
                }}
              >
                Contact Photo
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  margin: "0 0 12px 0",
                }}
              >
                JPG, PNG or GIF. Max 2MB recommended.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "#1F2937",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <Cloud size={16} />
                {uploading ? "Uploading..." : "Upload Image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* General Information Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <User size={20} />
                General Information
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="e.g. Rahul Sharma"
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4F46E5";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(79, 70, 229, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E5E7EB";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Job Title / Designation</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="e.g. Procurement Head"
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4F46E5";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(79, 70, 229, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E5E7EB";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="rahul@company.com"
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4F46E5";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(79, 70, 229, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E5E7EB";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="+91 98765-43210"
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4F46E5";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(79, 70, 229, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E5E7EB";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Location Details Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <MapPin size={20} />
                Location Details
              </div>
              <div>
                <label style={labelStyle}>Primary Office Address</label>
                <textarea
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  style={{
                    ...inputStyle,
                    minHeight: "100px",
                    resize: "vertical",
                  }}
                  placeholder="Street, Building, Suite No., Landmark..."
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4F46E5";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(79, 70, 229, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Classification & Tags Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <Tag size={20} />
                Classification & Tags
              </div>
              <div>
                <label style={labelStyle}>Assigned Tags</label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  {formData.tags.map((tag) => (
                    <span key={tag} style={tagStyle}>
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                        }}
                      >
                        <X size={14} style={{ color: "#4F46E5" }} />
                      </button>
                    </span>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTag())
                      }
                      style={{
                        padding: "6px 12px",
                        border: "1px dashed #D1D5DB",
                        borderRadius: "20px",
                        fontSize: "13px",
                        width: "100px",
                        outline: "none",
                      }}
                      placeholder="+ Add Tag"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  selectedContact && handleDelete(selectedContact.id)
                }
                style={buttonDangerOutlineStyle}
              >
                <Archive size={16} />
                Archive Contact
              </button>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={handleBack}
                  style={buttonSecondaryStyle}
                >
                  Cancel
                </button>
                <button type="submit" style={buttonPrimaryStyle}>
                  Confirm & Save
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Text */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <p
            style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px 0" }}
          >
            This contact will be shared across the{" "}
            <span style={{ color: "#4F46E5" }}>Budget Accounting</span> and{" "}
            <span style={{ color: "#4F46E5" }}>Customer Portal</span> modules.
          </p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
            © 2024 Shiv Furniture Systems Private Limited.
          </p>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div style={containerStyle}>
      <div
        style={{
          ...headerStyle,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={titleStyle}>Contact Master</h1>
          <p style={subtitleStyle}>
            Manage supplier, customer, and internal lead profiles for Shiv
            Furniture.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: showArchived ? "#FEF3C7" : "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            <Archive size={16} /> {showArchived ? "Show Active" : "Archived"}
          </button>
          <button onClick={handleNew} style={buttonPrimaryStyle}>
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        {/* Filters */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            gap: "16px",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
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
              placeholder="Search contacts..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ ...inputStyle, paddingLeft: "40px" }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ ...inputStyle, width: "180px" }}
          >
            <option value="">All Types</option>
            <option value="CUSTOMER">Customers</option>
            <option value="VENDOR">Vendors</option>
          </select>
        </div>

        {/* Table */}
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
                    Contact
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
                    Email
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
                    Phone
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
                    Type
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
                      textAlign: "right",
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
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => handleEdit(contact)}
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
                        {contact.imageUrl ? (
                          <img
                            src={contact.imageUrl}
                            alt={contact.name}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              backgroundColor:
                                contact.type === "CUSTOMER"
                                  ? "#D1FAE5"
                                  : "#DBEAFE",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {contact.type === "CUSTOMER" ? (
                              <User size={18} style={{ color: "#059669" }} />
                            ) : (
                              <Building2
                                size={18}
                                style={{ color: "#2563EB" }}
                              />
                            )}
                          </div>
                        )}
                        <span style={{ fontWeight: "500", color: "#1F2937" }}>
                          {contact.name}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: "#6B7280",
                        fontSize: "14px",
                      }}
                    >
                      {contact.email || "-"}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: "#6B7280",
                        fontSize: "14px",
                      }}
                    >
                      {contact.phone || "-"}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor:
                            contact.type === "CUSTOMER" ? "#D1FAE5" : "#DBEAFE",
                          color:
                            contact.type === "CUSTOMER" ? "#059669" : "#2563EB",
                        }}
                      >
                        {contact.type}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {contact.tags?.split(",").map(
                          (tag) =>
                            tag && (
                              <span
                                key={tag}
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  backgroundColor: "#F3F4F6",
                                  color: "#6B7280",
                                  borderRadius: "12px",
                                }}
                              >
                                {tag}
                              </span>
                            ),
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(contact);
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
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#6B7280";
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact.id);
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
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#6B7280";
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredContacts.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: "#6B7280",
                }}
              >
                No contacts found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
