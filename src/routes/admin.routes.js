import { Router } from "express";
import {
  checkAdminSetup,
  setupAdminUser,
  adminLogin,
  getAdminStats,
  getAllInquiries,
  updateInquiry,
  deleteInquiry,
  getAllAMCRequests,
  updateAMCRequest,
  deleteAMCRequest,
} from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/admin-auth.js";

const router = Router();

// Auth & Setup Routes (Publicly accessible for initial setup / login)
router.get("/check-setup", checkAdminSetup);
router.post("/setup", setupAdminUser);
router.post("/login", adminLogin);

// Everything below this point requires an authenticated admin token with role === 'admin'
router.use(requireAdmin);

// Dashboard Overview & Stats
router.get("/stats", getAdminStats);

// Inquiries Management
router.get("/inquiries", getAllInquiries);
router.patch("/inquiries/:id", updateInquiry);
router.delete("/inquiries/:id", deleteInquiry);

// AMC Management
router.get("/amc", getAllAMCRequests);
router.patch("/amc/:id", updateAMCRequest);
router.delete("/amc/:id", deleteAMCRequest);

export default router;
