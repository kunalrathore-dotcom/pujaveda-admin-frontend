export const validateCouponForm = (form) => {
  const errors = {};

  const code = form.code ? String(form.code).trim().toUpperCase() : "";
  if (!code) {
    errors.code = "Please enter a coupon code.";
  } else if (code.length < 3) {
    errors.code = "Coupon code must contain at least 3 characters.";
  } else if (!/^[A-Z0-9_-]+$/.test(code)) {
    errors.code = "Coupon code can only contain uppercase letters, numbers, hyphens, and underscores.";
  }

  const discountType = form.discountType || "percentage";
  const discountValue = Number(form.discountValue);

  if (isNaN(discountValue) || discountValue <= 0) {
    errors.discountValue = "Discount value must be greater than zero.";
  } else if (discountType === "percentage" && discountValue > 100) {
    errors.discountValue = "Percentage discount cannot exceed 100%.";
  }

  if (!form.expiryDate) {
    errors.expiryDate = "Please specify an expiration date.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
