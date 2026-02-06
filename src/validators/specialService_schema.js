
import Joi from 'joi';

const specialServiceSchema = {
    // Schema for Save record
    create: Joi.object({
        date: Joi.date().required().messages({
            'date.base': 'Please provide a valid date',
            'any.required': 'Service date is required'
        }),
        adults: Joi.number().integer().min(0).default(0).required(),
        youths: Joi.number().integer().min(0).default(0).required(),
        children: Joi.number().integer().min(0).default(0).required(),
        category: Joi.string()
            .valid('Home Caring Fellowship', 'GCK', 'Seminar')
            .required()
            .messages({
                'any.only': 'Category must be Home Caring Fellowship, GCK, or Seminar'
            }),
        churchId: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid Church ID format'
            })
    }),

    // Update record schema
    update: Joi.object({
        date: Joi.date().optional(),
        adults: Joi.number().integer().min(0).optional(),
        youths: Joi.number().integer().min(0).optional(),
        children: Joi.number().integer().min(0).optional(),
        category: Joi.string()
            .valid('Home Caring Fellowship', 'GCK', 'Seminar')
            .optional(),
        churchId: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional()
    }).min(1), // Ensures at least one field is provided for update

    // Fetch Records schema
    fetch: Joi.object({
        month: Joi.string()
            .regex(/^\d{4}-\d{2}$/) // Matches YYYY-MM
            .required()
            .messages({
                'string.pattern.base': 'Month must be in YYYY-MM format'
            }),
        category: Joi.string()
            .valid('Home Caring Fellowship', 'GCK', 'Seminar')
            .required(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(6),
        churchId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
        groupId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
    }),
}


export default specialServiceSchema;