import { jest } from "@jest/globals";

jest.unstable_mockModule("axios", () => {
  const axiosMock = jest.fn();
  axiosMock.post = jest.fn();
  return { default: axiosMock };
});

const axios = (await import("axios")).default;

const {
  getAccount,
  confirmPayment,
  finalizePayment,
  refundPayment,
} = await import("../services/paymentHandler.js");

import { paymentSessions } from "../services/sessionManager.js";

describe("payments – unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    paymentSessions.clear();
  });

  describe("getAccount", () => {
    it("stores a pending payment session", async () => {
      axios.post.mockResolvedValue({
        data: {
          data: {
            external_reference: "ref-1",
            account_number: "111111",
          },
        },
      });

      await getAccount("0801", 2000, "cust-1", "Delivery");

      const session = paymentSessions.get("cust-1");

      expect(session).toEqual(
        expect.objectContaining({
          external_reference: "ref-1",
          amount: 2000,
          status: "PENDING",
        })
      );
    });
  });

  describe("confirmPayment", () => {
    it("marks payment as CONFIRMED on success", async () => {
      paymentSessions.set("cust-2", {
        external_reference: "ref-2",
        amount: 5000,
        status: "PENDING",
      });

      axios.post.mockResolvedValue({
        data: { data: { success: true } },
      });

      await confirmPayment(5000, "cust-2");

      expect(paymentSessions.get("cust-2").status).toBe("CONFIRMED");
    });
  });

  describe("finalizePayment / refundPayment", () => {
    it("finalizes payment", async () => {
      axios.post.mockResolvedValue({
        data: { data: { finalized: true } },
      });

      const result = await finalizePayment("ref-x");

      expect(result.finalized).toBe(true);
    });

    it("refunds payment", async () => {
      axios.post.mockResolvedValue({
        data: { data: { refunded: true } },
      });

      const result = await refundPayment("ref-y");

      expect(result.refunded).toBe(true);
    });
  });
});
