import express from "express";
import {
  getQuizSettings,
  updateQuizSettings,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  createOption,
  updateOption,
  deleteOption,
  getRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRuleStatus,
  getQuizAnalytics,
  getQuizResponses,
} from "../controllers/admin.fragrance-quiz.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
} from "../middlewares/admin.middleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdminJWT);

// ─── Quiz Settings ─────────────────────────────────────────────

router.get(
  "/settings",
  hasPermission("fragrance_quiz", "read"),
  getQuizSettings
);

router.put(
  "/settings",
  hasPermission("fragrance_quiz", "update"),
  updateQuizSettings
);

// ─── Questions ─────────────────────────────────────────────────

router.get(
  "/questions",
  hasPermission("fragrance_quiz", "read"),
  getQuestions
);

router.post(
  "/questions",
  hasPermission("fragrance_quiz", "create"),
  createQuestion
);

// IMPORTANT: reorder MUST be before /:questionId to avoid param capture
router.patch(
  "/questions/reorder",
  hasPermission("fragrance_quiz", "update"),
  reorderQuestions
);

router.put(
  "/questions/:questionId",
  hasPermission("fragrance_quiz", "update"),
  updateQuestion
);

router.delete(
  "/questions/:questionId",
  hasPermission("fragrance_quiz", "delete"),
  deleteQuestion
);

// ─── Options ───────────────────────────────────────────────────

router.post(
  "/questions/:questionId/options",
  hasPermission("fragrance_quiz", "create"),
  createOption
);

router.put(
  "/options/:optionId",
  hasPermission("fragrance_quiz", "update"),
  updateOption
);

router.delete(
  "/options/:optionId",
  hasPermission("fragrance_quiz", "delete"),
  deleteOption
);

// ─── Rules ─────────────────────────────────────────────────────

router.get(
  "/rules",
  hasPermission("fragrance_quiz", "read"),
  getRules
);

router.post(
  "/rules",
  hasPermission("fragrance_quiz", "create"),
  createRule
);

router.put(
  "/rules/:ruleId",
  hasPermission("fragrance_quiz", "update"),
  updateRule
);

router.delete(
  "/rules/:ruleId",
  hasPermission("fragrance_quiz", "delete"),
  deleteRule
);

router.patch(
  "/rules/:ruleId/toggle-status",
  hasPermission("fragrance_quiz", "update"),
  toggleRuleStatus
);

// ─── Analytics & Responses ─────────────────────────────────────

router.get(
  "/analytics",
  hasPermission("fragrance_quiz", "read"),
  getQuizAnalytics
);

router.get(
  "/responses",
  hasPermission("fragrance_quiz", "read"),
  getQuizResponses
);

export default router;
