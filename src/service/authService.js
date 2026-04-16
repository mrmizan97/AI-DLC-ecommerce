const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../model");

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

const authService = {
  async register(data) {
    const user = await User.create(data);
    const token = generateToken(user);
    const userData = user.toJSON();
    delete userData.password;
    return { user: userData, token };
  },

  async login(email, password) {
    const user = await User.scope("withPassword").findOne({ where: { email } });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    if (!user.is_active) {
      return { error: "Account is deactivated" };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { error: "Invalid email or password" };
    }

    const token = generateToken(user);
    const userData = user.toJSON();
    delete userData.password;
    return { user: userData, token };
  },

  async getProfile(userId) {
    return await User.findByPk(userId);
  },
};

module.exports = authService;
