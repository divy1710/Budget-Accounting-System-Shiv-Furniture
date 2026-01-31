const prisma = require("../lib/prisma");
const budgetService = require("./budget.service");
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
      lines: { include: { product: true } },
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
      parentId: data.parentId ? parseInt(data.parentId) : null,
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

  // Update budget for each line with analytical account
  const year = transaction.transactionDate.getFullYear();
  const month = transaction.transactionDate.getMonth() + 1;

  for (const line of transaction.lines) {
    if (line.analyticalAccountId) {
      await budgetService.updateUsage(
        line.analyticalAccountId,
        year,
        month,
        Number(line.lineTotal),
      );
    }
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
};
