process.env.STRIPE_KEY = process.env.STRIPE_KEY || "sk_test_dummy";

jest.mock("../../model/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../model/db");

describe("System routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    test("returns health message", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "API is running" });
    });
  });

  describe("GET /db-test", () => {
    test("returns database test payload", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ now: "2026-03-02T00:00:00.000Z" }] });

      const response = await request(app).get("/db-test");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true, time: "2026-03-02T00:00:00.000Z" });
    });
  });
});
