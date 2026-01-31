const prisma = require("../lib/prisma");

// Get all auto analytical models
const getAll = async () => {
  return prisma.autoAnalyticalModel.findMany({
    include: { product: true, analyticalAccount: true },
    orderBy: { priority: "desc" },
  });
};

// Get by ID
const getById = async (id) => {
  return prisma.autoAnalyticalModel.findUnique({
    where: { id: parseInt(id) },
    include: { product: true, analyticalAccount: true },
  });
};

// Create
const create = async (data) => {
  return prisma.autoAnalyticalModel.create({
    data: {
      name: data.name,
      description: data.description,
      productId: data.productId ? parseInt(data.productId) : null,
      analyticalAccountId: parseInt(data.analyticalAccountId),
      priority: data.priority ? parseInt(data.priority) : 0,
    },
    include: { product: true, analyticalAccount: true },
  });
};

// Update
const update = async (id, data) => {
  return prisma.autoAnalyticalModel.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      description: data.description,
      productId: data.productId ? parseInt(data.productId) : null,
      analyticalAccountId: parseInt(data.analyticalAccountId),
      priority: data.priority ? parseInt(data.priority) : 0,
      isActive: data.isActive,
    },
    include: { product: true, analyticalAccount: true },
  });
};

// Delete
const remove = async (id) => {
  return prisma.autoAnalyticalModel.delete({ where: { id: parseInt(id) } });
};

// Find matching analytical account for a product
const findMatch = async (productId) => {
  const model = await prisma.autoAnalyticalModel.findFirst({
    where: { productId: parseInt(productId), isActive: true },
    orderBy: { priority: "desc" },
  });
  return model ? model.analyticalAccountId : null;
};

module.exports = { getAll, getById, create, update, remove, findMatch };
