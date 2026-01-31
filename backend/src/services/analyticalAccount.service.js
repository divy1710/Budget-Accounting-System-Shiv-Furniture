const prisma = require("../lib/prisma");

// Get all analytical accounts
const getAll = async (filters = {}) => {
  const { search, isActive, parentId } = filters;
  const where = {};

  if (isActive !== undefined) where.isActive = isActive;
  if (parentId !== undefined)
    where.parentId = parentId === "null" ? null : parseInt(parentId);
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.analyticalAccount.findMany({
    where,
    include: { parent: true, children: true },
    orderBy: { code: "asc" },
  });
};

// Get hierarchical tree
const getTree = async () => {
  return prisma.analyticalAccount.findMany({
    where: { parentId: null, isActive: true },
    include: {
      children: {
        where: { isActive: true },
        include: { children: { where: { isActive: true } } },
      },
    },
    orderBy: { code: "asc" },
  });
};

// Get by ID
const getById = async (id) => {
  return prisma.analyticalAccount.findUnique({
    where: { id: parseInt(id) },
    include: {
      parent: true,
      children: true,
      budgets: { take: 12, orderBy: { year: "desc" } },
    },
  });
};

// Create
const create = async (data) => {
  return prisma.analyticalAccount.create({
    data: {
      ...data,
      parentId: data.parentId ? parseInt(data.parentId) : null,
    },
  });
};

// Update
const update = async (id, data) => {
  return prisma.analyticalAccount.update({
    where: { id: parseInt(id) },
    data: {
      ...data,
      parentId: data.parentId ? parseInt(data.parentId) : null,
    },
  });
};

// Delete (soft delete)
const remove = async (id) => {
  return prisma.analyticalAccount.update({
    where: { id: parseInt(id) },
    data: { isActive: false },
  });
};

module.exports = { getAll, getTree, getById, create, update, remove };
