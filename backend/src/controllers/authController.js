import { asyncHandler } from "../middleware/errorHandler.js";
import { loginUser, logoutUser, refreshToken, registerUser } from "../services/authService.js";
import { loginSchema, registerSchema, validateData } from "../utils/validation.js";

export const register = asyncHandler(async (req, res) => {
  const validation = validateData(registerSchema, req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: validation.errors
    });
  }

  const result = await registerUser(validation.data);

  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const validation = validateData(loginSchema, req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: validation.errors
    });
  }

  try {
    const { username, password } = validation.data;
    const result = await loginUser(username, password);

    res.json(result);
  } catch (error) {
    // Handle account deactivation specifically
    if (error.code === "ACCOUNT_DEACTIVATED") {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: "ACCOUNT_DEACTIVATED"
      });
    }

    // Handle other login errors (invalid credentials, etc.)
    return res.status(401).json({
      success: false,
      error: error.message || "Login failed"
    });
  }
});

export const logout = asyncHandler(async (req, res) => {
  const result = await logoutUser(req.user);
  res.json(result);
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await refreshToken(req.user);
  res.json(result);
});

export const verifyToken = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    user: req.user
  });
});
