const pendingOtps = new Map();

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveOtp(customerId, otp, expiresIn = 15 * 60 * 1000) {
  const expiry = Date.now() + expiresIn;
  pendingOtps.set(customerId, { otp, expiry });
}

export function getOtp(customerId) {
  return pendingOtps.get(customerId);
}

export function removeOtp(customerId) {
  pendingOtps.delete(customerId);
}
