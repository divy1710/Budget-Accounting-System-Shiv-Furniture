const prisma = require("../lib/prisma");

// Get all budgets
const getAll = async (filters = {}) => {
  const { year, month, analyticalAccountId } = filters;
  const where = {};

  if (year) where.year = parseInt(year);
  if (month) where.month = parseInt(month);
  if (analyticalAccountId)
    where.analyticalAccountId = parseInt(analyticalAccountId);

  return prisma.budget.findMany({
    where,
    include: { analyticalAccount: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
};

// Get by ID
const getById = async (id) => {
  return prisma.budget.findUnique({
    where: { id: parseInt(id) },
    include: { analyticalAccount: true },
  });
};

// Create budget
const create = async (data) => {
  return prisma.budget.create({
    data: {
      analyticalAccountId: parseInt(data.analyticalAccountId),
      year: parseInt(data.year),
      month: parseInt(data.month),
      allocatedAmount: parseFloat(data.allocatedAmount),
    },
    include: { analyticalAccount: true },
  });
};

// Update budget
const update = async (id, data) => {
  return prisma.budget.update({
    where: { id: parseInt(id) },
    data: { allocatedAmount: parseFloat(data.allocatedAmount) },
    include: { analyticalAccount: true },
  });
};

// Delete budget
const remove = async (id) => {
  return prisma.budget.delete({ where: { id: parseInt(id) } });
};

// Get budget summary for a period
const getSummary = async (year, month) => {
  const budgets = await prisma.budget.findMany({
    where: { year: parseInt(year), month: parseInt(month) },
    include: { analyticalAccount: true },
  });

  const totalAllocated = budgets.reduce(
    (sum, b) => sum + Number(b.allocatedAmount),
    0,
  );
  const totalUsed = budgets.reduce((sum, b) => sum + Number(b.usedAmount), 0);
  const remaining = totalAllocated - totalUsed;
  const utilizationPercent =
    totalAllocated > 0 ? ((totalUsed / totalAllocated) * 100).toFixed(2) : 0;

  return {
    period: { year: parseInt(year), month: parseInt(month) },
    totalAllocated,
    totalUsed,
    remaining,
    utilizationPercent,
    budgets: budgets.map((b) => ({
      ...b,
      allocatedAmount: Number(b.allocatedAmount),
      usedAmount: Number(b.usedAmount),
      remaining: Number(b.allocatedAmount) - Number(b.usedAmount),
      utilizationPercent:
        Number(b.allocatedAmount) > 0
          ? ((Number(b.usedAmount) / Number(b.allocatedAmount)) * 100).toFixed(
              2,
            )
          : 0,
    })),
  };
};

// Update budget usage (called when transaction is confirmed)
const updateUsage = async (analyticalAccountId, year, month, amount) => {
  const budget = await prisma.budget.findUnique({
    where: {
      analyticalAccountId_year_month: {
        analyticalAccountId: parseInt(analyticalAccountId),
        year: parseInt(year),
        month: parseInt(month),
      },
    },
  });

  if (budget) {
    return prisma.budget.update({
      where: { id: budget.id },
      data: { usedAmount: { increment: parseFloat(amount) } },
    });
  }
  return null;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getSummary,
  updateUsage,
};
