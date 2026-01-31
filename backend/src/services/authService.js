const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "shiv-furniture-secret-key";

// Login
async function login(loginId, password) {
  // Find user by loginId
  const user = await prisma.user.findUnique({
    where: { loginId },
  });

  if (!user) {
    throw new Error("Invalid Login Id or Password");
  }

  if (!user.isActive) {
    throw new Error("Account is inactive. Please contact administrator.");
  }

  // Compare password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new Error("Invalid Login Id or Password");
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, loginId: user.loginId, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" },
  );

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

// Signup (for portal users)
async function signup(userData) {
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

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      loginId,
      email,
      password: hashedPassword,
      role,
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Verify token middleware helper
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

module.exports = {
  login,
  signup,
  verifyToken,
};
