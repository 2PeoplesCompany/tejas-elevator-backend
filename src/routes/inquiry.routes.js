import { Router } from "express";
import { createInquiry } from "../controllers/inquiry.controller.js";

const router = Router();

// Public endpoint: Insert new elevator specification inquiry only
router.post("/", createInquiry);

export default router;
