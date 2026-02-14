import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const monthlyReportSchema = Joi.object({
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


export {
    monthlyReportSchema
}
