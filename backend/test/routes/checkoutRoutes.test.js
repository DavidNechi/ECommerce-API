process.env.STRIPE_KEY = process.env.STRIPE_KEY || "sk_test_dummy";

jest.mock("../../src/middleware/auth", () => ({
  isAuthenticated: (req, res, next) => {
    req.user = { id: Number(req.params.userId) || 1 };
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

describe("Checkout routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /checkout/:userId", () => {
    test("creates an order from cart", async () => {
      const order = { id: 1, user_id: 1, status: "placed", total_amount: "20.00" };
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({ rows: [{ id: 10 }] })
          .mockResolvedValueOnce({ rows: [{ product_id: 2, quantity: 2, unit_price: "10.00" }] })
          .mockResolvedValueOnce({ rows: [{ stock_quantity: 5 }] })
          .mockResolvedValueOnce({ rows: [order] })
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({}),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValueOnce(client);

      const response = await request(app).post("/checkout/1");

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: "checkout successful", order });
    });
  });
});
