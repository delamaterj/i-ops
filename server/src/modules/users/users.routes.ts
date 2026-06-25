import express from "express";
import {
    authenticate
} from "../../middleware/auth.middleware";

const router = express.Router();

router.get(
    "/me",
    authenticate,
    (req, res) => {
        res.json({
            user: req.user
        });
    }
);

export default router;