/**
 * Shared validation helpers for Admin Portal
 */

export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidPhone = (phone) => {
  if (!phone) return true; // optional
  const cleaned = String(phone).replace(/[\s\-()]/g, "");
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
};

export const isValidObjectId = (id) => {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id.trim());
};

export const sanitizeString = (val) => {
  return typeof val === "string" ? val.trim() : "";
};
