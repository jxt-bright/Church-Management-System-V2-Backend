import Joi from "joi";

// Helper to validate MongoDB ObjectId
// I use Regex here because it is faster and stricter than mongoose.isValid()
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  "string.pattern.base": "Invalid ObjectId format"
});


// Schema for registering user details validation
const registerUserSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(4)
    .max(20)
    .required()
    .messages({
      "string.empty": "Username is required",
      "string.min": "Username must be at least 4 characters",
      "string.max": "Username must not exceed 20 characters",
      "any.required": "Username is required"
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
    }),

  status: Joi.string()
    .trim()
    .valid("manager", "groupPastor", "groupAdmin", "churchPastor", "churchAdmin")
    .required()
    .messages({
      "string.empty": "Status is required",
      "any.only": "Invalid User Status" // Error if value doesn't match list
    }),

  memberId: objectId.required().messages({
    "any.required": "Member ID is required",
  }),

  // churchId: objectId.required().messages({
  //   "any.required": "Church ID is required",
  // }),

  // groupId: objectId.required().messages({
  //   "any.required": "Group ID is required",
  // }),
});


const updateUserSchema = registerUserSchema.fork(
  ['password'], // Array of keys to modify
  (schema) => schema.optional() // The modification to apply
);



export {
  registerUserSchema,
  updateUserSchema
};