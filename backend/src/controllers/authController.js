const authService = require("../services/authService");

// Login
async function login(req, res) {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res
        .status(400)
        .json({ error: "Login ID and password are required" });
    }

    const result = await authService.login(loginId, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

// Signup
async function signup(req, res) {
  try {
    const { name, loginId, email, password } = req.body;

    if (!name || !loginId || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await authService.signup({
      name,
      loginId,
      email,
      password,
      role: "portal", // Customer signup always creates portal user
    });

    res.status(201).json({ message: "Account created successfully", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Verify token
async function verifyToken(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = authService.verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

module.exports = {
  login,
  signup,
  verifyToken,
};
