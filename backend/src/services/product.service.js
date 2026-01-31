const prisma = require("../lib/prisma");

// Get all products
const getAll = async (filters = {}) => {
  const { search, isActive } = filters;
  const where = {};

  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
  });
};

// Get product by ID
const getById = async (id) => {
  return prisma.product.findUnique({
    where: { id: parseInt(id) },
  });
};

// Create product
const create = async (data) => {
  return prisma.product.create({ data });
};

// Update product
const update = async (id, data) => {
  return prisma.product.update({
    where: { id: parseInt(id) },
    data,
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
