const prisma = require("../lib/prisma");

// Get all products
const getAll = async (filters = {}) => {
  const { search, isActive } = filters;
  const where = {};

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }
  if (search) {
    where.OR = [{ name: { contains: search, mode: "insensitive" } }];
  }

  return prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });
};

// Get product by ID
const getById = async (id) => {
  return prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: { category: true },
  });
};

// Create product
const create = async (data) => {
  return prisma.product.create({
    data,
    include: { category: true },
  });
};

// Update product
const update = async (id, data) => {
  return prisma.product.update({
    where: { id: parseInt(id) },
    data,
    include: { category: true },
  });
};

// Delete (soft delete)
const remove = async (id) => {
  return prisma.product.update({
    where: { id: parseInt(id) },
    data: { isActive: false },
  });
};

module.exports = { getAll, getById, create, update, remove };
