
import Joi from 'joi';

const validate = (schema) => {
  return (req, res, next) => {
    // Validate req.body against the schema
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,   // Will return all errors before aborting validation if set to 'false'
      stripUnknown: true  // Remove fields that are not in the schema for Security
    });

    // If there is an error, stop the request
    if (error) {
      // Extract the specific error message
      // .replace(/"/g, '') removes the quotes in the error message from JOI
      const errorMessage = error.details[0].message.replace(/"/g, '');

      return res.status(400).json({
        success: false,
        message: errorMessage 
      });
    }

    // Replace req.body with the 'value' (the cleaned/sanitized data)
    req.body = value;

    // Move to Controller
    next();
  };
};

export default validate;