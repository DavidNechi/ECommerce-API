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


jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: "cs_test_123" }),
    },
  }));
});

jest.mock("../../model/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../model/db");

describe("Payments routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /payments/create-intent/:userId", () => {
    test("returns payment intent client secret", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ quantity: 2, unit_price: 10 }] });

      const response = await request(app).post("/payments/create-intent/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ clientSecret: "cs_test_123", amount: 20 });
    });
  });
});
