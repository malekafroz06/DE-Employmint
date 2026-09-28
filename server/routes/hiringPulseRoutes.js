import express from "express";
import { getHiringPulseStats } from "../controller/hiringPulseController.js";

const router = express.Router();

router.get("/", getHiringPulseStats);

export default router;
