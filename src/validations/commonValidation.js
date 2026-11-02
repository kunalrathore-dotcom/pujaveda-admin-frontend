/**
 * Shared validation helpers for Admin Portal
 */

export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  return /^(?:\+91[\-\s]?)?[6-9]\d{9}$/.test(phone.trim());
};

export const isValidObjectId = (id) => {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id.trim());
};

export const sanitizeString = (val) => {
  return typeof val === "string" ? val.trim() : "";
};

