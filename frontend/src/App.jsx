import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Products from "./pages/Products";
import AnalyticalAccounts from "./pages/AnalyticalAccounts";
import Budgets from "./pages/Budgets";
import AutoAnalyticalModels from "./pages/AutoAnalyticalModels";
import BudgetCockpit from "./pages/BudgetCockpit";
import TransactionList from "./pages/TransactionList";
import TransactionForm from "./pages/TransactionForm";
import TransactionDetail from "./pages/TransactionDetail";
import PaymentList from "./pages/PaymentList";
import PaymentForm from "./pages/PaymentForm";
import UserManagement from "./pages/UserManagement";
// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
// Customer Portal
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerInvoices from "./pages/customer/CustomerInvoices";
import CustomerInvoiceDetail from "./pages/customer/CustomerInvoiceDetail";
import CustomerPayments from "./pages/customer/CustomerPayments";
import "./App.css";

function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/welcome" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin Portal */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />

        {/* Master Data */}
        <Route path="contacts" element={<Contacts />} />
        <Route path="products" element={<Products />} />
        <Route path="analytical-accounts" element={<AnalyticalAccounts />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="auto-analytical" element={<AutoAnalyticalModels />} />
        <Route path="users" element={<UserManagement />} />

        {/* Transactions */}
        <Route
          path="purchase-orders"
          element={
            <TransactionList type="PURCHASE_ORDER" title="Purchase Orders" />
          }
        />
        <Route
          path="vendor-bills"
          element={<TransactionList type="VENDOR_BILL" title="Vendor Bills" />}
        />
        <Route
          path="sales-orders"
          element={<TransactionList type="SALES_ORDER" title="Sales Orders" />}
        />
        <Route
          path="customer-invoices"
          element={
            <TransactionList
              type="CUSTOMER_INVOICE"
              title="Customer Invoices"
            />
          }
        />
        <Route path="transactions/new" element={<TransactionForm />} />
        <Route path="transactions/:id" element={<TransactionDetail />} />

        {/* Payments */}
        <Route
          path="vendor-payments"
          element={<PaymentList contactType="VENDOR" title="Vendor Payments" />}
        />
        <Route
          path="customer-payments"
          element={
            <PaymentList contactType="CUSTOMER" title="Customer Payments" />
          }
        />
        <Route path="payments/new" element={<PaymentForm />} />

        {/* Reports */}
        <Route path="budget-cockpit" element={<BudgetCockpit />} />
      </Route>

      {/* Customer Portal */}
      <Route path="/customer/dashboard" element={<CustomerDashboard />} />
      <Route path="/customer/invoices" element={<CustomerInvoices />} />
      <Route
        path="/customer/invoices/:id"
        element={<CustomerInvoiceDetail />}
      />
      <Route path="/customer/payments" element={<CustomerPayments />} />
    </Routes>
  );
}

export default App;
