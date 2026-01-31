const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Get all users
async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      loginId: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return users;
}

// Get user by ID
async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      loginId: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  if (!user) throw new Error("User not found");
  return user;
}

// Create user (admin function)
async function createUser(userData) {
  const { name, loginId, email, password, role = "portal" } = userData;

  // Validate loginId length
  if (loginId.length < 6 || loginId.length > 12) {
    throw new Error("Login ID must be between 6-12 characters");
  }

  // Validate password
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error(
      "Password must be at least 8 characters with lowercase, uppercase, and special character",
    );
  }

  // Check if loginId already exists
  const existingLoginId = await prisma.user.findUnique({
    where: { loginId },
  });
  if (existingLoginId) {
    throw new Error("Login ID already exists");
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      loginId,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      loginId: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
}

// Update user
async function updateUser(id, userData) {
  const { name, loginId, email, password, role, isActive } = userData;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  });
  if (!existingUser) throw new Error("User not found");

  // Validate loginId if changed
  if (loginId && loginId !== existingUser.loginId) {
    if (loginId.length < 6 || loginId.length > 12) {
      throw new Error("Login ID must be between 6-12 characters");
    }
    const existingLoginId = await prisma.user.findUnique({
      where: { loginId },
    });
    if (existingLoginId) {
      throw new Error("Login ID already exists");
    }
  }

  // Validate email if changed
  if (email && email !== existingUser.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new Error("Email already registered");
    }
  }

  // Prepare update data
  const updateData = {};
  if (name) updateData.name = name;
  if (loginId) updateData.loginId = loginId;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Hash password if provided
  if (password) {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error(
        "Password must be at least 8 characters with lowercase, uppercase, and special character",
      );
    }
    updateData.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      name: true,
      loginId: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
}

// Delete user
async function deleteUser(id) {
  const existingUser = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  });
  if (!existingUser) throw new Error("User not found");

  await prisma.user.delete({
    where: { id: parseInt(id) },
  });

  return { message: "User deleted successfully" };
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
