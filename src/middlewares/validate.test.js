import { describe, it, expect, vi, beforeEach } from 'vitest';
import Joi from 'joi';
import validate from './validate.js';

describe('Validation Middleware', () => {
  let req, res, next;

  //  Mock schema
  const testSchema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number()
  });

  beforeEach(() => {
    // Reset mocks before each test
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });


  it('should call next() if validation passes', () => {
    req.body = { name: 'Kwame', age: 25 };
    
    const middleware = validate(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });


  it('should return 400 with specific message if validation fails', () => {
    req.body = { age: 25 }; // Missing 'name'
    
    const middleware = validate(testSchema);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'name is required' // Joi's specific error message
    });
  });


  it('should return 400 if data type is wrong', () => {
    req.body = { name: 'Kwame', age: "not-a-number" };
    
    const middleware = validate(testSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('must be a number')
    }));
  });


  it('should strip unknown fields from req.body', () => {
    // User tries to inject 'isAdmin'
    req.body = { name: 'Kwame', isAdmin: true };
    
    const middleware = validate(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    
    // Valid field remains
    expect(req.body.name).toBe('Kwame');
    // Invalid field is removed
    expect(req.body.isAdmin).toBeUndefined();
    // Validated body should strictly equal the expected schema structure
    expect(req.body).toEqual({ name: 'Kwame' });
  });
});