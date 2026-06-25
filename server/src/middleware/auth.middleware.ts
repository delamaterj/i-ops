import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }

        const token = authHeader.replace(
            "Bearer ",
            ""
        );

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET!
            ) as {
                userId: string;
                role: string;
            };

        req.user = decoded;

        next();

    } catch {
        res.status(401).json({
            error: "Invalid token"
        });
    }
}