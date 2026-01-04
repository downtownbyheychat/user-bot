export const orderStatusMessages = {
  "received": (orderDetails) => ({
    message: " Order Placed\nGot it! Your order has been received \nWe'll confirm with the restaurant and update you shortly.",
    data: { status: "received", order: orderDetails }
  }),

  "pick_up_ready": (vendorName) => ({
    message: `Your order is ready for pickup at ${vendorName}.`,
    data: { status: "pick_up_ready" }
  }),

  "picked_up": () => ({
    message: "Your order has been picked up and is on the way.",
    data: { status: "picked_up" }
  }),

  "delivered": () => ({
    message: "Please step out to receive your order. Enjoy your meal!",
    data: { 
      status: "delivered",
      buttons: [{ id: "rate_order", title: "Rate Experience" }]
    }
  }),

  "cancelled": () => ({
    message: "Your order has been cancelled by the vendor. We apologize for the inconvenience caused. You will be refunded shortly.",
    data: { status: "cancelled" }
  })
};

// export const paymentMessages = {
//   insufficientBalance: () => ({
//     message: "Your wallet balance isn't enough for this order.\nPlease top up.",
//     data: {
//       buttons: [{ id: "top_up_wallet", title: "Top Up Wallet" }]
//     }
//   }),

//   paymentFailed: () => ({
//     message: "Your payment didn't go through.\nThis could be a short network issue — please try again shortly.",
//     data: {
//       buttons: [{ id: "retry_payment", title: "Retry Payment" }]
//     }
//   }),

//   firstTimePayment: (totalAmount, accountNumber) => ({
//     message: `Here's your unique payment account for this order \nSend ₦${totalAmount} to complete your payment. \n\nAccount Name: Downtown Pay\nAccount Number: ${accountNumber}\nBank: Moniepoint\n\nOnce you've sent it, tap "Sent" so we can confirm your payment right away.`,
//     data: {
//       buttons: [
//         { id: "copy_account", title: "Copy Account Number" },
//         { id: "payment_sent", title: "Sent" }
//       ]
//     }
//   })
// };