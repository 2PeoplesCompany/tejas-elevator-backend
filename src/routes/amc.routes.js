import { Router } from "express";
import { createAMCRequest } from "../controllers/amc.controller.js";

const router = Router();

router.post("/", createAMCRequest);

export default router;
