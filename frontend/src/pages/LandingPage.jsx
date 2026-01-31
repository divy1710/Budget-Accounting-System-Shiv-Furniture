import { Link } from "react-router-dom";
import {
  Building2,
  ArrowRight,
  TrendingUp,
  Shield,
  Sparkles,
  Users,
  Package,
  Receipt,
  PieChart,
  CheckCircle,
  BarChart3,
  Zap,
  Lock,
  Clock,
  DollarSign,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/welcome" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Building2 className="text-white" size={26} />
                </div>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">Shiv Furniture</h1>
                <p className="text-blue-400 text-xs font-medium">
                  Budget Accounting
                </p>
              </div>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-6 py-2.5 text-gray-300 hover:text-white transition font-medium hover:bg-white/5 rounded-lg"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold overflow-hidden shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-full px-5 py-2 mb-8 backdrop-blur-sm">
              <Sparkles className="text-blue-400 animate-pulse" size={18} />
              <span className="text-blue-300 text-sm font-semibold">
                AI-Powered Budget Management
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-tight">
              Transform Your
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 animate-gradient">
                Furniture Business
              </span>
              <span className="block mt-2">Finances</span>
            </h1>

            <p className="text-gray-300 text-xl sm:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed">
              Complete budget accounting system with{" "}
              <span className="text-blue-400 font-semibold">
                real-time analytics
              </span>
              , automated workflows, and powerful insights to grow your business
              faster.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
              <Link
                to="/signup"
                className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-2xl font-bold text-lg overflow-hidden shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Start Free Trial
                  <ArrowRight
                    size={22}
                    className="group-hover:translate-x-2 transition-transform"
                  />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-10 py-5 bg-white/5 backdrop-blur-sm text-white rounded-2xl font-bold text-lg border-2 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400" size={18} />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400" size={18} />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-400" size={18} />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none"></div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-3xl blur-3xl"></div>

            <div className="relative bg-gradient-to-br from-slate-900/90 to-blue-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
              {/* Dashboard Cards Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
                      <TrendingUp className="text-green-400" size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 text-sm font-semibold">
                        +12.5%
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Total Revenue</p>
                  <p className="text-4xl font-bold text-white mb-1">₹4.5L</p>
                  <p className="text-green-400 text-sm font-medium">
                    This month
                  </p>
                </div>

                {/* Orders Card */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Receipt className="text-blue-400" size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 text-sm font-semibold">
                        +8 new
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Active Orders</p>
                  <p className="text-4xl font-bold text-white mb-1">156</p>
                  <p className="text-blue-400 text-sm font-medium">
                    In progress
                  </p>
                </div>

                {/* Budget Card */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                      <PieChart className="text-purple-400" size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-purple-400 text-sm font-semibold">
                        On track
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Budget Usage</p>
                  <p className="text-4xl font-bold text-white mb-1">78%</p>
                  <p className="text-purple-400 text-sm font-medium">
                    Of allocated
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 border-y border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Zap, value: "10x", label: "Faster Processing" },
              { icon: Shield, value: "100%", label: "Secure & Encrypted" },
              { icon: Clock, value: "24/7", label: "Available Support" },
              { icon: Users, value: "500+", label: "Happy Customers" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="text-blue-400" size={28} />
                </div>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="text-blue-400" size={16} />
              <span className="text-blue-400 text-sm font-semibold">
                Powerful Features
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Everything You Need to
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Succeed in Business
              </span>
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto">
              Comprehensive suite of tools designed for modern furniture
              business management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Real-Time Budget Tracking",
                description:
                  "Monitor budgets with analytical accounts, cost centers, and instant alerts",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Receipt,
                title: "Smart Invoice Management",
                description:
                  "Create POs, SOs, bills & invoices with automated workflows",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Users,
                title: "Contact Hub",
                description:
                  "Manage customers & vendors with tags, images, portal access",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Package,
                title: "Product Catalog",
                description:
                  "Categories, pricing, margins calculated automatically",
                color: "from-orange-500 to-red-500",
              },
              {
                icon: PieChart,
                title: "Analytics Dashboard",
                description:
                  "Budget cockpit with comprehensive reports & insights",
                color: "from-cyan-500 to-blue-500",
              },
              {
                icon: Lock,
                title: "Enterprise Security",
                description:
                  "Role-based access, encryption, and secure portals",
                color: "from-indigo-500 to-purple-500",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-slate-900/50 to-blue-900/20 backdrop-blur-sm rounded-2xl p-8 border border-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden"
              >
                {/* Hover glow effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                ></div>

                <div
                  className={`relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 shadow-lg`}
                >
                  <feature.icon className="text-white" size={26} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 relative">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed relative">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Complete Business Modules
            </h2>
            <p className="text-gray-400 text-xl">
              All-in-one platform for end-to-end financial management
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Purchase Cycle",
                icon: Package,
                items: [
                  "Purchase Orders",
                  "Vendor Bills",
                  "Vendor Payments",
                  "Vendor Management",
                ],
                gradient: "from-orange-500/20 to-red-500/20",
                border: "border-orange-500/30",
                iconBg: "bg-orange-500/20",
                iconColor: "text-orange-400",
                checkColor: "text-orange-400",
              },
              {
                title: "Sales Cycle",
                icon: Receipt,
                items: [
                  "Sales Orders",
                  "Customer Invoices",
                  "Customer Payments",
                  "Customer Portal",
                ],
                gradient: "from-green-500/20 to-emerald-500/20",
                border: "border-green-500/30",
                iconBg: "bg-green-500/20",
                iconColor: "text-green-400",
                checkColor: "text-green-400",
              },
              {
                title: "Master Data",
                icon: Users,
                items: [
                  "Contacts (Customers & Vendors)",
                  "Products & Categories",
                  "Analytical Accounts",
                  "User Management",
                ],
                gradient: "from-blue-500/20 to-cyan-500/20",
                border: "border-blue-500/30",
                iconBg: "bg-blue-500/20",
                iconColor: "text-blue-400",
                checkColor: "text-blue-400",
              },
              {
                title: "Budget & Reports",
                icon: PieChart,
                items: [
                  "Budget Allocation",
                  "Budget Cockpit",
                  "Auto Analytical Models",
                  "Financial Reports",
                ],
                gradient: "from-purple-500/20 to-pink-500/20",
                border: "border-purple-500/30",
                iconBg: "bg-purple-500/20",
                iconColor: "text-purple-400",
                checkColor: "text-purple-400",
              },
            ].map((module, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${module.gradient} backdrop-blur-sm border ${module.border} rounded-3xl p-8 hover:scale-105 transition-all duration-300`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-14 h-14 ${module.iconBg} rounded-2xl flex items-center justify-center`}
                  >
                    <module.icon className={module.iconColor} size={28} />
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    {module.title}
                  </h3>
                </div>
                <ul className="space-y-4">
                  {module.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle
                        className={`${module.checkColor} flex-shrink-0`}
                        size={20}
                      />
                      <span className="text-gray-300 text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-3xl blur-3xl"></div>

          <div className="relative bg-gradient-to-br from-blue-600/10 to-cyan-600/10 backdrop-blur-xl border border-white/10 rounded-3xl p-12 sm:p-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Transform Your
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Business Finances?
              </span>
            </h2>
            <p className="text-gray-300 text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of businesses managing their finances smarter with
              our platform
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link
                to="/signup"
                className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-2xl font-bold text-lg overflow-hidden shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Get Started Free
                  <ArrowRight
                    size={22}
                    className="group-hover:translate-x-2 transition-transform"
                  />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-bold text-lg border-2 border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>

            {/* Features */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm">
              {[
                "14-day free trial",
                "No credit card required",
                "Cancel anytime",
                "24/7 support",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="text-green-400" size={18} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white font-bold">Shiv Furniture</p>
                <p className="text-gray-400 text-sm">
                  © 2026 All rights reserved.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <Link
                to="/login"
                className="text-gray-400 hover:text-white transition font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-gray-400 hover:text-white transition font-medium"
              >
                Sign Up
              </Link>
              <Link
                to="/welcome"
                className="text-gray-400 hover:text-white transition font-medium"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
