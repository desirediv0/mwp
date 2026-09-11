import express from "express";
import {
  getActiveQuiz,
  submitQuizAnswers,
} from "../controllers/fragrance-quiz.controller.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get active quiz (public - no auth required)
router.get("/", getActiveQuiz);

// Submit quiz answers (auth optional - supports both guest and logged-in users)
router.post("/submit", (req, res, next) => {
  // Try to verify token if present, but don't require it
  const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    verifyJWTToken(req, res, next);
  } else {
    next();
  }
}, submitQuizAnswers);

export default router;
