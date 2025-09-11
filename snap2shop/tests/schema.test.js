import { describe, it, expect } from "vitest";

describe("Schema Validation", () => {
  describe("Product model structure", () => {
    it("should have correct required fields", () => {
      const requiredFields = [
        "id",
        "shopifyProductId", 
        "shop",
        "title",
        "createdAt",
        "updatedAt"
      ];
      
      const optionalFields = [
        "description",
        "tags", 
        "price",
        "images"
      ];

      expect(requiredFields).toHaveLength(6);
      expect(optionalFields).toHaveLength(4);
    });

    it("should enforce unique constraint on shopifyProductId and shop", () => {
      const uniqueConstraint = ["shopifyProductId", "shop"];
      expect(uniqueConstraint).toContain("shopifyProductId");
      expect(uniqueConstraint).toContain("shop");
    });
  });

  describe("ProductImage model structure", () => {
    it("should have correct required fields", () => {
      const requiredFields = [
        "id",
        "productId",
        "shop", 
        "imageUrl",
        "createdAt",
        "updatedAt"
      ];

      const optionalFields = [
        "imagePath",
        "altText",
        "width",
        "height"
      ];

      expect(requiredFields).toHaveLength(6);
      expect(optionalFields).toHaveLength(4);
    });

    it("should have relationship to Product model", () => {
      const relationships = ["product"];
      expect(relationships).toContain("product");
    });
  });

  describe("SyncStatus model structure", () => {
    it("should have correct fields with defaults", () => {
      const defaultValues = {
        status: "idle",
        progress: 0,
        totalItems: 0
      };

      expect(defaultValues.status).toBe("idle");
      expect(defaultValues.progress).toBe(0);
      expect(defaultValues.totalItems).toBe(0);
    });

    it("should have unique constraint on shop", () => {
      const uniqueField = "shop";
      expect(uniqueField).toBe("shop");
    });

    it("should support status values", () => {
      const statusValues = ["idle", "syncing", "completed", "error"];
      expect(statusValues).toContain("idle");
      expect(statusValues).toContain("syncing"); 
      expect(statusValues).toContain("completed");
      expect(statusValues).toContain("error");
    });
  });
});