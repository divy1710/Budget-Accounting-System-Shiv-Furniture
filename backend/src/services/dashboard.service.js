const prisma = require("../lib/prisma");

// Get budget cockpit data
const getBudgetCockpit = async (filters = {}) => {
  const { year, month } = filters;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

  // Get all analytical accounts with their budgets
  const accounts = await prisma.analyticalAccount.findMany({
    include: {
      budgets: {
        where: { year: currentYear, month: currentMonth },
      },
    },
    orderBy: { code: "asc" },
  });

  // Build summary
  const summary = accounts.map((account) => {
    const budget = account.budgets[0];
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      budgetedAmount: budget ? Number(budget.budgetedAmount) : 0,
      actualAmount: budget ? Number(budget.actualAmount) : 0,
      remainingAmount: budget
        ? Number(budget.budgetedAmount) - Number(budget.actualAmount)
        : 0,
      utilizationPercent:
        budget && Number(budget.budgetedAmount) > 0
          ? (Number(budget.actualAmount) / Number(budget.budgetedAmount)) * 100
          : 0,
    };
  });

  // Calculate totals
  const totals = {
    totalBudgeted: summary.reduce((sum, s) => sum + s.budgetedAmount, 0),
    totalActual: summary.reduce((sum, s) => sum + s.actualAmount, 0),
    totalRemaining: summary.reduce((sum, s) => sum + s.remainingAmount, 0),
  };
  totals.overallUtilization =
    totals.totalBudgeted > 0
      ? (totals.totalActual / totals.totalBudgeted) * 100
      : 0;

  return { year: currentYear, month: currentMonth, summary, totals };
};

// Get yearly budget trend
const getYearlyTrend = async (year) => {
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  const budgets = await prisma.budget.findMany({
    where: { year: targetYear },
    include: { analyticalAccount: true },
    orderBy: [{ month: "asc" }, { analyticalAccountId: "asc" }],
  });

  // Group by month
  const monthlyData = {};
  for (let m = 1; m <= 12; m++) {
    monthlyData[m] = { budgeted: 0, actual: 0 };
  }

  for (const budget of budgets) {
    monthlyData[budget.month].budgeted += Number(budget.budgetedAmount);
    monthlyData[budget.month].actual += Number(budget.actualAmount);
  }

  return {
    year: targetYear,
    months: Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      budgeted: data.budgeted,
      actual: data.actual,
      variance: data.budgeted - data.actual,
    })),
  };
};

// Get dashboard statistics
const getDashboardStats = async () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Transaction counts
  const [poCount, billCount, soCount, invoiceCount] = await Promise.all([
    prisma.transaction.count({ where: { type: "PURCHASE_ORDER" } }),
    prisma.transaction.count({ where: { type: "VENDOR_BILL" } }),
    prisma.transaction.count({ where: { type: "SALES_ORDER" } }),
    prisma.transaction.count({ where: { type: "CUSTOMER_INVOICE" } }),
  ]);

  // Payment totals
  const payments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "POSTED" },
  });

  // Outstanding amounts
  const outstandingBills = await prisma.transaction.aggregate({
    _sum: { totalAmount: true, paidAmount: true },
    where: {
      type: "VENDOR_BILL",
      status: "CONFIRMED",
      paymentStatus: { not: "PAID" },
    },
  });

  const outstandingInvoices = await prisma.transaction.aggregate({
    _sum: { totalAmount: true, paidAmount: true },
    where: {
      type: "CUSTOMER_INVOICE",
      status: "CONFIRMED",
      paymentStatus: { not: "PAID" },
    },
  });

  // Current month budget status
  const currentBudgets = await prisma.budget.aggregate({
    _sum: { budgetedAmount: true, actualAmount: true },
    where: { year: currentYear, month: currentMonth },
  });

  return {
    transactions: {
      purchaseOrders: poCount,
      vendorBills: billCount,
      salesOrders: soCount,
      customerInvoices: invoiceCount,
    },
    payments: {
      totalPosted: Number(payments._sum.amount || 0),
    },
    outstanding: {
      payable:
        Number(outstandingBills._sum.totalAmount || 0) -
        Number(outstandingBills._sum.paidAmount || 0),
      receivable:
        Number(outstandingInvoices._sum.totalAmount || 0) -
        Number(outstandingInvoices._sum.paidAmount || 0),
    },
    budget: {
      month: currentMonth,
      year: currentYear,
      budgeted: Number(currentBudgets._sum.budgetedAmount || 0),
      actual: Number(currentBudgets._sum.actualAmount || 0),
      remaining:
        Number(currentBudgets._sum.budgetedAmount || 0) -
        Number(currentBudgets._sum.actualAmount || 0),
    },
  };
};

// Get recent activities
const getRecentActivities = async (limit = 10) => {
  const [transactions, payments] = await Promise.all([
    prisma.transaction.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { vendor: true, customer: true },
    }),
    prisma.payment.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { contact: true },
    }),
  ]);

  // Merge and sort
  const activities = [
    ...transactions.map((t) => ({
      type: "transaction",
      subtype: t.type,
      number: t.transactionNumber,
      amount: Number(t.totalAmount),
      contact: t.vendor?.name || t.customer?.name,
      status: t.status,
      date: t.createdAt,
    })),
    ...payments.map((p) => ({
      type: "payment",
      subtype: "PAYMENT",
      number: p.paymentNumber,
      amount: Number(p.amount),
      contact: p.contact?.name,
      status: p.status,
      date: p.createdAt,
    })),
  ]
    .sort((a, b) => b.date - a.date)
    .slice(0, limit);

  return activities;
};

module.exports = {
  getBudgetCockpit,
  getYearlyTrend,
  getDashboardStats,
  getRecentActivities,
};
