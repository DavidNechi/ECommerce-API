const express = require("express");
const pool = require("../../model/db");
const { isAuthenticated, requireOwnedOrder,  } = require("../middleware/auth");

const router = express.Router();

router.get("/:id", isAuthenticated, requireOwnedOrder("id"), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, name, email, address, created_at FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Failed to get user by ID" });
  }
});

router.put("/:id", isAuthenticated, requireOwnedOrder("id"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address } = req.body;

    const result = await pool.query(
      `UPDATE users
            SET name = $1, email = $2, address = $3
            WHERE id = $4
            RETURNING id, name, email, address, created_at`,
      [name, email, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "could not perform action" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
});

router.delete("/:id", isAuthenticated, requireOwnedOrder("id"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({ message: "user deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
