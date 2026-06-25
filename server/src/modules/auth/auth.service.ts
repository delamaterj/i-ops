import bcrypt from "bcrypt";
import pool from "../../config/db";
import jwt from "jsonwebtoken";

export async function registerUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, first_name, last_name, role`,
        [data.email, hashedPassword, data.firstName, data.lastName]
    );

    return result.rows[0];
}

export async function loginUser(data: {
    email: string;
    password: string;
}) {
    const result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [data.email]
    );

    const user = result.rows[0];

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(
        data.password,
        user.password_hash
    );

    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role
        },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role
        }
    };
}