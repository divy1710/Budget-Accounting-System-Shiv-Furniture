const prisma = require("../lib/prisma");

// Get all auto analytical models
const getAll = async () => {
  return prisma.autoAnalyticalModel.findMany({
    include: {
      product: true,
      analyticalAccount: true,
      category: true,
      partner: true,
    },
    orderBy: { priority: "desc" },
  });
};

// Get by ID
const getById = async (id) => {
  return prisma.autoAnalyticalModel.findUnique({
    where: { id: parseInt(id) },
    include: {
      product: true,
      analyticalAccount: true,
      category: true,
      partner: true,
    },
  });
};

// Create
const create = async (data) => {
  // Calculate priority based on number of criteria set (more = higher priority)
  let priority = 0;
  if (data.partnerTag) priority++;
  if (data.partnerId) priority++;
  if (data.categoryId) priority++;
  if (data.productId) priority++;

  return prisma.autoAnalyticalModel.create({
    data: {
      name: data.name || null,
      description: data.description,
      status: data.status || "DRAFT",
      partnerTag: data.partnerTag || null,
      partnerId: data.partnerId ? parseInt(data.partnerId) : null,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      productId: data.productId ? parseInt(data.productId) : null,
      analyticalAccountId: parseInt(data.analyticalAccountId),
      priority: priority,
    },
    include: {
      product: true,
      analyticalAccount: true,
      category: true,
      partner: true,
    },
  });
};

// Update
const update = async (id, data) => {
  // Calculate priority based on number of criteria set
  let priority = 0;
  if (data.partnerTag) priority++;
  if (data.partnerId) priority++;
  if (data.categoryId) priority++;
  if (data.productId) priority++;

  return prisma.autoAnalyticalModel.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name || null,
      description: data.description,
      status: data.status,
      partnerTag: data.partnerTag || null,
      partnerId: data.partnerId ? parseInt(data.partnerId) : null,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      productId: data.productId ? parseInt(data.productId) : null,
      analyticalAccountId: data.analyticalAccountId
        ? parseInt(data.analyticalAccountId)
        : undefined,
      priority: priority,
      isActive: data.isActive,
    },
    include: {
      product: true,
      analyticalAccount: true,
      category: true,
      partner: true,
    },
  });
};

// Delete
const remove = async (id) => {
  return prisma.autoAnalyticalModel.delete({ where: { id: parseInt(id) } });
};

// Find matching analytical account based on criteria
const findMatch = async ({ productId, categoryId, partnerId, partnerTag }) => {
  const where = { isActive: true, status: "CONFIRMED" };
  const orConditions = [];

  if (productId) orConditions.push({ productId: parseInt(productId) });
  if (categoryId) orConditions.push({ categoryId: parseInt(categoryId) });
  if (partnerId) orConditions.push({ partnerId: parseInt(partnerId) });
  if (partnerTag) orConditions.push({ partnerTag: partnerTag });

  if (orConditions.length === 0) return null;

  where.OR = orConditions;

  const model = await prisma.autoAnalyticalModel.findFirst({
    where,
    orderBy: { priority: "desc" },
  });

  return model ? model.analyticalAccountId : null;
};

module.exports = { getAll, getById, create, update, remove, findMatch };
