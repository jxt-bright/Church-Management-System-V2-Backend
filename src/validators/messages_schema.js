
import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const sendMessageSchema = Joi.object({

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

  category: Joi.string()
    .valid('members', 'workers', 'adults', 'youths', 'males', 'females')
    .required()
    .messages({
      'any.required': 'Recipient category is required.',
    }),

  salutation: Joi.string()
    .allow(null, '')
    .optional(),

  addNames: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Please specify if names should be added to the message.',
    }),

  message: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Message content cannot be empty.',
      'any.required': 'Message content is required.',
    }),

  targetType: Joi.string()
    .valid('church', 'group')
    .required()
    .messages({
      'any.only': 'Target type must be either "church" or "group".',
    }),
})

// At least one and only one of these two must be provided with a value
.xor('groupId', 'churchId')
.messages({
  'object.xor': 'You cannot select both a Group and a Church at the same time.',
  'object.missingVariant': 'You must select either a Group or a Church to send a message.',
});



export {
    sendMessageSchema,
}