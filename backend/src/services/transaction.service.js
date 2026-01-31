const prisma = require("../lib/prisma");
const autoAnalyticalService = require("./autoAnalytical.service");

// Generate transaction number
const generateNumber = async (type) => {
  const prefixes = {
    PURCHASE_ORDER: "PO",
    VENDOR_BILL: "BILL",
    SALES_ORDER: "SO",
    CUSTOMER_INVOICE: "INV",
  };
  const prefix = prefixes[type] || "TXN";
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");

  const count = await prisma.transaction.count({
    where: {
      type,
      transactionNumber: { startsWith: `${prefix}-${year}${month}` },
    },
  });

  return `${prefix}-${year}${month}-${(count + 1).toString().padStart(4, "0")}`;
};

// Get all transactions
const getAll = async (filters = {}) => {
  const { type, status, vendorId, customerId } = filters;
  const where = {};

  if (type) where.type = type;
  if (status) where.status = status;
  if (vendorId) where.vendorId = parseInt(vendorId);
  if (customerId) where.customerId = parseInt(customerId);

  return prisma.transaction.findMany({
    where,
    include: {
      vendor: true,
      customer: true,
      lines: { include: { product: true, analyticalAccount: true } },
      childTransactions: true,
      parentTransaction: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

// Get by ID
const getById = async (id) => {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      vendor: true,
      customer: true,
      lines: { include: { product: true, analyticalAccount: true } },
      paymentAllocations: { include: { payment: true } },
      childTransactions: true,
      parentTransaction: true,
    },
  });
};

// Create transaction
const create = async (data) => {
  const transactionNumber = await generateNumber(data.type);

  // Calculate line totals and auto-assign analytical accounts
  const lines = await Promise.all(
    data.lines.map(async (line) => {
      const quantity = parseFloat(line.quantity);
      const unitPrice = parseFloat(line.unitPrice);
      const gstRate = parseFloat(line.gstRate || 18);
      const lineTotal = quantity * unitPrice * (1 + gstRate / 100);

      // Auto-assign analytical account if not provided
      let analyticalAccountId = line.analyticalAccountId
        ? parseInt(line.analyticalAccountId)
        : await autoAnalyticalService.findMatch(line.productId);

      return {
        productId: parseInt(line.productId),
        description: line.description,
        quantity,
        unitPrice,
        gstRate,
        lineTotal,
        analyticalAccountId,
      };
    }),
  );

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const taxAmount = lines.reduce(
    (sum, l) => sum + (l.quantity * l.unitPrice * l.gstRate) / 100,
    0,
  );
  const totalAmount = subtotal + taxAmount;

  return prisma.transaction.create({
    data: {
      transactionNumber,
      type: data.type,
      vendorId: data.vendorId ? parseInt(data.vendorId) : null,
      customerId: data.customerId ? parseInt(data.customerId) : null,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      parentId: data.parentId || null,
      reference: data.reference || null,
      notes: data.notes,
      subtotal,
      taxAmount,
      totalAmount,
      lines: { create: lines },
    },
    include: {
      vendor: true,
      customer: true,
      lines: { include: { product: true, analyticalAccount: true } },
    },
  });
};

// Update transaction (only DRAFT)
const update = async (id, data) => {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (transaction.status !== "DRAFT") {
    throw new Error("Can only update DRAFT transactions");
  }

  // Delete existing lines and recreate
  await prisma.transactionLine.deleteMany({ where: { transactionId: id } });

  const lines = await Promise.all(
    data.lines.map(async (line) => {
      const quantity = parseFloat(line.quantity);
      const unitPrice = parseFloat(line.unitPrice);
      const gstRate = parseFloat(line.gstRate || 18);
      const lineTotal = quantity * unitPrice * (1 + gstRate / 100);

      let analyticalAccountId = line.analyticalAccountId
        ? parseInt(line.analyticalAccountId)
        : await autoAnalyticalService.findMatch(line.productId);

      return {
        productId: parseInt(line.productId),
        description: line.description,
        quantity,
        unitPrice,
        gstRate,
        lineTotal,
        analyticalAccountId,
      };
    }),
  );

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const taxAmount = lines.reduce(
    (sum, l) => sum + (l.quantity * l.unitPrice * l.gstRate) / 100,
    0,
  );
  const totalAmount = subtotal + taxAmount;

  return prisma.transaction.update({
    where: { id },
    data: {
      vendorId: data.vendorId ? parseInt(data.vendorId) : null,
      customerId: data.customerId ? parseInt(data.customerId) : null,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes,
      subtotal,
      taxAmount,
      totalAmount,
      lines: { create: lines },
    },
    include: {
      vendor: true,
      customer: true,
      lines: { include: { product: true, analyticalAccount: true } },
    },
  });
};

// Confirm transaction (affects budget)
const confirm = async (id) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (transaction.status !== "DRAFT") {
    throw new Error("Can only confirm DRAFT transactions");
  }

  return prisma.transaction.update({
    where: { id },
    data: { status: "CONFIRMED" },
    include: {
      vendor: true,
      customer: true,
      lines: { include: { product: true, analyticalAccount: true } },
    },
  });
};

