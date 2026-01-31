const prisma = require("../lib/prisma");

// Get all categories
const getAll = async () => {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
};

// Get category by ID
const getById = async (id) => {
  return prisma.category.findUnique({
    where: { id: parseInt(id) },
  });
};

// Create category
const create = async (data) => {
  return prisma.category.create({ data });
};

// Update category
const update = async (id, data) => {
  return prisma.category.update({
    where: { id: parseInt(id) },
    data,
  });
};

// Delete (soft delete)
const remove = async (id) => {
  return prisma.category.update({
    where: { id: parseInt(id) },
    data: { isActive: false },
  });
};

module.exports = { getAll, getById, create, update, remove };
