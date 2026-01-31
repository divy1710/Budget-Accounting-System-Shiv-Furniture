import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Archive,
  RotateCcw,
  FolderTree,
  Save,
  CheckCircle,
  BarChart3,
  Hash,
  FileText,
  Settings,
} from "lucide-react";
import { analyticalAccountsApi } from "../services/api";

export default function AnalyticalAccounts() {
  const [view, setView] = useState("list");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchAccounts();
  }, [showArchived]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await analyticalAccountsApi.getAll();
      const filtered = showArchived
        ? res.data.filter((a) => !a.isActive)
        : res.data.filter((a) => a.isActive);
      setAccounts(filtered);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingAccount(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      isActive: true,
    });
    setView("form");
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      description: account.description || "",
      isActive: account.isActive !== false,
    });
    setView("form");
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Please enter an analytic name");
      return;
    }

    try {
      const data = {
        code:
          formData.code ||
          formData.name.toUpperCase().replace(/\s+/g, "-").substring(0, 10),
        name: formData.name,
        description: formData.description || null,
      };

      if (editingAccount) {
        await analyticalAccountsApi.update(editingAccount.id, data);
      } else {
        await analyticalAccountsApi.create(data);
      }

      setView("list");
      setEditingAccount(null);
      fetchAccounts();
    } catch (error) {
      console.error("Failed to save account:", error);
      alert(
        "Failed to save: " + (error.response?.data?.error || error.message),
      );
    }
  };

  const handleArchive = async (account) => {
    if (
      window.confirm(
        `Are you sure you want to ${account.isActive ? "archive" : "restore"} "${account.name}"?`,
      )
    ) {
      try {
        await analyticalAccountsApi.update(account.id, {
          isActive: !account.isActive,
        });
        fetchAccounts();
      } catch (error) {
        console.error("Failed to update account:", error);
      }
    }
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
            <h1 style={titleStyle}>Analytical Accounts</h1>
            <p style={subtitleStyle}>
              Manage your analytical accounts for cost tracking and reporting
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
              <Plus size={16} /> New Analytic
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div style={{ ...cardStyle, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                <BarChart3 size={20} style={{ color: "#4F46E5" }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    margin: "0 0 4px 0",
                  }}
                >
                  Total Analytics
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1F2937",
                    margin: 0,
                  }}
                >
                  {accounts.length}
                </p>
              </div>
            </div>
          </div>
          <div style={{ ...cardStyle, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#D1FAE5",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle size={20} style={{ color: "#059669" }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    margin: "0 0 4px 0",
                  }}
                >
                  Active
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#059669",
                    margin: 0,
                  }}
                >
                  {accounts.filter((a) => a.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div style={{ ...cardStyle, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#FEF3C7",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Archive size={20} style={{ color: "#D97706" }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    margin: "0 0 4px 0",
                  }}
                >
                  Archived
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#D97706",
                    margin: 0,
                  }}
                >
                  {accounts.filter((a) => !a.isActive).length || 0}
                </p>
              </div>
            </div>
          </div>
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
                        padding: "14px 24px",
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
                        padding: "14px 24px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Code
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        textAlign: "center",
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
                        padding: "14px 24px",
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
                  {accounts.map((account) => (
                    <tr
                      key={account.id}
                      onClick={() => handleEdit(account)}
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
                              background:
                                "linear-gradient(135deg, #4F46E5, #7C3AED)",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FolderTree size={18} style={{ color: "white" }} />
                          </div>
                          <span style={{ fontWeight: "600", color: "#1F2937" }}>
                            {account.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#EEF2FF",
                            color: "#4F46E5",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            fontFamily: "monospace",
                          }}
                        >
                          {account.code}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "16px 24px",
                          color: "#6B7280",
                          fontSize: "14px",
                          maxWidth: "250px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {account.description || (
                          <span style={{ color: "#D1D5DB" }}>
                            No description
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: account.isActive
                              ? "#D1FAE5"
                              : "#FEE2E2",
                            color: account.isActive ? "#065F46" : "#991B1B",
                          }}
                        >
                          {account.isActive ? (
                            <CheckCircle size={12} />
                          ) : (
                            <Archive size={12} />
                          )}
                          {account.isActive ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(account);
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
                            handleArchive(account);
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
                          {account.isActive ? (
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
              {accounts.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "#6B7280",
                  }}
                >
                  <FolderTree
                    size={48}
                    style={{ margin: "0 auto 16px", color: "#D1D5DB" }}
                  />
                  <p style={{ fontWeight: "500" }}>
                    {showArchived
                      ? "No archived analytics"
                      : "No analytics found"}
                  </p>
                  <p style={{ fontSize: "14px", color: "#9CA3AF" }}>
                    Create your first analytic account to start tracking costs
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
            <BarChart3 size={20} style={{ color: "white" }} />
          </div>
          <p
            style={{ fontSize: "14px", color: "#6B7280", marginBottom: "4px" }}
          >
            Shiv Furniture ERP - Analytical Accounts Module
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
          <h1 style={titleStyle}>
            {editingAccount ? "Edit Analytic" : "New Analytic"}
          </h1>
          <p style={subtitleStyle}>
            {editingAccount
              ? "Update analytic account information"
              : "Create a new analytical account for cost tracking"}
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

      {/* Main Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "24px",
        }}
      >
        {/* Left Column - Form Fields */}
        <div style={cardStyle}>
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
                <FolderTree size={16} style={{ color: "#4F46E5" }} />
              </div>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1F2937",
                }}
              >
                Analytic Information
              </span>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              {/* Analytic Name */}
              <div>
                <label style={labelStyle}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FileText size={14} /> Analytic Name *
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="e.g., Deepawali, Marriage Session, Furniture Expo 2026"
                />
              </div>

              {/* Code */}
              <div>
                <label style={labelStyle}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Hash size={14} /> Code
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  style={{ ...inputStyle, fontFamily: "monospace" }}
                  placeholder="AUTO-GENERATED"
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9CA3AF",
                    marginTop: "6px",
                  }}
                >
                  Leave empty to auto-generate from name
                </p>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FileText size={14} /> Description
                  </span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  style={{ ...inputStyle, resize: "none", minHeight: "100px" }}
                  placeholder="Optional description for this analytic account..."
                />
              </div>
            </div>
          </div>

          {/* Metadata Section */}
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
                Account Metadata
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                  {editingAccount
                    ? new Date(editingAccount.createdAt).toLocaleDateString(
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                  Account ID
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#1F2937",
                    fontWeight: "500",
                  }}
                >
                  {editingAccount?.id || "New"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                  {editingAccount ? "Recently" : "Just now"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Preview Card */}
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
                Preview
              </span>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FolderTree size={16} style={{ color: "white" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1F2937",
                      margin: 0,
                    }}
                  >
                    {formData.name || "Analytic Name"}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#6B7280",
                      margin: 0,
                      fontFamily: "monospace",
                    }}
                  >
                    {formData.code || "CODE"}
                  </p>
                </div>
              </div>
              {formData.description && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  {formData.description}
                </p>
              )}
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                This analytic will be available for tagging transactions and
                generating cost reports.
              </p>
            </div>
          </div>

          {/* Status Card */}
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
                Account Status
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
                Active accounts appear in dropdowns and can be assigned to
                transactions.
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
          <BarChart3 size={20} style={{ color: "white" }} />
        </div>
        <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "4px" }}>
          Shiv Furniture ERP - Analytical Accounts Module
        </p>
        <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
          © 2024 Shiv Furniture. All rights reserved.
        </p>
      </div>
    </div>
  );
}
