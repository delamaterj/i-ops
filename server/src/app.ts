import express from "express";
import pool from "./config/db";
import authRoutes from "./modules/auth/auth.routes";

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);

app.get("/health", (_, res) => {
    res.json({
        status: "ok"
    });
});

app.get("/health/db", async (_, res) => {
    try {
        const result = await pool.query(
            "SELECT NOW()"
        );

        res.json({
            status: "connected",
            time: result.rows[0]
        });

    } catch {
        res.status(500).json({
            status: "failed"
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});