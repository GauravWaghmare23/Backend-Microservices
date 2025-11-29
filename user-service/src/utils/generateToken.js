const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const refreshTokenModel = require("../models/refreshToken.model.js");

const generateAccessToken = (user) => {
  const accessToken = jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  return accessToken;
};

const generateRefreshToken = async (user) => {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await refreshTokenModel.create({
    token: token,
    user: user._id,
    expiresAt: expiresAt,
  });

  return token;
};

module.exports = { generateAccessToken, generateRefreshToken };