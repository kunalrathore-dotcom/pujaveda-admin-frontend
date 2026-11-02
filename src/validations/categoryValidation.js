export const validateCategoryForm = (form) => {
  const errors = {};

  const name = form.name ? String(form.name).trim() : "";
  if (!name) {
    errors.name = "Please enter the category name.";
  } else if (name.length < 2) {
    errors.name = "Category name must be at least 2 characters.";
  } else if (name.length > 100) {
    errors.name = "Category name cannot exceed 100 characters.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateSubcategoryForm = (form) => {
  const errors = {};

  const name = form.name ? String(form.name).trim() : "";
  if (!name) {
    errors.name = "Please enter the subcategory name.";
  } else if (name.length < 2) {
    errors.name = "Subcategory name must be at least 2 characters.";
  } else if (name.length > 100) {
    errors.name = "Subcategory name cannot exceed 100 characters.";
  }

  if (!form.categoryId || !String(form.categoryId).trim()) {
    errors.categoryId = "Please select a parent category.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
