import {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
} from "../services/authService.js";
import { validateData, registerSchema, loginSchema, } from "../utils/validation.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const register = asyncHandler(async (req, res) => {
  const validation = validateData(registerSchema, req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: validation.errors,
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
      details: validation.errors,
    });
  }

  const { email, password } = validation.data;
  const result = await loginUser(email, password);

  res.json(result);
});

export const logout = asyncHandler(async (req, res) => {
  const result = await logoutUser(req.user);
  res.json(result);
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
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
    user: req.user,
  });
});
