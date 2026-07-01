import express from "express";
import {getEventDetails} from "./events.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = express.Router();

router.get("/:id", authenticate, getEventDetails);

export default router;