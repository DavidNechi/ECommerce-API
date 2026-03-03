const express = require("express");
const bcrypt = require("bcrypt");
const { check } = require("express-validator");
const pool = require("../../model/db");
const passport = require("../passport");
const { handleValidation } = require("../middleware/validation");

const router = express.Router();

const registerValidation = [
  check("name").trim().notEmpty().withMessage("name is required"),
  check("email").trim().isEmail().withMessage("valid email is required"),
  check("password")
    .isLength({ min: 8 })
    .withMessage("password must be at least 8 characters"),
];

const loginValidation = [
  check("email").trim().isEmail().withMessage("valid email is required"),
  check("password").notEmpty().withMessage("password is required"),
];

router.post("/register", registerValidation, handleValidation, async (req, res) => {
  try {
    const { name, email, password, address } = req.body;
    const existingUser = await pool.query("SELECT id FROM USERS WHERE email = $1", [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, address)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, address, created_at`,
      [name, email, password_hash, address || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

router.post("/login", loginValidation, handleValidation, async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info?.message || "Invalid credentials" });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.status(200).json({
        message: "login succesfull",
        user,
      });
    });
  })(req, res, next);
});

router.get("/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.status(200).json(req.user);
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "logout successful" });
    });
  });
});

module.exports = router;
