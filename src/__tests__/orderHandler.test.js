import { jest } from "@jest/globals";

// Mock axios for ESM
jest.unstable_mockModule("axios", () => {
  const axiosMock = jest.fn();
  axiosMock.post = jest.fn();
  axiosMock.get = jest.fn();
  return { default: axiosMock };
});

const axios = (await import("axios")).default;

const {
  createOrder,
  CheckUserOrder,
} = await import("../services/orderHandler.js");

describe("orderHandler – unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrder", () => {
    it("creates an order and returns response data", async () => {
      axios.post.mockResolvedValue({
        data: {
          data: {
            order_id: "order-123",
            status: "pending",
          },
        },
      });

      const result = await createOrder(
        "user-1",
        "vendor-1",
        "John",
        "Vendor A",
        "Fried Rice",
        3500,
        "delivery",
        "Yaba",
        "08011111111",
        "08022222222"
      );

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/orders"),
        expect.objectContaining({
          user_id: "user-1",
          vendor_id: "vendor-1",
          food_name: "Fried Rice",
          price: 3500,
        })
      );

      expect(result).toEqual({
        order_id: "order-123",
        status: "pending",
      });
    });

    it("returns error when API call fails", async () => {
      const error = new Error("Network error");
      axios.post.mockRejectedValue(error);

      const result = await createOrder(
        "user-1",
        "vendor-1",
        "John",
        "Vendor A",
        "Burger",
        2500,
        "pickup",
        "Ikeja",
        "08011111111",
        "08022222222"
      );

      expect(result).toBe(error);
    });
  });

  describe("CheckUserOrder", () => {
    it("fetches user order status", async () => {
      axios.get.mockResolvedValue({
        data: {
          data: {
            status: "pending",
            vendor_notified: false,
          },
        },
      });

      await CheckUserOrder("user-2");

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/orders/user-2")
      );
    });

    it("handles API error gracefully", async () => {
      axios.get.mockRejectedValue(new Error("Request failed"));

      await expect(CheckUserOrder("user-3")).resolves.not.toThrow();
    });
  });
});
