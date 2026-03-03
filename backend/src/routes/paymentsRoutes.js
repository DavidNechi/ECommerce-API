const express = require("express");
const pool = require("../../model/db");
const Stripe = require("stripe");
const { isAuthenticated, requireSameUser } = require("../middleware/auth");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_KEY);

router.post("/create-intent/:userId", isAuthenticated, requireSameUser("userId"), async (req, res) => {
  try {
    const { userId } = req.params;

    const itemResult = await pool.query(
      "SELECT cp.quantity, cp.unit_price FROM carts c JOIN cart_products cp ON cp.cart_id = c.id WHERE c.user_id = $1",
      [userId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(400).json({ error: "cart is empty" });
    }

    const amount = itemResult.rows.reduce((total, item) => {
      return total + item.quantity * item.unit_price;
    }, 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { userId: String(userId) },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
