const express = require("express");
const pool = require("../model/db");
const bcrypt = require("bcrypt");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../swagger");
const cors = require('cors');
const passport = require("./passport");
const session = require("express-session");
const { check, validationResult } = require("express-validator");
const dotenv = require("dotenv");
dotenv.config();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_KEY);

const app = express();


// Midelware
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  }
}))
app.use(passport.initialize());
app.use(passport.session());


const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }
  next();
}

const registerValidation = [
  check("name").trim().notEmpty().withMessage("name is required"),
  check("email").trim().isEmail().withMessage("valid email is required"),
  check("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters"),
];

const loginValidation = [
  check("email").trim().isEmail().withMessage("valid email is required"),
  check("password").notEmpty().withMessage("password is required"),
];

//Test route
/**
 * @swagger
 * /:
 *   get:
 *     summary: API health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 */
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Test route to check DB connection
/**
 * @swagger
 * /db-test:
 *   get:
 *     summary: Database connectivity check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Database connection works
 *       500:
 *         description: Database connection failed
 */
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, time: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Failed to connect to DB" });
  }
});

// Routes
//Payment endpoint
app.post("/payments/create-intent/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const itemResult = await pool.query(
      'SELECT cp.quantity, cp.unit_price FROM carts c JOIN cart_products cp ON cp.cart_id = c.id WHERE c.user_id = $1',
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
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { userId: String(userId) },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: amount,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

// Authentication endpoints
// Registration

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: David
 *               email:
 *                 type: string
 *                 example: david@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               address:
 *                 type: string
 *                 example: 123 Main St
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
app.post("/auth/register", registerValidation, handleValidation, async (req, res) => {
  try {
    const { name, email, password, address } = req.body;
    const existingUser = await pool.query(
      `SELECT id FROM USERS WHERE email = $1`,
      [email]
    );

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

// Login 
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: david@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials or user not found
 *       500:
 *         description: Server error
 */
app.post('/auth/login', loginValidation, handleValidation, async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info?.message || "Invalid credentials" });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.status(200).json({
        message: 'login succesfull',
        user,
      });
    });
  })(req, res, next);
});

app.get("/auth/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.status(200).json(req.user);
});

app.post("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "logout successful" });
    });
  });
});


