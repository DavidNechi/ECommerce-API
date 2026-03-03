const express = require("express");
const pool = require("../../model/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, price, stock_quantity FROM products");
    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, name, price, stock_quantity FROM products WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "product not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, price, stock_quantity } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, price, stock_quantity)
            VALUES ($1, $2, $3)
            RETURNING id, name, price, stock_quantity`,
      [name, price, stock_quantity]
    );

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock_quantity } = req.body;

    const result = await pool.query(
      `UPDATE products
            SET name = $1, price = $2, stock_quantity = $3
            WHERE id = $4
            RETURNING id, name, price, stock_quantity`,
      [name, price, stock_quantity, id]
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

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "product not found" });
    }

    return res.status(200).json({ message: "product deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
