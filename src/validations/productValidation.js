export const validateProductForm = (form) => {
  const errors = {};

  const name = form.name ? String(form.name).trim() : "";
  if (!name) {
    errors.name = "Please enter the product name.";
  } else if (name.length < 2) {
    errors.name = "Product name must contain at least 2 characters.";
  } else if (name.length > 200) {
    errors.name = "Product name cannot exceed 200 characters.";
  }

  const price = Number(form.price);
  if (isNaN(price) || form.price === "" || form.price === null || form.price === undefined) {
    errors.price = "Please enter a valid selling price.";
  } else if (price < 0) {
    errors.price = "Price cannot be negative.";
  }

  if (form.discountPrice !== "" && form.discountPrice !== null && form.discountPrice !== undefined) {
    const discountPrice = Number(form.discountPrice);
    if (isNaN(discountPrice) || discountPrice < 0) {
      errors.discountPrice = "Discount price must be a valid positive number.";
    } else if (discountPrice >= price && price > 0) {
      errors.discountPrice = "Discount price must be strictly less than the regular price.";
    }
  }

  const stock = Number(form.stock);
  if (isNaN(stock) || form.stock === "" || form.stock === null || form.stock === undefined) {
    errors.stock = "Please enter the initial inventory stock quantity.";
  } else if (stock < 0 || !Number.isInteger(stock)) {
    errors.stock = "Stock must be a non-negative integer.";
  }

  if (!form.categoryId || !String(form.categoryId).trim()) {
    errors.categoryId = "Please select a category for this product.";
  }

  const images = Array.isArray(form.images) ? form.images.filter(Boolean) : [];
  if (images.length === 0) {
    errors.images = "Please provide or upload at least one product image.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

