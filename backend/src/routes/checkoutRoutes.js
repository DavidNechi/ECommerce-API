const express = require("express");
const pool = require("../../model/db");
const { isAuthenticated, requireSameUser } = require("../middleware/auth");

const router = express.Router();

router.post("/:userId", isAuthenticated, requireSameUser("userId"), async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId } = req.params;

    await client.query("BEGIN");

    const cartResult = await client.query("SELECT id FROM carts WHERE user_id = $1", [userId]);

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "cart not found" });
    }

    const cartId = cartResult.rows[0].id;

    const itemsResult = await client.query(
      `SELECT product_id, quantity, unit_price
       FROM cart_products
       WHERE cart_id = $1`,
      [cartId]
    );

    if (itemsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "cart is empty" });
    }

    let totalAmount = 0;

    for (const item of itemsResult.rows) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "invalid quantity in cart" });
      }

      totalAmount += Number(item.unit_price) * quantity;
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_amount)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, status, total_amount, created_at`,
      [userId, "placed", totalAmount]
    );

    const order = orderResult.rows[0];



    for (const item of itemsResult.rows) {
      const quantity = Number(item.quantity);

      const stockUpdateResult = await client.query(
        `UPDATE products
        SET stock_quantity = stock_quantity - $1
        WHERE id = $2 AND stock_quantity >= $1
        RETURNING id`,
        [quantity, item.product_id]
      );

      if (stockUpdateResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `insufficient stock for product ${item.product_id}` });
      }

      await client.query(
        `INSERT INTO order_products (order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, quantity, item.unit_price]
      );
    }


    await client.query("DELETE FROM cart_products WHERE cart_id = $1", [cartId]);

    await client.query("COMMIT");

    return res.status(201).json({
      message: "checkout successful",
      order,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) { }
    console.error("checkout error:", error);
    return res.status(500).json({
      error: "server error",
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
