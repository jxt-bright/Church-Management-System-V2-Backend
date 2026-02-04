import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;


// If 'reason' is null this field is required
const attendanceRule = Joi.number().integer().min(0)
    .when('reason', {
        is: null,
        then: Joi.required(),
        otherwise: Joi.forbidden() 
    });

const saveAttendanceSchema = Joi.object({
    reason: Joi.string().trim().allow(null),

    date: Joi.date()
        .required(),

    adultmale: attendanceRule,
    adultfemale: attendanceRule,
    youthmale: attendanceRule,
    youthfemale: attendanceRule,
    childrenmale: attendanceRule,
    childrenfemale: attendanceRule,
    newcomersmales: attendanceRule,
    newcomersfemales: attendanceRule,
    firstoffering: attendanceRule,
    secondoffering: attendanceRule,

    // dayName: Joi.string()
    //     .trim()
    //     .required(),

    churchId: Joi.string()
        .pattern(objectIdPattern)
        .required()
        .messages({
            'string.pattern.base': 'churchId is not valid'
        })
});


// Update Schema
const updateAttendanceSchema = saveAttendanceSchema.fork(['churchId', 'date'], (schema) => schema.forbidden()); 

export {
    saveAttendanceSchema,
    updateAttendanceSchema
}