process.env.STRIPE_KEY = process.env.STRIPE_KEY || "sk_test_dummy";

jest.mock("../../model/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../model/db");

describe("Products routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /products", () => {
    test("returns products", async () => {
      const rows = [{ id: 1, name: "Keyboard", price: "59.99", stock_quantity: 10 }];
      pool.query.mockResolvedValueOnce({ rows });

      const response = await request(app).get("/products");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(rows);
    });
  });

  describe("GET /products/:id", () => {
    test("returns product by id", async () => {
      const product = { id: 1, name: "Keyboard", price: "59.99", stock_quantity: 10 };
      pool.query.mockResolvedValueOnce({ rows: [product] });

      const response = await request(app).get("/products/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(product);
    });
  });

  describe("POST /products", () => {
    test("creates a product", async () => {
      const product = { id: 2, name: "Mouse", price: "29.99", stock_quantity: 20 };
      pool.query.mockResolvedValueOnce({ rows: [product] });

      const response = await request(app).post("/products").send({
        name: "Mouse",
        price: 29.99,
        stock_quantity: 20,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(product);
    });
  });

  describe("PUT /products/:id", () => {
    test("updates a product", async () => {
      const product = { id: 1, name: "Keyboard Pro", price: "79.99", stock_quantity: 5 };
      pool.query.mockResolvedValueOnce({ rows: [product] });

      const response = await request(app).put("/products/1").send({
        name: "Keyboard Pro",
        price: 79.99,
        stock_quantity: 5,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(product);
    });
  });

  describe("DELETE /products/:id", () => {
    test("deletes a product", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app).delete("/products/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "product deleted" });
    });
  });
});
