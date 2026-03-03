process.env.STRIPE_KEY = process.env.STRIPE_KEY || "sk_test_dummy";

jest.mock("../../src/middleware/auth", () => ({
  isAuthenticated: (req, res, next) => {
    req.user = { id: 1 };
    req.isAuthenticated = () => true;
    next();
  },
  requireSameUser: () => (req, res, next) => next(),
  requireOwnedOrder: () => (req, res, next) => next(),
}));


jest.mock("../../model/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../model/db");

describe("Carts routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /carts/:userId", () => {
    test("returns cart with items", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 10, user_id: 1, created_at: "now" }] })
        .mockResolvedValueOnce({ rows: [{ product_id: 2, name: "Mouse", quantity: 1, unit_price: "29.99" }] });

      const response = await request(app).get("/carts/1");

      expect(response.status).toBe(200);
      expect(response.body.cart.id).toBe(10);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe("POST /carts/:userId/items", () => {
    test("adds item to cart", async () => {
      const item = { id: 1, cart_id: 10, product_id: 2, quantity: 1, unit_price: "29.99" };
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 2, price: "29.99" }] })
        .mockResolvedValueOnce({ rows: [{ id: 10 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [item] });

      const response = await request(app).post("/carts/1/items").send({ product_id: 2, quantity: 1 });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(item);
    });
  });

  describe("PUT /carts/:userId/items/:productId", () => {
    test("updates cart item quantity", async () => {
      const item = { id: 1, cart_id: 10, product_id: 2, quantity: 3, unit_price: "29.99" };
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 10 }] })
        .mockResolvedValueOnce({ rows: [item] });

      const response = await request(app).put("/carts/1/items/2").send({ quantity: 3 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(item);
    });
  });

  describe("DELETE /carts/:userId/items/:productId", () => {
    test("removes cart item", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 10 }] })
        .mockResolvedValueOnce({ rows: [{ id: 99 }] });

      const response = await request(app).delete("/carts/1/items/2");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "item removed from cart" });
    });
  });

  describe("DELETE /carts/:userId", () => {
    test("deletes cart", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });

      const response = await request(app).delete("/carts/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "cart deleted" });
    });
  });
});