// User endpoints
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.get("/users/:id", async (req, res) => {
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

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: David
 *               email:
 *                 type: string
 *                 example: david@example.com
 *               address:
 *                 type: string
 *                 example: 123 Main St
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.put("/users/:id", async (req, res) => {
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

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({ message: "user deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

// Product endpoints
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Product list
 *       500:
 *         description: Server error
 */
app.get('/products', async (req, res) => {
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

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT id, name, price, stock_quantity FROM products WHERE id = $1",
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

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Wireless Mouse
 *               price:
 *                 type: number
 *                 example: 29.99
 *               stock_quantity:
 *                 type: integer
 *                 example: 20
 *     responses:
 *       200:
 *         description: Product created
 *       500:
 *         description: Server error
 */
app.post('/products', async (req, res) => {
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

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock_quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
app.put("/products/:id", async (req, res) => {
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

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "product not found" });
    }

    return res.status(200).json({ message: "product deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

// Cart endpoints
/**
 * @swagger
 * /carts/{userId}:
 *   get:
 *     summary: Get cart for a user
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cart with items
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
app.get("/carts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const cartResult = await pool.query(
      "SELECT id, user_id, created_at FROM carts WHERE user_id = $1",
      [userId]
    );

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
        created_at: cart.created_at
      },
      items: itemsResult.rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * @swagger
 * /carts/{userId}/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Item added to cart
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
app.post("/carts/:userId/items", async (req, res) => {
  try {
    const { userId } = req.params;
    const { product_id, quantity } = req.body;

    // 1) Ensure product exists and get current price
    const productResult = await pool.query(
      "SELECT id, price FROM products WHERE id = $1",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: "product not found" });
    }

    const unitPrice = productResult.rows[0].price;

    // 2) Ensure cart exists for this user (create if missing)
    let cartResult = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );

    let cartId;
    if (cartResult.rows.length === 0) {
      const newCart = await pool.query(
        "INSERT INTO carts (user_id) VALUES ($1) RETURNING id",
        [userId]
      );
      cartId = newCart.rows[0].id;
    } else {
      cartId = cartResult.rows[0].id;
    }

    // 3) If item exists in cart, increase quantity; else insert
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

/**
 * @swagger
 * /carts/{userId}/items/{productId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated
 *       404:
 *         description: Cart or item not found
 *       500:
 *         description: Server error
 */
app.put("/carts/:userId/items/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    // Find user's cart
    const cartResult = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: "cart not found" });
    }

    const cartId = cartResult.rows[0].id;

    // Update item quantity
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
});

/**
 * @swagger
 * /carts/{userId}/items/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removed
 *       404:
 *         description: Cart or item not found
 *       500:
 *         description: Server error
 */
app.delete("/carts/:userId/items/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cartResult = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );

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
});

/**
 * @swagger
 * /carts/{userId}:
 *   delete:
 *     summary: Delete cart for a user
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cart deleted
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
app.delete("/carts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "DELETE FROM carts WHERE user_id = $1 RETURNING id",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "cart not found" });
    }

    return res.status(200).json({ message: "cart deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

// Order endpoint
/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Orders list
 *       500:
 *         description: Server error
 */
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, user_id, status, total_amount, created_at FROM orders ORDER BY id DESC"
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by id with items
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
app.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      "SELECT id, user_id, status, total_amount, created_at FROM orders WHERE id = $1",
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "order not found" });
    }

    const itemsResult = await pool.query(
      `SELECT op.product_id, p.name, op.quantity, op.unit_price
       FROM order_products op
       JOIN products p ON p.id = op.product_id
       WHERE op.order_id = $1
       ORDER BY op.id`,
      [id]
    );

    return res.status(200).json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * @swagger
 * /orders/me:
 *   get:
 *     summary: Get order history for the authenticated user
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: User orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 12
 *                   user_id:
 *                     type: integer
 *                     example: 7
 *                   status:
 *                     type: string
 *                     example: placed
 *                   total_amount:
 *                     type: number
 *                     format: float
 *                     example: 149.97
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: 2026-02-25T18:22:31.000Z
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
app.get("/orders/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = await pool.query(
      `SELECT id, user_id, status, total_amount, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
});


/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               status:
 *                 type: string
 *                 example: pending
 *               total_amount:
 *                 type: number
 *                 example: 59.98
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unit_price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Order created
 *       500:
 *         description: Server error
 */
app.post("/orders", async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, status, total_amount, items } = req.body;

    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, status, total_amount, created_at`,
      [user_id, status || "pending", total_amount || 0]
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

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
app.put("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING id, user_id, status, total_amount, created_at`,
      [status, id]
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

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete order by id
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
app.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM orders WHERE id = $1 RETURNING id",
      [id]
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

// Checkout endpoint
/**
 * @swagger
 * /checkout/{userId}:
 *   post:
 *     summary: Checkout a user's cart into an order
 *     tags: [Checkout]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Checkout successful
 *       400:
 *         description: Cart empty or insufficient stock
 *       404:
 *         description: Cart or product not found
 *       500:
 *         description: Server error
 */
app.post("/checkout/:userId", async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId } = req.params;

    await client.query("BEGIN");

    // 1) Find cart
    const cartResult = await client.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "cart not found" });
    }

    const cartId = cartResult.rows[0].id;

    // 2) Get cart items
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

    // 3) Check stock + compute total
    let totalAmount = 0;

    for (const item of itemsResult.rows) {
      const productResult = await client.query(
        "SELECT stock_quantity FROM products WHERE id = $1",
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: `product ${item.product_id} not found` });
      }

      const stock = productResult.rows[0].stock_quantity;
      if (stock < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `insufficient stock for product ${item.product_id}` });
      }

      totalAmount += Number(item.unit_price) * Number(item.quantity);
    }

    // 4) Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, status, total_amount, created_at`,
      [userId, "placed", totalAmount]
    );

    const order = orderResult.rows[0];

    // 5) Move items from cart -> order_products, reduce stock
    for (const item of itemsResult.rows) {
      await client.query(
        `INSERT INTO order_products (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.unit_price]
      );

      await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 6) Clear cart items
    await client.query("DELETE FROM cart_products WHERE cart_id = $1", [cartId]);

    await client.query("COMMIT");

    return res.status(201).json({
      message: "checkout successful",
      order,
    });
  } catch (error) {
    // await client.query("ROLLBACK");
    // console.error(error);
    // return res.status(500).json({ error: "server error" });

    try { await client.query("ROLLBACK"); } catch (_) { }
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


module.exports = app;
