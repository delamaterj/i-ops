import express from "express";
import { getEventDetails, createEvent } from "./events.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = express.Router();

router.get("/:id", authenticate, getEventDetails);
router.post("/", authenticate, createEvent);

export default router;