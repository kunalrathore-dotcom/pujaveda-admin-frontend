export const validateChargeForm = (form) => {
  const errors = {};

  const name = form.name ? String(form.name).trim() : "";
  if (!name) {
    errors.name = "Please enter the charge name (e.g., GST Tax).";
  } else if (name.length < 2) {
    errors.name = "Charge name must be at least 2 characters.";
  }

  const key = form.key ? String(form.key).trim().toLowerCase() : "";
  if (!key) {
    errors.key = "Please enter a unique key identifier (e.g., gst_tax).";
  } else if (!/^[a-z0-9_]+$/.test(key)) {
    errors.key = "Key must contain only lowercase letters, numbers, and underscores.";
  }

  const value = Number(form.value);
  if (isNaN(value) || value < 0) {
    errors.value = "Charge value cannot be negative.";
  } else if (form.type === "percentage" && value > 100) {
    errors.value = "Percentage charge cannot exceed 100%.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