// Cancel transaction
const cancel = async (id) => {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (transaction.status === "CANCELLED") {
    throw new Error("Transaction already cancelled");
  }

  return prisma.transaction.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
};

// Delete transaction (only DRAFT)
const remove = async (id) => {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (transaction.status !== "DRAFT") {
    throw new Error("Can only delete DRAFT transactions");
  }

  return prisma.transaction.delete({ where: { id } });
};

// Update payment status
const updatePaymentStatus = async (id) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { paymentAllocations: true },
  });

  const paidAmount = transaction.paymentAllocations.reduce(
    (sum, a) => sum + Number(a.allocatedAmount),
    0,
  );

  let paymentStatus = "NOT_PAID";
  if (paidAmount >= Number(transaction.totalAmount)) {
    paymentStatus = "PAID";
  } else if (paidAmount > 0) {
    paymentStatus = "PARTIALLY_PAID";
  }

  return prisma.transaction.update({
    where: { id },
    data: { paidAmount, paymentStatus },
  });
};

// Create Bill from Purchase Order
const createBillFromPO = async (poId) => {
  const po = await prisma.transaction.findUnique({
    where: { id: poId },
    include: {
      vendor: true,
      lines: { include: { product: true, analyticalAccount: true } },
    },
  });

  if (!po) throw new Error("Purchase Order not found");
  if (po.type !== "PURCHASE_ORDER")
    throw new Error("Transaction is not a Purchase Order");
  if (po.status !== "CONFIRMED")
    throw new Error("Can only create bill from confirmed PO");

  // Check if bill already exists
  const existingBill = await prisma.transaction.findFirst({
    where: { parentId: poId, type: "VENDOR_BILL" },
  });
  if (existingBill) throw new Error("Bill already created from this PO");

  const transactionNumber = await generateNumber("VENDOR_BILL");

  const lines = po.lines.map((line) => ({
    productId: line.productId,
    description: line.description,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    gstRate: Number(line.gstRate),
    lineTotal: Number(line.lineTotal),
    analyticalAccountId: line.analyticalAccountId,
  }));

  return prisma.transaction.create({
    data: {
      transactionNumber,
      type: "VENDOR_BILL",
      vendorId: po.vendorId,
      transactionDate: new Date(),
      parentId: poId,
      reference: po.reference,
      subtotal: Number(po.subtotal),
      taxAmount: Number(po.taxAmount),
      totalAmount: Number(po.totalAmount),
      lines: { create: lines },
    },
    include: {
      vendor: true,
      lines: { include: { product: true, analyticalAccount: true } },
    },
  });
};

