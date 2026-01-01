// export const orderStatusMessages = {
//   placed: (orderDetails) => ({
//     message: "🟡 Order Placed\nGot it! Your order has been received 🧾\nWe'll confirm with the restaurant and update you shortly.",
//     data: { status: "placed", order: orderDetails }
//   }),

//   preparing: (vendorName) => ({
//     message: `🟠 Preparing\nYour order is being prepared by ${vendorName} 👨🏽🍳🔥\nSmells good already 😋 — we'll ping you when it's out for delivery.`,
//     data: { status: "preparing" }
//   }),

//   outForDelivery: () => ({
//     message: "🔵 Out for Delivery\nYour order is on its way! 🚴♂️💨\nRider just picked it up — you can expect delivery in about 7-10 mins.",
//     data: { status: "out_for_delivery" }
//   }),

//   delivered: () => ({
//     message: "🟢 Delivered\nOrder delivered ✅\nEnjoy your meal! 😋\nWanna leave a quick rating for your experience?",
//     data: { 
//       status: "delivered",
//       buttons: [{ id: "rate_order", title: "Rate Experience" }]
//     }
//   }),

//   delayed: () => ({
//     message: "🔴 Delayed\nHey 👋 just a heads-up — your delivery's taking a little longer than expected 😓\nOur rider's still on it though, 5mins. Thanks for your patience ❤️",
//     data: { status: "delayed" }
//   })
// };

// export const paymentMessages = {
//   insufficientBalance: () => ({
//     message: "💰 Your wallet balance isn't enough for this order.\nPlease top up.",
//     data: {
//       buttons: [{ id: "top_up_wallet", title: "Top Up Wallet" }]
//     }
//   }),

//   paymentFailed: () => ({
//     message: "⚠️ Your payment didn't go through.\nThis could be a short network issue — please try again shortly.",
//     data: {
//       buttons: [{ id: "retry_payment", title: "Retry Payment" }]
//     }
//   }),

//   firstTimePayment: (totalAmount, accountNumber) => ({
//     message: `Here's your unique payment account for this order 👇\nSend ₦${totalAmount} to complete your payment. 💸\n\nAccount Name: Downtown Pay\nAccount Number: ${accountNumber}\nBank: Moniepoint\n\nOnce you've sent it, tap "Sent" so we can confirm your payment right away. ✅`,
//     data: {
//       buttons: [
//         { id: "copy_account", title: "Copy Account Number" },
//         { id: "payment_sent", title: "Sent" }
//       ]
//     }
//   })
// };