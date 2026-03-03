const express = require("express");
const pool = require("../../model/db");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

router.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, time: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Failed to connect to DB" });
  }
});

module.exports = router;
