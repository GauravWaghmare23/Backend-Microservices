const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const refreshTokenModel = require("../models/refreshToken.model.js");

const generateToken = async (user) => {
  const accessToken = jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  const refreshToken = await crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await refreshTokenModel.create({
    token: refreshToken,
    user: user._id,
    expiresAt: expiresAt,
  });

  return { accessToken, refreshToken };
};

module.exports = generateToken;