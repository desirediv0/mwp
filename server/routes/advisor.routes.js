import express from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
  advisorLimiter,
  getConfig,
  getHistory,
  chat,
  adminGetSettings,
  adminSaveSettings,
  adminTest,
  adminDefaultPrompt,
  adminListConversations,
  adminGetConversation,
  adminMarkReviewed,
  adminDeleteConversation,
} from "../controllers/advisor.controller.js";

export const publicRouter = express.Router();
publicRouter.get("/config", getConfig);
publicRouter.get("/history", getHistory);
publicRouter.post("/chat", advisorLimiter, chat);

export const adminRouter = express.Router();
adminRouter.get("/settings", isAdmin, adminGetSettings);
adminRouter.put("/settings", isAdmin, adminSaveSettings);
adminRouter.post("/test", isAdmin, adminTest);
adminRouter.get("/default-prompt", isAdmin, adminDefaultPrompt);
adminRouter.get("/conversations", isAdmin, adminListConversations);
adminRouter.get("/conversations/:id", isAdmin, adminGetConversation);
adminRouter.patch("/conversations/:id", isAdmin, adminMarkReviewed);
adminRouter.delete("/conversations/:id", isAdmin, adminDeleteConversation);
