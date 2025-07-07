import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "./logger.js";

export const hashPassword = async password => {
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    logger.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error("Error comparing passwords:", error);
    throw new Error("Failed to compare passwords");
  }
};

export const extractToken = authHeader => {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

export const generateToken = payload => {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      issuer: process.env.JWT_ISSUER || "inventory-app",
      audience: process.env.JWT_AUDIENCE || "inventory-users"
    });
    return token;
  } catch (error) {
    logger.error("Error generating token:", error);
    throw new Error("Failed to generate token");
  }
};

export const verifyToken = token => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", {
      issuer: process.env.JWT_ISSUER || "inventory-app",
      audience: process.env.JWT_AUDIENCE || "inventory-users"
    });
    return decoded;
  } catch (error) {
    logger.error("Error verifying token:", error);

    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }

    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }

    throw new Error("Token verification failed");
  }
};
