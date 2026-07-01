import express from "express";
import {getEventDetails} from "./events.controller";

const router = express.Router();

router.get("/:id", authenticate, getEventDetails);

export default router;