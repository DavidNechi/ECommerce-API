process.env.STRIPE_KEY = process.env.STRIPE_KEY || "sk_test_dummy";

jest.mock("../../src/middleware/auth", () => ({
  isAuthenticated: (req, res, next) => {
    req.user = { id: 1 };
    req.isAuthenticated = () => true;
    next();
  },
  requireSameUser: () => (req, res, next) => next(),
  requireOwnedOrder: () => (req, res, next) => {
    req.order = { id: Number(req.params.id), user_id: 1, status: "placed", total_amount: "59.99" };
    next();
  },
}));

jest.mock("../../model/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../model/db");

describe("Orders routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /orders", () => {
    test("returns only authenticated user's orders", async () => {
      const rows = [{ id: 1, user_id: 1, status: "placed", total_amount: "59.99" }];
      pool.query.mockResolvedValueOnce({ rows });

      const response = await request(app).get("/orders");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(rows);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE user_id = $1"),
        [1]
      );
    });
  });


  describe("GET /orders/users/:userId", () => {
    test("returns user orders", async () => {
      const rows = [{ id: 1, user_id: 1, status: "placed", total_amount: "59.99" }];
      pool.query.mockResolvedValueOnce({ rows });

      const response = await request(app).get("/orders/users/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(rows);
    });
  });

  describe("GET /orders/:id", () => {
    test("returns order with items", async () => {
      const order = { id: 1, user_id: 1, status: "placed", total_amount: "59.99" };
      const items = [{ product_id: 2, name: "Mouse", quantity: 1, unit_price: "29.99" }];
      pool.query.mockResolvedValueOnce({ rows: items });

      const response = await request(app).get("/orders/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ order, items });
    });
  });

  describe("POST /orders", () => {
    test("ignores spoofed body user_id and uses req.user.id", async () => {
      const created = { id: 1, user_id: 1, status: "pending", total_amount: "0" };
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({ rows: [created] })
          .mockResolvedValueOnce({}),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValueOnce(client);

      const response = await request(app).post("/orders").send({ user_id: 999, items: [] });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(created);
      expect(client.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("INSERT INTO orders"),
        [1, "pending", 0]
      );
    });
  });


  describe("PUT /orders/:id/status", () => {
    test("updates with owner constraint in SQL", async () => {
      const updated = { id: 1, user_id: 1, status: "shipped", total_amount: "59.99" };
      pool.query.mockResolvedValueOnce({ rows: [updated] });

      const response = await request(app).put("/orders/1/status").send({ status: "shipped" });

      expect(response.status).toBe(200);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE id = $2 AND user_id = $3"),
        ["shipped", "1", 1]
      );
    });
  });


  describe("DELETE /orders/:id", () => {
    test("deletes an order", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app).delete("/orders/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "order deleted" });
    });
  });
});
