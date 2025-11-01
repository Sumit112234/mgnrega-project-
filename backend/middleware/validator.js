const Joi = require('joi');


const schemas = {
  districtCode: Joi.string()
    .pattern(/^\d{3,4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid district code format (must be 3-4 digits)',
      'any.required': 'District code is required'
    }),

  stateCode: Joi.string()
    .pattern(/^\d{1,2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid state code format (must be 1-2 digits)',
      'any.required': 'State code is required'
    }),

  month: Joi.string()
    .valid('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec')
    .required()
    .messages({
      'any.only': 'Invalid month format',
      'any.required': 'Month is required'
    }),

  year: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid year format (must be YYYY-YYYY)',
      'any.required': 'Year is required'
    }),

  dateRange: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .messages({
      'string.pattern.base': 'Invalid date format (must be YYYY-MM)'
    })
};


const validateDistrictData = (req, res, next) => {
  const schema = Joi.object({
    districtCode: schemas.districtCode,
    month: schemas.month,
    year: schemas.year
  });

  const { error } = schema.validate({
    districtCode: req.params.districtCode,
    month: req.query.month,
    year: req.query.year
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: error.details.map(d => d.message)
    });
  }

  next();
};


const validateHistory = (req, res, next) => {
  const schema = Joi.object({
    districtCode: schemas.districtCode,
    startDate: schemas.dateRange.required(),
    endDate: schemas.dateRange.required()
  });

  const { error, value } = schema.validate({
    districtCode: req.params.districtCode,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: error.details.map(d => d.message)
    });
  }

  
  const start = new Date(value.startDate);
  const end = new Date(value.endDate);
  const minDate = new Date('2020-01');
  const maxDate = new Date();

  if (start < minDate || end > maxDate || start > end) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date range',
      message: 'Dates must be between 2020-01 and current month, start must be before end'
    });
  }

  next();
};


const validateStateCode = (req, res, next) => {
  const schema = Joi.object({
    stateCode: schemas.stateCode
  });

  const { error } = schema.validate({
    stateCode: req.params.stateCode
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: error.details.map(d => d.message)
    });
  }

  next();
};


const validateSyncState = (req, res, next) => {
  const schema = Joi.object({
    stateCode: schemas.stateCode,
    finYear: schemas.year.required()
  });

  const { error } = schema.validate({
    stateCode: req.params.stateCode,
    finYear: req.query.finYear
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: error.details.map(d => d.message),
      example: '/api/v1/states/09/sync?finYear=2022-2023'
    });
  }

  next();
};

module.exports = {
  validateDistrictData,
  validateHistory,
  validateStateCode,
  validateSyncState
};