const express = require("express");
const router = express.Router();

const { pool } = require("../config/db");

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const [rows] = await pool.execute(
            `SELECT id, username, role
             FROM users
             WHERE username = ? AND password = ?
             LIMIT 1`,
            [username, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            user: rows[0]
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
});

module.exports = router;