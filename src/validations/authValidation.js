import { isValidEmail } from "./commonValidation";

export const validateAdminLogin = ({ email, password }) => {
  const errors = {};
  if (!email || !email.trim()) {
    errors.email = "Please enter your admin email address.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Please enter your password.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateForgotPassword = ({ email }) => {
  const errors = {};
  if (!email || !email.trim()) {
    errors.email = "Please enter your registered email address.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateResetPassword = ({ otp, newPassword, confirmPassword }) => {
  const errors = {};
  if (!otp || !otp.trim()) {
    errors.otp = "Please enter the 6-digit verification code.";
  } else if (!/^\d{6}$/.test(otp.trim())) {
    errors.otp = "Verification code must be exactly 6 digits.";
  }

  if (!newPassword) {
    errors.newPassword = "Please enter a new password.";
  } else if (newPassword.length < 6) {
    errors.newPassword = "Password must be at least 6 characters long.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

