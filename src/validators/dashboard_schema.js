
import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const dashboardStatsSchema = Joi.object({
    // Status is always required and must be one of the defined roles
  status: Joi.string()
    .valid('manager', 'groupPastor', 'groupAdmin', 'churchPastor', 'churchAdmin')
    .required(),

    // Target is required if status is not manager
  target: Joi.string()
    .valid('group', 'church')
    .when('status', {
      is: 'manager',
      then: Joi.forbidden(),
      otherwise: Joi.required()
    }),
    // ID is required if status is not manager
  id: Joi.string()
    .pattern(objectIdPattern)
    .messages({ 'string.pattern.base': 'Invalid ID format' })
    .when('status', {
      is: 'manager',
      then: Joi.forbidden(),
      otherwise: Joi.required()
    })
});

 

export {
    dashboardStatsSchema
};