// Create Customer Invoice from Sales Order
const createInvoiceFromSO = async (soId) => {
  const so = await prisma.transaction.findUnique({
    where: { id: soId },
    include: {
      customer: true,
      lines: { include: { product: true, analyticalAccount: true } },
    },
  });

  if (!so) throw new Error("Sales Order not found");
  if (so.type !== "SALES_ORDER")
    throw new Error("Transaction is not a Sales Order");
  if (so.status !== "CONFIRMED")
    throw new Error("Can only create invoice from confirmed SO");

  // Check if invoice already exists
  const existingInvoice = await prisma.transaction.findFirst({
    where: { parentId: soId, type: "CUSTOMER_INVOICE" },
  });
  if (existingInvoice) throw new Error("Invoice already created from this SO");

  const transactionNumber = await generateNumber("CUSTOMER_INVOICE");

  const lines = so.lines.map((line) => ({
    productId: line.productId,
    description: line.description,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    gstRate: Number(line.gstRate),
    lineTotal: Number(line.lineTotal),
    analyticalAccountId: line.analyticalAccountId,
  }));

  return prisma.transaction.create({
    data: {
      transactionNumber,
      type: "CUSTOMER_INVOICE",
      customerId: so.customerId,
      transactionDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      parentId: soId,
      reference: so.reference,
      subtotal: Number(so.subtotal),
      taxAmount: Number(so.taxAmount),
      totalAmount: Number(so.totalAmount),
      lines: { create: lines },
    },
    include: {
      customer: true,
      lines: { include: { product: true, analyticalAccount: true } },
    },
  });
};

// Check budget warnings for transaction lines
const checkBudgetWarnings = async (transactionId) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      lines: { include: { analyticalAccount: true } },
    },
  });

  if (!transaction) return [];

  const warnings = [];

  for (const line of transaction.lines) {
    if (!line.analyticalAccountId) continue;

    // Find confirmed budgets that cover the transaction date
    const budgets = await prisma.budgetMaster.findMany({
      where: {
        status: "CONFIRMED",
        startDate: { lte: transaction.transactionDate },
        endDate: { gte: transaction.transactionDate },
      },
      include: {
        lines: {
          where: {
            analyticalAccountId: line.analyticalAccountId,
            type:
              transaction.type.includes("PURCHASE") ||
              transaction.type === "VENDOR_BILL"
                ? "EXPENSE"
                : "INCOME",
          },
        },
      },
    });

    for (const budget of budgets) {
      for (const budgetLine of budget.lines) {
        // Get total achieved for this analytical account in this budget period
        const achievedResult = await prisma.transactionLine.aggregate({
          where: {
            analyticalAccountId: line.analyticalAccountId,
            transaction: {
              status: "CONFIRMED",
              transactionDate: {
                gte: budget.startDate,
                lte: budget.endDate,
              },
              type:
                budgetLine.type === "EXPENSE"
                  ? { in: ["PURCHASE_ORDER", "VENDOR_BILL"] }
                  : { in: ["SALES_ORDER", "CUSTOMER_INVOICE"] },
            },
          },
          _sum: { lineTotal: true },
        });

        const achieved = Number(achievedResult._sum.lineTotal || 0);
        const budgetedAmount = Number(budgetLine.budgetedAmount);
        const remaining = budgetedAmount - achieved;

        // Check if adding this line would exceed budget
        if (Number(line.lineTotal) > remaining) {
          warnings.push({
            lineId: line.id,
            productId: line.productId,
            analyticalAccountId: line.analyticalAccountId,
            analyticalAccountName: line.analyticalAccount?.name,
            lineTotal: Number(line.lineTotal),
            budgetId: budget.id,
            budgetName: budget.name,
            budgetedAmount,
            achieved,
            remaining,
            exceedsBy: Number(line.lineTotal) - remaining,
          });
        }
      }
    }
  }

  return warnings;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  confirm,
  cancel,
  remove,
  updatePaymentStatus,
  generateNumber,
  createBillFromPO,
  createInvoiceFromSO,
  checkBudgetWarnings,
};
