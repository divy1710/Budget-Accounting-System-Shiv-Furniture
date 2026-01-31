const prisma = require("../lib/prisma");

// Get all contacts with optional filters
const getAll = async (filters = {}) => {
  const { type, search, isActive } = filters;
  const where = {};

  if (type) where.type = type;
  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }
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
  // Sanitize and prepare data
  const sanitizedData = {
    name: data.name,
    type: data.type || "CUSTOMER",
    email: data.email || null,
    phone: data.phone || null,
    jobTitle: data.jobTitle || null,
    street: data.street || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || null,
    pincode: data.pincode || null,
    imageUrl: data.imageUrl || null,
    tags: data.tags || null,
  };

  console.log("Creating contact with data:", sanitizedData);

  try {
    const result = await prisma.contact.create({ data: sanitizedData });
    console.log("Contact created successfully:", result.id);
    return result;
  } catch (error) {
    console.error("Prisma create error:", error.message);
    console.error("Error code:", error.code);
    throw error;
  }
};

// Update contact
const update = async (id, data) => {
  // Sanitize data - convert empty strings to null
  const sanitizedData = {};
  if (data.name !== undefined) sanitizedData.name = data.name;
  if (data.type !== undefined) sanitizedData.type = data.type;
  if (data.email !== undefined) sanitizedData.email = data.email || null;
  if (data.phone !== undefined) sanitizedData.phone = data.phone || null;
  if (data.jobTitle !== undefined)
    sanitizedData.jobTitle = data.jobTitle || null;
  if (data.street !== undefined) sanitizedData.street = data.street || null;
  if (data.city !== undefined) sanitizedData.city = data.city || null;
  if (data.state !== undefined) sanitizedData.state = data.state || null;
  if (data.country !== undefined) sanitizedData.country = data.country || null;
  if (data.pincode !== undefined) sanitizedData.pincode = data.pincode || null;
  if (data.imageUrl !== undefined)
    sanitizedData.imageUrl = data.imageUrl || null;
  if (data.tags !== undefined) sanitizedData.tags = data.tags || null;
  if (data.isActive !== undefined) sanitizedData.isActive = data.isActive;

  return prisma.contact.update({
    where: { id: parseInt(id) },
    data: sanitizedData,
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
