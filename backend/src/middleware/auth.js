const pool = require("../../model/db");
const requireOwnedOrder = (paramName = "id") => async (req, res, next) => {
  try {
    const orderId = req.params[paramName];
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT id, user_id, status, total_amount, created_at FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "order not found" });
    }

    req.order = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

const requireSameUser = (paramName = "userId") => (req, res, next) => {
  if (Number(req.params[paramName]) !== req.user.id) {
    return res.status(403).json({ error: "Not authorized to access this resource" });
  }
  next();
};

module.exports = {
  isAuthenticated,
  requireSameUser,
  requireOwnedOrder,
};
