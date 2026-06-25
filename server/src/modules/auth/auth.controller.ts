import { Request, Response } from "express";
import { registerUser, loginUser } from "./auth.service";

export async function register(req: Request, res: Response) {
    try {
        const user = await registerUser(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const result = await loginUser(req.body);
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: "Invalid credentials" });
    }
}