process.env.STRIPE_KEY = process.env.STRIPE_KEY || "sk_test_dummy";

jest.mock("../../model/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../model/db");

describe("Auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    test("returns 409 when email already exists", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app).post("/auth/register").send({
        name: "David",
        email: "david@example.com",
        password: "password123",
      });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: "Email already in use" });
    });
  });

  describe("POST /auth/login", () => {
    test("returns 400 on invalid payload", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "bad-email",
        password: "",
      });

      expect(response.status).toBe(400);
      expect(Array.isArray(response.body.error)).toBe(true);
    });
  });

  describe("GET /auth/me", () => {
    test("returns 401 when unauthenticated", async () => {
      const response = await request(app).get("/auth/me");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Not authenticated" });
    });
  });

  describe("POST /auth/logout", () => {
    test("returns logout confirmation", async () => {
      const response = await request(app).post("/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "logout successful" });
    });
  });
});
