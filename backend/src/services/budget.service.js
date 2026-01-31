const prisma = require("../lib/prisma");

// Get achieved amounts for a single budget
// Compute for all non-DRAFT budgets (CONFIRMED, REVISED, ARCHIVED)
const computeAchievedForBudget = async (budget) => {
  if (!budget || budget.status === "DRAFT") {
    return budget;
  }

  const achieved = {};

  for (const line of budget.lines) {
    const transactionLines = await prisma.transactionLine.findMany({
      where: {
        analyticalAccountId: line.analyticalAccountId,
        transaction: {
          status: "CONFIRMED",
          transactionDate: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
          type:
            line.type === "INCOME"
              ? { in: ["SALES_ORDER", "CUSTOMER_INVOICE"] }
              : { in: ["PURCHASE_ORDER", "VENDOR_BILL"] },
        },
      },
      select: {
        lineTotal: true,
      },
    });

    achieved[line.id] = transactionLines.reduce(
      (sum, tl) => sum + Number(tl.lineTotal),
      0,
    );
  }

  return {
    ...budget,
    lines: budget.lines.map((line) => {
      const budgeted = Number(line.budgetedAmount);
      const achievedAmount = achieved[line.id] || 0;
      const achievedPercent =
        budgeted > 0 ? (achievedAmount / budgeted) * 100 : 0;
      const amountToAchieve = budgeted - achievedAmount;

      return {
        ...line,
        budgetedAmount: budgeted,
        achievedAmount,
        achievedPercent: achievedPercent.toFixed(2),
        amountToAchieve,
      };
    }),
  };
};

// Get all budgets with optional status filter (includes achieved amounts for confirmed budgets)
const getAll = async (filters = {}) => {
  const { status } = filters;
  const where = {};

  if (status) where.status = status;

  const budgets = await prisma.budgetMaster.findMany({
    where,
    include: {
      lines: {
        include: {
          analyticalAccount: true,
        },
      },
      revisedFrom: {
        select: { id: true, name: true },
      },
      revisedTo: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute achieved amounts for all non-DRAFT budgets
  const budgetsWithAchieved = await Promise.all(
    budgets.map(async (budget) => {
      if (budget.status !== "DRAFT") {
        return computeAchievedForBudget(budget);
      }
      return budget;
    }),
  );

  return budgetsWithAchieved;
};

// Get by ID with full details (includes achieved amounts for non-DRAFT budgets)
const getById = async (id) => {
  const budget = await prisma.budgetMaster.findUnique({
    where: { id: parseInt(id) },
    include: {
      lines: {
        include: {
          analyticalAccount: true,
        },
      },
      revisedFrom: {
        select: { id: true, name: true },
      },
      revisedTo: {
        select: { id: true, name: true },
      },
    },
  });

  if (!budget) return null;

  // Compute achieved amounts for non-DRAFT budgets
  return computeAchievedForBudget(budget);
};

// Create budget with lines
const create = async (data) => {
  const { name, startDate, endDate, lines } = data;

  return prisma.budgetMaster.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "DRAFT",
      lines: {
        create: lines.map((line) => ({
          analyticalAccountId: parseInt(line.analyticalAccountId),
          type: line.type,
          budgetedAmount: parseFloat(line.budgetedAmount) || 0,
        })),
      },
    },
    include: {
      lines: {
        include: {
          analyticalAccount: true,
        },
      },
    },
  });
};

// Update budget
const update = async (id, data) => {
  const { name, startDate, endDate, lines } = data;

  // First, delete existing lines
  await prisma.budgetLine.deleteMany({
    where: { budgetId: parseInt(id) },
  });

  // Then update master and create new lines
  return prisma.budgetMaster.update({
    where: { id: parseInt(id) },
    data: {
      name,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      lines: lines
        ? {
            create: lines.map((line) => ({
              analyticalAccountId: parseInt(line.analyticalAccountId),
              type: line.type,
              budgetedAmount: parseFloat(line.budgetedAmount) || 0,
            })),
          }
        : undefined,
    },
    include: {
      lines: {
        include: {
          analyticalAccount: true,
        },
      },
    },
  });
};

