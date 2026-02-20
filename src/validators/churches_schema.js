import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const registerChurchSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Church name is required",
      "string.min": "Church name must be at least 2 characters",
      "any.required": "Church name is required"
    }),

  location: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Location is required",
      "string.min": "Location must be at least 2 characters",
      "any.required": "Location is required"
    }),

  pastor: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Pastor name is required",
      "string.min": "Pastor name must be at least 2 characters",
      "any.required": "Pastor name is required"
    }),

  phoneNumber: Joi.string()
    .trim()
    .min(10)
    .max(10)
    .pattern(/^[0-9+\s-]+$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.min": "Phone number must be at least 10 digits",
      "string.pattern.base": "Phone number contains invalid characters",
      "any.required": "Phone number is required"
    }),

  email: Joi.string()
    .trim()
    .email()
    .allow('')
    .optional()
    .messages({
      "string.email": "Please provide a valid email address"
    }),

  groupId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      "string.pattern.base": "Invalid Group ID format",
      "any.required": "Group ID is required"
    })
});

export {
    registerChurchSchema
}