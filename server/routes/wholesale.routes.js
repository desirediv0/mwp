import express from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import * as w from "../controllers/wholesale.controller.js";

// buyer side (/api/wholesale): private link, no code; signing in is optional (guests can buy too)
export const publicRouter = express.Router();
publicRouter.get("/catalog", w.catalogLimiter, w.catalog);
publicRouter.post("/checkout", w.checkoutLimiter, w.checkout);
publicRouter.post("/confirm", w.checkoutLimiter, w.confirm);
publicRouter.get("/orders", w.catalogLimiter, w.myOrders);

// admin side (/api/admin/wholesale)
export const adminRouter = express.Router();
adminRouter.get("/settings", isAdmin, w.adminGetSettings);
adminRouter.put("/settings", isAdmin, w.adminSaveSettings);
adminRouter.get("/products", isAdmin, w.adminProducts);
adminRouter.put("/products/:id", isAdmin, w.adminSaveProduct);
adminRouter.get("/orders", isAdmin, w.adminOrders);
adminRouter.patch("/orders/:id", isAdmin, w.adminUpdateOrder);
adminRouter.post("/orders/:id/refund", isAdmin, w.adminRefundOrder);
