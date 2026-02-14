import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const monthlyReportSchema = Joi.object({
    groupId: Joi.string()
        .hex()
        .pattern(objectIdPattern)
        .length(24)
        .optional()
        .messages({
            'string.length': 'Invalid Group ID format.',
        }),

    churchId: Joi.string()
        .hex()
        .pattern(objectIdPattern)
        .length(24)
        .optional()
        .messages({
            'string.length': 'Invalid Church ID format.',
        }),
    date: Joi.date().required().messages({
        'date.base': 'Please provide a valid date',
        'any.required': 'Service date is required'
    })
})

// At least one and only one of these two must be provided with a value
.xor('groupId', 'churchId')
.messages({
  'object.xor': 'You cannot select both a Group and a Church at the same time.',
  'object.missingVariant': 'You must select either a Group or a Church to send a message.',
});



const generalReportSchema = Joi.object({
    groupId: Joi.string()
        .hex()
        .pattern(objectIdPattern)
        .length(24)
        .allow(null, '')
        .optional()
        .messages({
            'string.length': 'Invalid Group ID format.',
        }),

    churchId: Joi.string()
        .hex()
        .pattern(objectIdPattern)
        .length(24)
        .allow(null, '')
        .optional()
        .messages({
            'string.length': 'Invalid Church ID format.',
        }),

    // Start Month is required (Format: YYYY-MM)
    startMonth: Joi.string()
        .required()
        .messages({
            'string.empty': 'Start month is required.',
            'any.required': 'Start month is required.'
        }),

    // End Month is required (Format: YYYY-MM)
    endMonth: Joi.string()
        .required()
        // Custom validation to ensure endMonth is strictly after startMonth
        .custom((value, helpers) => {
            const { startMonth } = helpers.state.ancestors[0];
            if (startMonth && value <= startMonth) {
                return helpers.message('End Month must be strictly after the Start Month.');
            }
            return value;
        })
        .messages({
            'string.empty': 'End month is required.',
            'any.required': 'End month is required.'
        })
})
// Ensures either groupId or churchId is present, but not both
.xor('groupId', 'churchId')
.messages({
  'object.xor': 'You cannot select both a Group and a Church at the same time.',
  'object.missingVariant': 'Please select a Group or a Church to generate the report.',
});



export {
    monthlyReportSchema,
    generalReportSchema
}
