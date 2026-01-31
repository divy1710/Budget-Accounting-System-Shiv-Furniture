import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  Wallet,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Settings,
  BarChart3,
  UserCog,
} from "lucide-react";

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { divider: true, label: "Master Data" },
  { path: "/contacts", label: "Contacts", icon: Users },
  { path: "/products", label: "Products", icon: Package },
  {
    path: "/analytical-accounts",
    label: "Analytical Accounts",
    icon: FolderTree,
  },
  { path: "/budgets", label: "Budgets", icon: Wallet },
  { path: "/auto-analytical", label: "Auto Analytical", icon: Settings },
  { path: "/users", label: "User Management", icon: UserCog },
  { divider: true, label: "Purchase" },
  { path: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { path: "/vendor-bills", label: "Vendor Bills", icon: Receipt },
  { path: "/bill-payments", label: "Bill Payments", icon: CreditCard },
  { divider: true, label: "Sales" },
  { path: "/sales-orders", label: "Sales Orders", icon: FileText },
  { path: "/customer-invoices", label: "Customer Invoices", icon: FileText },
  { path: "/invoice-payments", label: "Invoice Payments", icon: CreditCard },
  { divider: true, label: "Reports" },
  { path: "/budget-cockpit", label: "Budget Cockpit", icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Shiv Furniture</h1>
        <p className="text-sm text-gray-400">Budget Accounting</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {menuItems.map((item, index) => {
          if (item.divider) {
            return (
              <div key={index} className="mt-4 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Customer Portal Link */}
      <div className="p-4 border-t border-gray-700">
        <a
          href="/login"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <Users size={16} />
          Customer Portal
        </a>
      </div>
    </aside>
  );
}
