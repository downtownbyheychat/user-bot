import { jest } from "@jest/globals";

jest.unstable_mockModule("axios", () => ({
  default: {
    post: jest.fn(),
  },
}));

const axios = (await import("axios")).default;

const {
  getAccount,
  confirmPayment,
} = await import("../services/paymentHandler.js");

import { paymentSessions } from "../services/sessionManager.js";

describe("payments – integration flow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    paymentSessions.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("goes from PENDING → CONFIRMED → FINALIZED", async () => {
  axios.post
    .mockResolvedValueOnce({
      data: {
        data: {
          external_reference: "ref-flow",
          account_number: "999999",
        },
      },
    })
    .mockResolvedValueOnce({
      data: { data: { success: true } },
    })
    .mockResolvedValueOnce({
      data: { data: { finalized: true } },
    });

  await getAccount("0809", 7000, "cust-flow", "Pickup");
  
  // Advance the 3-second timer for sendAccNum
  await jest.advanceTimersByTimeAsync(3000);
  
  await confirmPayment(7000, "cust-flow");

  // Advance the 150-second timer for finalization
  await jest.advanceTimersByTimeAsync(150000);

  const session = paymentSessions.get("cust-flow");
  expect(session.status).toBe("FINALIZED");
});

});
