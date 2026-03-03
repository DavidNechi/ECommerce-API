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

describe("Users routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /users/:id", () => {
    test("returns a user", async () => {
      const user = { id: 1, name: "David", email: "david@example.com", address: null, created_at: "now" };
      pool.query.mockResolvedValueOnce({ rows: [user] });

      const response = await request(app).get("/users/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(user);
    });
  });

  describe("PUT /users/:id", () => {
    test("updates and returns a user", async () => {
      const user = { id: 1, name: "Updated", email: "updated@example.com", address: "Main", created_at: "now" };
      pool.query.mockResolvedValueOnce({ rows: [user] });

      const response = await request(app).put("/users/1").send({
        name: "Updated",
        email: "updated@example.com",
        address: "Main",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(user);
    });
  });

  describe("DELETE /users/:id", () => {
    test("deletes a user", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app).delete("/users/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "user deleted" });
    });
  });
});
