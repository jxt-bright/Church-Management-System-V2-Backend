import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const registerMemberSchema = Joi.object({

    firstName: Joi.string().trim().max(50).required().messages({
        "string.empty": "First Name is required",
        "any.required": "First Name is required"
    }),

    lastName: Joi.string().trim().max(50).required().messages({
        "string.empty": "Last Name is required",
        "any.required": "Last Name is required"
    }),

    email: Joi.string().email().allow(null, '').messages({
        "string.email": "Please provide a valid email address",
    }),

    phoneNumber: Joi.string().min(10).max(10).required().messages({
        "any.required": "Phone number is required"
    }),

    gender: Joi.string()
        .valid('Male', 'Female')
        .required()
        .messages({
            "any.only": "Gender must be either Male or Female"
        }),

    relationshipStatus: Joi.string().
        trim()
        .valid('Single', 'Married', 'Widowed', 'Separated')
        .required()
        .messages({
            "any.required": "Relationship status is a required field"
        }),

    category: Joi.string()
        .trim()
        .valid('Adult', 'Youth', 'Children')
        .required()
        .messages({
            "any.required": "Category of member is required"
        }),

    memberStatus: Joi.string()
        .trim()
        .required()
        .valid('Worker', 'Non-worker')
        .messages({
            "any.required": "Status of member is required"
        }),

    //   Optional fields
    workOrSchool: Joi.string().trim().allow(null, ''),
    levelOrPosition: Joi.string().trim().allow(null, ''),
    programOrDepartment: Joi.string().trim().allow(null, ''),
    houseAddress: Joi.string().trim().allow(null, ''),
    gpsAddress: Joi.string().trim().allow(null, ''),
    emergencyAddress: Joi.string().trim().allow(null, ''),

    emergencyName: Joi.string().trim().required().messages({
        "any.required": "Emergency contact name is required"
    }),

    emergencyContact: Joi.string().min(10).max(10).required().messages({
        "any.required": "Emergency contact phone number is required"
    }),

    emergencyRelation: Joi.string().trim().required().messages({
        "any.required": "Relationship with emergency contact is required"
    }),

    profileImage: Joi.string()
        .pattern(/^data:image\/[a-z]+;base64,/) // MUST start with data:image/...
        .allow(null) // Can be null
        .messages({
            "string.pattern.base": "Profile image must be a valid base64 image string"
        }),

    churchId: Joi.string()
        .pattern(objectIdPattern)
        .required()
        .messages({
            "string.pattern.base": "Invalid Church ID format",
            "any.required": "Church ID is required"
        })
});



export {
    registerMemberSchema,
}