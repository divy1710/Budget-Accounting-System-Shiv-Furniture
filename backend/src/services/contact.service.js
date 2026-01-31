const prisma = require("../lib/prisma");

// Get all contacts with optional filters
const getAll = async (filters = {}) => {
  const { type, search, isActive } = filters;
  const where = {};

  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.contact.findMany({
    where,
    orderBy: { name: "asc" },
  });
};

// Get contact by ID
const getById = async (id) => {
  return prisma.contact.findUnique({
    where: { id: parseInt(id) },
    include: {
      vendorTransactions: { take: 5, orderBy: { createdAt: "desc" } },
      customerTransactions: { take: 5, orderBy: { createdAt: "desc" } },
      payments: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });
};

// Create contact
const create = async (data) => {
  return prisma.contact.create({ data });
};

// Update contact
const update = async (id, data) => {
  return prisma.contact.update({
    where: { id: parseInt(id) },
    data,
  });
};

// Delete (soft delete)
const remove = async (id) => {
  return prisma.contact.update({
    where: { id: parseInt(id) },
    data: { isActive: false },
  });
};

// Get customers only
const getCustomers = async () => {
  return prisma.contact.findMany({
    where: { type: "CUSTOMER", isActive: true },
    orderBy: { name: "asc" },
  });
};

// Get vendors only
const getVendors = async () => {
  return prisma.contact.findMany({
    where: { type: "VENDOR", isActive: true },
    orderBy: { name: "asc" },
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getCustomers,
  getVendors,
};
