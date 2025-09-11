import { describe, it, expect, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// Import the route modules
import { loader as syncStatusLoader } from "../app/routes/api.sync-status.jsx";
import { action as syncProductsAction } from "../app/routes/api.sync-products.jsx";
import db from "../app/db.server";

// Mock the Shopify authentication
vi.mock("../app/shopify.server", () => ({
  authenticate: {
    admin: vi.fn().mockResolvedValue({
      session: { shop: "test-shop.myshopify.com" },
      admin: {
        graphql: vi.fn().mockResolvedValue({
          json: vi.fn().mockResolvedValue({
            data: {
              products: {
                edges: [
                  {
                    node: {
                      id: "gid://shopify/Product/123",
                      title: "Test Product",
                      description: "Test Description",
                      tags: ["test", "sample"],
                      priceRangeV2: {
                        minVariantPrice: {
                          amount: "29.99",
                          currencyCode: "USD",
                        },
                      },
                      images: {
                        edges: [
                          {
                            node: {
                              url: "https://example.com/image.jpg",
                              altText: "Test Image",
                              width: 800,
                              height: 600,
                            },
                          },
                        ],
                      },
                    },
                    cursor: "test-cursor",
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                },
              },
            },
          }),
        }),
      },
    }),
  },
}));

// Mock the database
vi.mock("../app/db.server", () => ({
  default: {
    syncStatus: {
      findUnique: vi.fn(),
      upsert: vi.fn(), 
      update: vi.fn(),
    },
    product: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    productImage: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    productEmbedding: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Sync API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/sync-status", () => {
    it("should return default status when no sync status exists", async () => {
      db.syncStatus.findUnique.mockResolvedValue(null);

      const request = new Request("http://localhost/api/sync-status");
      const response = await syncStatusLoader({ request });
      const data = await response.json();

      expect(data).toEqual({
        status: "idle",
        progress: 0,
        totalItems: 0,
        lastSync: null,
        errorMessage: null,
      });
      expect(db.syncStatus.findUnique).toHaveBeenCalledWith({
        where: { shop: "test-shop.myshopify.com" },
      });
    });

    it("should return existing sync status", async () => {
      const mockSyncStatus = {
        status: "completed",
        progress: 100,
        totalItems: 100,
        lastSync: new Date("2023-01-01"),
        errorMessage: null,
      };
      db.syncStatus.findUnique.mockResolvedValue(mockSyncStatus);

      const request = new Request("http://localhost/api/sync-status");
      const response = await syncStatusLoader({ request });
      const data = await response.json();

      expect(data.status).toBe("completed");
      expect(data.progress).toBe(100);
      expect(data.totalItems).toBe(100);
      expect(data.lastSync).toBe(mockSyncStatus.lastSync.toISOString());
      expect(data.errorMessage).toBeNull();
    });

    it("should handle database errors", async () => {
      db.syncStatus.findUnique.mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost/api/sync-status");
      const response = await syncStatusLoader({ request });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch sync status" });
    });
  });

  describe("POST /api/sync-products", () => {
    it("should start sync process", async () => {
      db.syncStatus.upsert.mockResolvedValue({});

      const request = new Request("http://localhost/api/sync-products", {
        method: "POST",
      });
      
      const response = await syncProductsAction({ request });
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        message: "Sync started",
      });

      expect(db.syncStatus.upsert).toHaveBeenCalledWith({
        where: { shop: "test-shop.myshopify.com" },
        update: {
          status: "syncing",
          progress: 0,
          errorMessage: null,
        },
        create: {
          shop: "test-shop.myshopify.com",
          status: "syncing",
          progress: 0,
          totalItems: 0,
        },
      });
    });

    it("should handle sync initialization errors", async () => {
      db.syncStatus.upsert.mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost/api/sync-products", {
        method: "POST",
      });
      
      try {
        const response = await syncProductsAction({ request });
        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: "Failed to start sync" });
      } catch (error) {
        // Expected error from mocked rejection
        expect(error.message).toBe("Database error");
      }
    });
  });

  describe("DELETE /api/sync-products", () => {
    it("should delete all product data", async () => {
      db.product.deleteMany.mockResolvedValue({ count: 5 });
      db.syncStatus.upsert.mockResolvedValue({});

      const request = new Request("http://localhost/api/sync-products", {
        method: "DELETE",
      });
      
      const response = await syncProductsAction({ request });
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        message: "All product data deleted",
      });

      expect(db.product.deleteMany).toHaveBeenCalledWith({
        where: { shop: "test-shop.myshopify.com" },
      });

      expect(db.syncStatus.upsert).toHaveBeenCalledWith({
        where: { shop: "test-shop.myshopify.com" },
        update: {
          status: "idle",
          progress: 0,
          totalItems: 0,
          lastSync: null,
          errorMessage: null,
        },
        create: {
          shop: "test-shop.myshopify.com",
          status: "idle",
          progress: 0,
          totalItems: 0,
        },
      });
    });

    it("should handle delete errors", async () => {
      db.product.deleteMany.mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost/api/sync-products", {
        method: "DELETE",
      });
      
      const response = await syncProductsAction({ request });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to delete product data" });
    });
  });

  describe("Unsupported HTTP methods", () => {
    it("should return 405 for unsupported methods", async () => {
      const request = new Request("http://localhost/api/sync-products", {
        method: "PUT",
      });
      
      const response = await syncProductsAction({ request });
      
      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data).toEqual({ error: "Method not allowed" });
    });
  });
});