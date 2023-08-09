const { genSalt, hash, compare } = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createJwtToken = (user, valid) => {
  return jwt.sign({ user, valid }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const passwordHash = async (password) => {
  const salt = await genSalt(10);
  const hashedPassword = await hash(password, salt);
  return hashedPassword;
};

const comparePasswords = async (password, passwordHash) =>
  await compare(password, passwordHash);

module.exports = { createJwtToken, passwordHash, comparePasswords };