// Confirm budget
const confirm = async (id) => {
  const budget = await prisma.budgetMaster.update({
    where: { id: parseInt(id) },
    data: { status: "CONFIRMED" },
    include: {
      lines: {
        include: {
          analyticalAccount: true,
        },
      },
    },
  });

  // Return with computed achieved amounts
  return computeAchievedForBudget(budget);
};

// Revise budget - creates a new budget linked to the original
const revise = async (id) => {
  const original = await prisma.budgetMaster.findUnique({
    where: { id: parseInt(id) },
    include: { lines: true },
  });

  if (!original) throw new Error("Budget not found");
  if (original.status !== "CONFIRMED")
    throw new Error("Only confirmed budgets can be revised");

  // Format revision name: "Original Name (Rev DD MM YYYY)"
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const revisionDate = `${day} ${month} ${year}`;

  // Remove any existing "(Revised)" or "(Rev...)" suffix from original name
  const baseName = original.name
    .replace(/\s*\(Rev.*\)$/i, "")
    .replace(/\s*\(Revised\)$/i, "");
  const revisedName = `${baseName} (Rev ${revisionDate})`;

  // Create new budget as a revision
  const revised = await prisma.budgetMaster.create({
    data: {
      name: revisedName,
      startDate: original.startDate,
      endDate: original.endDate,
      status: "DRAFT",
      revisedFromId: original.id,
      lines: {
        create: original.lines.map((line) => ({
          analyticalAccountId: line.analyticalAccountId,
          type: line.type,
          budgetedAmount: line.budgetedAmount,
        })),
      },
    },
    include: {
      lines: {
        include: {
          analyticalAccount: true,
        },
      },
      revisedFrom: {
        select: { id: true, name: true },
      },
    },
  });

  // Update original budget status to REVISED
  await prisma.budgetMaster.update({
    where: { id: parseInt(id) },
    data: { status: "REVISED" },
  });

  return revised;
};

// Archive budget
const archive = async (id) => {
  return prisma.budgetMaster.update({
    where: { id: parseInt(id) },
    data: { status: "ARCHIVED" },
  });
};

// Delete budget
const remove = async (id) => {
  return prisma.budgetMaster.delete({ where: { id: parseInt(id) } });
};

// Get budget with computed achieved amounts (for any status, forces computation)
const getWithAchieved = async (id) => {
  const budget = await getById(id);
  if (!budget) return null;

  // Force compute achieved amounts for the detail view
  const achieved = {};

  for (const line of budget.lines) {
    const transactionLines = await prisma.transactionLine.findMany({
      where: {
        analyticalAccountId: line.analyticalAccountId,
        transaction: {
          status: "CONFIRMED",
          transactionDate: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
          type:
            line.type === "INCOME"
              ? { in: ["SALES_ORDER", "CUSTOMER_INVOICE"] }
              : { in: ["PURCHASE_ORDER", "VENDOR_BILL"] },
        },
      },
      select: {
        lineTotal: true,
      },
    });

    achieved[line.id] = transactionLines.reduce(
      (sum, tl) => sum + Number(tl.lineTotal),
      0,
    );
  }

  return {
    ...budget,
    lines: budget.lines.map((line) => {
      const budgeted = Number(line.budgetedAmount);
      const achievedAmount = achieved[line.id] || 0;
      const achievedPercent =
        budgeted > 0 ? (achievedAmount / budgeted) * 100 : 0;
      const amountToAchieve = budgeted - achievedAmount;

      return {
        ...line,
        budgetedAmount: budgeted,
        achievedAmount,
        achievedPercent: achievedPercent.toFixed(2),
        amountToAchieve,
      };
    }),
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  confirm,
  revise,
  archive,
  remove,
  getWithAchieved,
};
