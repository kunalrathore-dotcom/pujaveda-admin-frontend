export const validateBannerForm = (form) => {
  const errors = {};

  const title = form.title ? String(form.title).trim() : "";
  if (!title) {
    errors.title = "Please enter the banner title.";
  } else if (title.length < 2) {
    errors.title = "Banner title must be at least 2 characters.";
  }

  if (!form.imageUrl || !String(form.imageUrl).trim()) {
    errors.imageUrl = "Please upload or provide a desktop banner image.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
