const express = require("express");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const swaggerSpec = require("../swagger");
const passport = require("./passport");

dotenv.config();

const systemRoutes = require("./routes/systemRoutes");
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const productsRoutes = require("./routes/productsRoutes");
const cartsRoutes = require("./routes/cartsRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");

const app = express();

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", systemRoutes);
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/products", productsRoutes);
app.use("/carts", cartsRoutes);
app.use("/orders", ordersRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/payments", paymentsRoutes);

module.exports = app;
