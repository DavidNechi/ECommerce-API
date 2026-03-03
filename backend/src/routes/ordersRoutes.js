const express = require("express");
const pool = require("../../model/db");
const { isAuthenticated, requireSameUser, requireOwnedOrder } = require("../middleware/auth");

const router = express.Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, user_id, status, total_amount, created_at FROM orders WHERE user_id = $1 ORDER BY id DESC",
      [req.user.id]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

router.get("/users/:userId", isAuthenticated, requireSameUser("userId"), async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, user_id, status, total_amount, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [req.params.userId]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

router.get("/:id", isAuthenticated, requireOwnedOrder("id"), async (req, res) => {
  try {
    const itemsResult = await pool.query(
      `SELECT op.product_id, p.name, op.quantity, op.unit_price
       FROM order_products op
       JOIN products p ON p.id = op.product_id
       WHERE op.order_id = $1
       ORDER BY op.id`,
      [req.order.id]
    );

    return res.status(200).json({
      order: req.order,
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

router.post("/", isAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, total_amount, items } = req.body;
    const userId = req.user.id; // never trust user_id from client

    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, status, total_amount, created_at`,
      [userId, status || "pending", total_amount || 0]
    );

    const order = orderResult.rows[0];

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await client.query(
          `INSERT INTO order_products (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, item.unit_price]
        );
      }
    }

    await client.query("COMMIT");
    return res.status(201).json(order);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({ error: "server error" });
  } finally {
    client.release();
  }
});

router.put("/:id/status", isAuthenticated, requireOwnedOrder("id"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, user_id, status, total_amount, created_at`,
      [status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "order not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});


router.delete("/:id", isAuthenticated, requireOwnedOrder("id"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "order not found" });
    }

    return res.status(200).json({ message: "order deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
