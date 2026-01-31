const prisma = require("../lib/prisma");
const transactionService = require("./transaction.service");

// Generate payment number
const generateNumber = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const prefix = `PAY-${year}${month}`;

  const count = await prisma.payment.count({
    where: { paymentNumber: { startsWith: prefix } },
  });

  return `${prefix}-${(count + 1).toString().padStart(4, "0")}`;
};

// Get all payments
const getAll = async (filters = {}) => {
  const { contactId, status, fromDate, toDate } = filters;
  const where = {};

  if (contactId) where.contactId = parseInt(contactId);
  if (status) where.status = status;
  if (fromDate || toDate) {
    where.paymentDate = {};
    if (fromDate) where.paymentDate.gte = new Date(fromDate);
    if (toDate) where.paymentDate.lte = new Date(toDate);
  }

  return prisma.payment.findMany({
    where,
    include: {
      contact: true,
      allocations: { include: { transaction: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// Get by ID
const getById = async (id) => {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      contact: true,
      allocations: { include: { transaction: true } },
    },
  });
};

// Create payment with allocations
const create = async (data) => {
  const paymentNumber = await generateNumber();
  const amount = parseFloat(data.amount);

  // Validate allocations total
  if (data.allocations && data.allocations.length > 0) {
    const allocationsTotal = data.allocations.reduce(
      (sum, a) => sum + parseFloat(a.allocatedAmount),
      0,
    );
    if (allocationsTotal > amount) {
      throw new Error("Allocations total cannot exceed payment amount");
    }
  }

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      paymentNumber,
      contactId: parseInt(data.contactId),
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      amount,
      paymentMethod: data.paymentMethod || "BANK_TRANSFER",
      reference: data.reference,
      notes: data.notes,
      allocations: data.allocations
        ? {
            create: data.allocations.map((a) => ({
              transactionId: parseInt(a.transactionId),
              allocatedAmount: parseFloat(a.allocatedAmount),
            })),
          }
        : undefined,
    },
    include: {
      contact: true,
      allocations: { include: { transaction: true } },
    },
  });

  // Update payment status for each allocated transaction
  if (data.allocations) {
    for (const allocation of data.allocations) {
      await transactionService.updatePaymentStatus(
        parseInt(allocation.transactionId),
      );
    }
  }

  return payment;
};

// Update payment
const update = async (id, data) => {
  const oldPayment = await prisma.payment.findUnique({
    where: { id },
    include: { allocations: true },
  });

  if (oldPayment.status === "VOIDED") {
    throw new Error("Cannot update voided payment");
  }

  // Store old allocation transaction IDs
  const oldTransactionIds = oldPayment.allocations.map((a) => a.transactionId);

  // Delete old allocations
  await prisma.paymentAllocation.deleteMany({ where: { paymentId: id } });

  const amount = parseFloat(data.amount);

  // Validate new allocations
  if (data.allocations && data.allocations.length > 0) {
    const allocationsTotal = data.allocations.reduce(
      (sum, a) => sum + parseFloat(a.allocatedAmount),
      0,
    );
    if (allocationsTotal > amount) {
      throw new Error("Allocations total cannot exceed payment amount");
    }
  }

  // Update payment
  const payment = await prisma.payment.update({
    where: { id },
    data: {
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      amount,
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      notes: data.notes,
      allocations: data.allocations
        ? {
            create: data.allocations.map((a) => ({
              transactionId: parseInt(a.transactionId),
              allocatedAmount: parseFloat(a.allocatedAmount),
            })),
          }
        : undefined,
    },
    include: {
      contact: true,
      allocations: { include: { transaction: true } },
    },
  });

  // Update payment status for old transactions
  for (const txnId of oldTransactionIds) {
    await transactionService.updatePaymentStatus(txnId);
  }

  // Update payment status for new allocations
  if (data.allocations) {
    for (const allocation of data.allocations) {
      await transactionService.updatePaymentStatus(
        parseInt(allocation.transactionId),
      );
    }
  }

  return payment;
};

// Void payment
const voidPayment = async (id) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { allocations: true },
  });

  if (payment.status === "VOIDED") {
    throw new Error("Payment already voided");
  }

  // Store transaction IDs
  const transactionIds = payment.allocations.map((a) => a.transactionId);

  // Delete allocations and void payment
  await prisma.paymentAllocation.deleteMany({ where: { paymentId: id } });

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: { status: "VOIDED" },
    include: { contact: true },
  });

  // Update payment status for affected transactions
  for (const txnId of transactionIds) {
    await transactionService.updatePaymentStatus(txnId);
  }

  return updatedPayment;
};

// Get outstanding transactions for a contact
const getOutstandingTransactions = async (contactId) => {
  const contact = await prisma.contact.findUnique({
    where: { id: parseInt(contactId) },
  });

  const transactionTypes =
    contact.type === "VENDOR" ? ["VENDOR_BILL"] : ["CUSTOMER_INVOICE"];

  return prisma.transaction.findMany({
    where: {
      OR: [
        { vendorId: parseInt(contactId) },
        { customerId: parseInt(contactId) },
      ],
      type: { in: transactionTypes },
      status: "CONFIRMED",
      paymentStatus: { in: ["NOT_PAID", "PARTIALLY_PAID"] },
    },
    include: {
      lines: { include: { product: true } },
      paymentAllocations: true,
    },
    orderBy: { transactionDate: "asc" },
  });
};

// Delete payment (only draft)
const remove = async (id) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { allocations: true },
  });

  if (payment.status !== "POSTED") {
    // Delete allocations first
    await prisma.paymentAllocation.deleteMany({ where: { paymentId: id } });

    // Update transaction payment status
    for (const allocation of payment.allocations) {
      await transactionService.updatePaymentStatus(allocation.transactionId);
    }

    return prisma.payment.delete({ where: { id } });
  }

  throw new Error("Cannot delete posted payment. Void it instead.");
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  voidPayment,
  remove,
  getOutstandingTransactions,
  generateNumber,
};
