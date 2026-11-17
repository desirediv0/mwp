import express from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import * as w from "../controllers/wholesale.controller.js";

// partner side (/api/wholesale)
export const publicRouter = express.Router();
publicRouter.post("/login", w.loginLimiter, w.login);
publicRouter.post("/logout", w.logout);
publicRouter.get("/me", w.requirePartner, w.me);
publicRouter.get("/catalog", w.requirePartner, w.catalog);
publicRouter.get("/orders", w.requirePartner, w.myOrders);
publicRouter.post("/orders", w.requirePartner, w.orderLimiter, w.createOrder);

// admin side (/api/admin/wholesale)
export const adminRouter = express.Router();
adminRouter.get("/products", isAdmin, w.adminProducts);
adminRouter.put("/products/:id", isAdmin, w.adminSaveProduct);
adminRouter.get("/partners", isAdmin, w.adminPartners);
adminRouter.post("/partners", isAdmin, w.adminCreatePartner);
adminRouter.post("/partners/:id/:action(approve|reject|suspend|reset-code)", isAdmin, w.adminPartnerAction);
adminRouter.patch("/partners/:id", isAdmin, w.adminPartnerNote);
adminRouter.get("/partners/:id/certificate", isAdmin, w.adminCertificate);
adminRouter.get("/orders", isAdmin, w.adminOrders);
adminRouter.patch("/orders/:id", isAdmin, w.adminUpdateOrder);
