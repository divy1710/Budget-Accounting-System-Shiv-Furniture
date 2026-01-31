import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Search,
  LogOut,
  Settings,
  ChevronDown,
  Users,
  Package,
  FolderTree,
  Cog,
  Wallet,
  ShoppingCart,
  Receipt,
  CreditCard,
  FileText,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const userDropdownRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate("/login");
  };

  const userName = adminUser?.name || "Admin User";
  const userRole = adminUser?.role === "admin" ? "Super Admin" : "User";

  // Menu structure
  const menus = {
    account: {
      label: "Account",
      items: [
        { path: "/contacts", label: "Contact", icon: Users },
        { path: "/products", label: "Product", icon: Package },
        { path: "/analytical-accounts", label: "Analyticals", icon: FolderTree },
        { path: "/auto-analytical", label: "Auto Analytic Model", icon: Cog },
        { path: "/budgets", label: "Budget", icon: Wallet },
      ],
    },
    purchase: {
      label: "Purchase",
      items: [
        { path: "/purchase-orders", label: "Purchase Order", icon: ShoppingCart },
        { path: "/vendor-bills", label: "Purchase Bill", icon: Receipt },
        { path: "/bill-payments", label: "Payment", icon: CreditCard },
      ],
    },
    sale: {
      label: "Sale",
      items: [
        { path: "/sales-orders", label: "Sale Order", icon: FileText },
        { path: "/customer-invoices", label: "Sale Invoice", icon: Receipt },
        { path: "/invoice-payments", label: "Receipt", icon: DollarSign },
      ],
    },
  };

  const toggleMenu = (menuKey) => {
    setActiveMenu(activeMenu === menuKey ? null : menuKey);
  };

  // Styles
  const headerStyle = {
    backgroundColor: 'white',
    borderBottom: '1px solid #E5E7EB',
    padding: '0 24px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  };

  const logoBoxStyle = {
    width: '36px',
    height: '36px',
    backgroundColor: '#2563EB',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  };

  const menuButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: '0',
    marginTop: '8px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    border: '1px solid #E5E7EB',
    padding: '8px',
    minWidth: '200px',
    zIndex: 100,
  };

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#374151',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s',
  };

  const searchContainerStyle = {
    position: 'relative',
    width: '280px',
  };

  const searchInputStyle = {
    width: '100%',
    padding: '10px 16px 10px 40px',
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    outline: 'none',
  };

  const userButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s',
  };

  return (
    <header style={headerStyle}>
      {/* Left Section - Logo & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} ref={menuRef}>
        {/* Logo */}
        <Link to="/" style={logoStyle}>
          <div style={logoBoxStyle}>SF</div>
          <span style={{ fontWeight: '600', color: '#1F2937', fontSize: '16px' }}>Shiv Furniture</span>
        </Link>

        {/* Navigation Menus */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {Object.entries(menus).map(([key, menu]) => (
            <div key={key} style={{ position: 'relative' }}>
              <button
                style={{
                  ...menuButtonStyle,
                  backgroundColor: activeMenu === key ? '#F3F4F6' : 'transparent',
                }}
                onClick={() => toggleMenu(key)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = activeMenu === key ? '#F3F4F6' : 'transparent';
                }}
              >
                {menu.label}
                <ChevronDown 
                  size={16} 
                  style={{ 
                    transform: activeMenu === key ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }} 
                />
              </button>

              {activeMenu === key && (
                <div style={dropdownStyle}>
                  {menu.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        style={dropdownItemStyle}
                        onClick={() => setActiveMenu(null)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon size={18} style={{ color: '#6B7280' }} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right Section - Search & User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Search Bar */}
        <div style={searchContainerStyle}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#9CA3AF' 
            }} 
          />
          <input
            type="text"
            placeholder="Search data..."
            style={searchInputStyle}
          />
        </div>

        {/* User Dropdown */}
        <div style={{ position: 'relative' }} ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            style={userButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ 
              width: '36px', 
              height: '36px', 
              backgroundColor: '#10B981', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <User size={18} style={{ color: 'white' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>{userName}</p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{userRole}</p>
            </div>
            <ChevronDown size={16} style={{ color: '#9CA3AF' }} />
          </button>

          {showUserDropdown && (
            <div style={{
              position: 'absolute',
              right: '0',
              top: '100%',
              marginTop: '8px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E5E7EB',
              padding: '8px',
              minWidth: '200px',
              zIndex: 100,
            }}>
              <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', marginBottom: '8px' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>{userName}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>{adminUser?.email || 'admin@shivfurniture.com'}</p>
              </div>
              <Link
                to="/users"
                onClick={() => setShowUserDropdown(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: '#374151',
                  textDecoration: 'none',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings size={18} style={{ color: '#6B7280' }} />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: '#DC2626',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
