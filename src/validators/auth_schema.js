import Joi from "joi";

// Schema for login details validation
const loginUserSchema = Joi.object({
  username: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Username is required",
      "any.required": "Username is required"
    }),

  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
      "any.required": "Password is required"
    })
});



const passwordResetSchema = Joi.object({
  username: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Username is required"
    }),

  phoneNumber: Joi.string()
    .required().length(10)
    .messages({
      "any.required": "Phone number is required"
    })
});


const authenticateCodeSchema = Joi.object({
  username: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Username is required"
    }),

  code: Joi.string()
    .required().length(6).pattern(/^\d+$/)
    .messages({
      "any.required": "Code is required"
    })
});


const resetPasswordSchema = Joi.object({
  username: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Username is required"
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "any.required": "Password is required",
      "string.min": "Password must be at least 6 characters",
    })
});


export {
  loginUserSchema,
  passwordResetSchema,
  authenticateCodeSchema,
  resetPasswordSchema
};