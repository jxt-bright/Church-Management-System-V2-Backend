import Joi from 'joi';

const registerGroupSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Group name is required",
      "string.min": "Group name must be at least 2 characters",
      "string.max": "Group name cannot exceed 100 characters",
      "any.required": "Group name is required"
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
    })
});

export {
    registerGroupSchema
};