import { jest } from "@jest/globals";

// Mock axios
jest.unstable_mockModule("axios", () => ({
  default: jest.fn(),
}));

// Mock database pool
const mockPool = {
  query: jest.fn(),
};

jest.unstable_mockModule("../db/database.js", () => ({
  default: mockPool,
}));

// Mock sessionManager
const mockSetPendingOrder = jest.fn();
const mockGetPendingOrder = jest.fn();

jest.unstable_mockModule("../services/sessionManager.js", () => ({
  setPendingOrder: mockSetPendingOrder,
  getPendingOrder: mockGetPendingOrder,
}));

const axios = (await import("axios")).default;
const { processCart, ARENA, BESTMAN } = await import("../services/cartProcessor.js");

describe("processCart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("vendor validation", () => {
    it("should reject cart with items from multiple vendors", async () => {
      const cart = {
        from: "customer123",
        order: {
          product_items: [
            {
              product_retailer_id: ARENA[0], // Arena product
              quantity: 2,
              item_price: 1000,
            },
            {
              product_retailer_id: BESTMAN[0], // Bestman product
              quantity: 1,
              item_price: 500,
            },
          ],
        },
      };

      // Mock database responses for first item
      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[0],
              vendor_id: "vendor1",
              food_name: "Item 1",
              price: 1000,
              sale_quantity: "per_plate",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "vendor1", name: "Arena" }],
        });

      await processCart(cart, "2348012345678");

      // Should send multi-vendor error message
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.stringContaining("multiple vendors"),
        })
      );

      // Should NOT save order
      expect(mockSetPendingOrder).not.toHaveBeenCalled();
    });

    it("should process cart with items from same vendor", async () => {
      const cart = {
        from: "customer123",
        order: {
          product_items: [
            {
              product_retailer_id: ARENA[0],
              quantity: 2,
              item_price: 1000,
            },
            {
              product_retailer_id: ARENA[1], // Same vendor
              quantity: 1,
              item_price: 500,
            },
          ],
        },
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[0],
              vendor_id: "vendor1",
              food_name: "Item 1",
              price: 1000,
              sale_quantity: "per_plate",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "vendor1", name: "Arena" }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[1],
              vendor_id: "vendor1",
              food_name: "Item 2",
              price: 500,
              sale_quantity: "per_plate",
            },
          ],
        });

      axios.mockResolvedValueOnce({ data: { success: true } });

      await processCart(cart, "2348012345678");

      // Should save order
      expect(mockSetPendingOrder).toHaveBeenCalledWith(
        "2348012345678",
        expect.objectContaining({
          orderSummary: expect.objectContaining({
            vendorName: "Arena",
            total: 2500, // (2 * 1000) + (1 * 500)
          }),
        })
      );
    });
  });

  describe("minimum price validation", () => {
    it("should reject per_price items below starting price", async () => {
      const cart = {
        from: "customer123",
        order: {
          product_items: [
            {
              product_retailer_id: ARENA[0],
              quantity: 1,
              item_price: 500, // User entered ₦500
            },
          ],
        },
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[0],
              vendor_id: "vendor1",
              food_name: "Custom Rice",
              price: 1000, // Starting price is ₦1000
              sale_quantity: "per_price", // This is a per_price item
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "vendor1", name: "Arena" }],
        });

      await processCart(cart, "2348012345678");

      // Should send minimum price error
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.stringContaining("minimum starting price"),
        })
      );

      // Should NOT save order
      expect(mockSetPendingOrder).not.toHaveBeenCalled();
    });

    it("should accept per_price items at or above starting price", async () => {
      const cart = {
        from: "customer123",
        order: {
          product_items: [
            {
              product_retailer_id: ARENA[0],
              quantity: 1,
              item_price: 1500, // User entered ₦1500
            },
          ],
        },
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[0],
              vendor_id: "vendor1",
              food_name: "Custom Rice",
              price: 1000, // Starting price is ₦1000
              sale_quantity: "per_price",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "vendor1", name: "Arena" }],
        });

      axios.mockResolvedValueOnce({ data: { success: true } });

      await processCart(cart, "2348012345678");

      // Should save order with correct total
      expect(mockSetPendingOrder).toHaveBeenCalledWith(
        "2348012345678",
        expect.objectContaining({
          orderSummary: expect.objectContaining({
            total: 1500,
          }),
        })
      );
    });

    it("should not validate minimum price for non-per_price items", async () => {
      const cart = {
        from: "customer123",
        order: {
          product_items: [
            {
              product_retailer_id: ARENA[0],
              quantity: 1,
              item_price: 500, // Below "starting price"
            },
          ],
        },
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[0],
              vendor_id: "vendor1",
              food_name: "Fixed Price Item",
              price: 1000,
              sale_quantity: "per_plate", // NOT per_price
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "vendor1", name: "Arena" }],
        });

      axios.mockResolvedValueOnce({ data: { success: true } });

      await processCart(cart, "2348012345678");

      // Should process normally (no minimum price check)
      expect(mockSetPendingOrder).toHaveBeenCalled();
      expect(axios).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.stringContaining("minimum starting price"),
        })
      );
    });
  });

  describe("price calculation", () => {
    it("should calculate correct grand total", async () => {
      const cart = {
        from: "customer123",
        order: {
          product_items: [
            {
              product_retailer_id: ARENA[0],
              quantity: 3,
              item_price: 1000,
            },
            {
              product_retailer_id: ARENA[1],
              quantity: 2,
              item_price: 500,
            },
            {
              product_retailer_id: ARENA[2],
              quantity: 1,
              item_price: 2000,
            },
          ],
        },
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[0],
              vendor_id: "vendor1",
              food_name: "Item 1",
              price: 1000,
              sale_quantity: "per_plate",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "vendor1", name: "Arena" }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[1],
              vendor_id: "vendor1",
              food_name: "Item 2",
              price: 500,
              sale_quantity: "per_plate",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[2],
              vendor_id: "vendor1",
              food_name: "Item 3",
              price: 2000,
              sale_quantity: "per_plate",
            },
          ],
        });

      axios.mockResolvedValueOnce({ data: { success: true } });

      await processCart(cart, "2348012345678");

      expect(mockSetPendingOrder).toHaveBeenCalledWith(
        "2348012345678",
        expect.objectContaining({
          orderSummary: expect.objectContaining({
            total: 6000, // (3*1000) + (2*500) + (1*2000)
          }),
        })
      );
    });
  });

  describe("order summary structure", () => {
    it("should create correct order summary format", async () => {
      const cart = {
        from: "customer123",
        order: {
          product_items: [
            {
              product_retailer_id: ARENA[0],
              quantity: 2,
              item_price: 1000,
            },
          ],
        },
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[0],
              vendor_id: "vendor1",
              food_name: "Jollof Rice",
              price: 1000,
              sale_quantity: "per_plate",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "vendor1", name: "Arena" }],
        });

      axios.mockResolvedValueOnce({ data: { success: true } });

      await processCart(cart, "2348012345678");

      expect(mockSetPendingOrder).toHaveBeenCalledWith(
        "2348012345678",
        expect.objectContaining({
          orderSummary: {
            vendorId: "vendor1",
            vendorName: "Arena",
            items: [
              {
                name: "Jollof Rice",
                price: 1000,
                quantity: 2,
                total: 2000,
                saleQuantity: "per_plate",
                startingPrice: 1000,
                productId: ARENA[0],
              },
            ],
            total: 2000,
          },
        })
      );
    });
  });

  describe("WhatsApp message sending", () => {
    it("should send order summary with pickup/delivery buttons", async () => {
      const cart = {
        from: "customer123",
        order: {
          product_items: [
            {
              product_retailer_id: ARENA[0],
              quantity: 1,
              item_price: 1000,
            },
          ],
        },
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              product_id: ARENA[0],
              vendor_id: "vendor1",
              food_name: "Jollof Rice",
              price: 1000,
              sale_quantity: "per_plate",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "vendor1", name: "Arena" }],
        });

      axios.mockResolvedValueOnce({ data: { success: true } });

      await processCart(cart, "2348012345678");

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "post",
          data: expect.stringContaining("pickup_vendor1"),
        })
      );
    });
  });
});