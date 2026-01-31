import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [customerUser, setCustomerUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing sessions
    const storedAdmin = localStorage.getItem("adminUser");
    const storedCustomer = localStorage.getItem("customerPortal");

    if (storedAdmin) {
      setAdminUser(JSON.parse(storedAdmin));
    }
    if (storedCustomer) {
      setCustomerUser(JSON.parse(storedCustomer));
    }
    setLoading(false);
  }, []);

  const adminLogin = (user) => {
    localStorage.setItem("adminUser", JSON.stringify(user));
    setAdminUser(user);
  };

  const adminLogout = () => {
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    setAdminUser(null);
  };

  const customerLogin = (user) => {
    localStorage.setItem("customerPortal", JSON.stringify(user));
    setCustomerUser(user);
  };

  const customerLogout = () => {
    localStorage.removeItem("customerPortal");
    setCustomerUser(null);
  };

  const value = {
    adminUser,
    customerUser,
    loading,
    adminLogin,
    adminLogout,
    customerLogin,
    customerLogout,
    isAdminAuthenticated: !!adminUser,
    isCustomerAuthenticated: !!customerUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected Route Component for Admin
export function AdminProtectedRoute({ children }) {
  const { isAdminAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdminAuthenticated) {
      navigate("/login");
    }
  }, [isAdminAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAdminAuthenticated ? children : null;
}

// Protected Route Component for Customer
export function CustomerProtectedRoute({ children }) {
  const { isCustomerAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isCustomerAuthenticated) {
      navigate("/login");
    }
  }, [isCustomerAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isCustomerAuthenticated ? children : null;
}
