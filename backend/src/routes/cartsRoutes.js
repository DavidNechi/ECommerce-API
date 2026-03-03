const express = require("express");
const pool = require("../../model/db");
const { isAuthenticated, requireSameUser } = require("../middleware/auth");

const router = express.Router();

router.get("/:userId", isAuthenticated, requireSameUser("userId"), async (req, res) => {
  try {
    const { userId } = req.params;

    const cartResult = await pool.query("SELECT id, user_id, created_at FROM carts WHERE user_id = $1", [
      userId,
    ]);

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: "cart not found" });
    }

    const cart = cartResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT
            cp.product_id,
            p.name,
            cp.quantity,
            cp.unit_price,
            (cp.quantity * cp.unit_price) AS line_total
            FROM cart_products cp
            JOIN products p ON p.id = cp.product_id
            WHERE cp.cart_id = $1
            ORDER BY cp.id`,
      [cart.id]
    );

    return res.status(200).json({
      cart: {
        id: cart.id,
        user_id: cart.user_id,
        created_at: cart.created_at,
      },
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

router.post("/:userId/items", isAuthenticated, requireSameUser("userId"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { product_id, quantity } = req.body;

    const productResult = await pool.query("SELECT id, price FROM products WHERE id = $1", [product_id]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: "product not found" });
    }

    const unitPrice = productResult.rows[0].price;

    let cartResult = await pool.query("SELECT id FROM carts WHERE user_id = $1", [userId]);

    let cartId;
    if (cartResult.rows.length === 0) {
      const newCart = await pool.query("INSERT INTO carts (user_id) VALUES ($1) RETURNING id", [userId]);
      cartId = newCart.rows[0].id;
    } else {
      cartId = cartResult.rows[0].id;
    }

    const existingItem = await pool.query(
      "SELECT id, quantity FROM cart_products WHERE cart_id = $1 AND product_id = $2",
      [cartId, product_id]
    );

    let result;
    if (existingItem.rows.length > 0) {
      result = await pool.query(
        `UPDATE cart_products
         SET quantity = quantity + $1
         WHERE cart_id = $2 AND product_id = $3
         RETURNING id, cart_id, product_id, quantity, unit_price`,
        [quantity, cartId, product_id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO cart_products (cart_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)
         RETURNING id, cart_id, product_id, quantity, unit_price`,
        [cartId, product_id, quantity, unitPrice]
      );
    }

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

router.put("/:userId/items/:productId", isAuthenticated, requireSameUser("userId"),
  async (req, res) => {
    try {
      const { userId, productId } = req.params;
      const { quantity } = req.body;

      const cartResult = await pool.query("SELECT id FROM carts WHERE user_id = $1", [userId]);

      if (cartResult.rows.length === 0) {
        return res.status(404).json({ error: "cart not found" });
      }

      const cartId = cartResult.rows[0].id;

      const result = await pool.query(
        `UPDATE cart_products
       SET quantity = $1
       WHERE cart_id = $2 AND product_id = $3
       RETURNING id, cart_id, product_id, quantity, unit_price`,
        [quantity, cartId, productId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "cart item not found" });
      }

      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server error" });
    }
  }
);

router.delete("/:userId/items/:productId", isAuthenticated, requireSameUser("userId"),
  async (req, res) => {
    try {
      const { userId, productId } = req.params;

      const cartResult = await pool.query("SELECT id FROM carts WHERE user_id = $1", [userId]);

      if (cartResult.rows.length === 0) {
        return res.status(404).json({ error: "cart not found" });
      }

      const cartId = cartResult.rows[0].id;

      const result = await pool.query(
        `DELETE FROM cart_products
       WHERE cart_id = $1 AND product_id = $2
       RETURNING id`,
        [cartId, productId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "cart item not found" });
      }

      return res.status(200).json({ message: "item removed from cart" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server error" });
    }
  }
);

router.delete("/:userId", isAuthenticated, requireSameUser("userId"), async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query("DELETE FROM carts WHERE user_id = $1 RETURNING id", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "cart not found" });
    }

    return res.status(200).json({ message: "cart deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
