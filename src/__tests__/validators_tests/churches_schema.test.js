import { describe, it, expect } from 'vitest';
import { registerChurchSchema } from '../../validators/churches_schema.js'; 

describe('Register Church Schema', () => {

  // Mock church
  const baseChurch = {
    name: 'Grace Baptist Church',
    location: 'Accra, Ghana',
    pastor: 'Rev. John Doe',
    phoneNumber: '0244123456',
    email: 'grace@example.com',
    groupId: '507f1f77bcf86cd799439011'
  };

  it('should validate a correct church object', () => {
    const { error, value } = registerChurchSchema.validate(baseChurch);

    expect(error).toBeUndefined(); 
    expect(value.name).toBe('Grace Baptist Church');
  });


  it('should trim whitespace from the church name', () => {
    const input = { ...baseChurch, name: '   Holy Ghost Temple   ' };
    const { value } = registerChurchSchema.validate(input);
    
    // Verify .trim() worked
    expect(value.name).toBe('Holy Ghost Temple');
  });


  it('should fail if name is too short', () => {
    const input = { ...baseChurch, name: 'A' };
    const { error } = registerChurchSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Church name must be at least 2 characters');
  });


  it('should fail if name is missing', () => {
    // We create a new object without the 'name' property
    const { name, ...missingName } = baseChurch; 
    const { error } = registerChurchSchema.validate(missingName);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Church name is required');
  });


  it('should fail if location is missing', () => {
    const { location, ...missingLoc } = baseChurch;
    const { error } = registerChurchSchema.validate(missingLoc);
    
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Location is required');
  });


  it('should fail if pastor is missing', () => {
    const { pastor, ...missingPastor } = baseChurch;
    const { error } = registerChurchSchema.validate(missingPastor);
    
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Pastor name is required');
  });


  it('should fail if phone number has invalid characters', () => {
    const input = { ...baseChurch, phoneNumber: '0244-ABC-5' };
    const { error } = registerChurchSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Phone number contains invalid characters');
  });


  it('should allow empty email (optional)', () => {
    const input = { ...baseChurch, email: '' };
    const { error } = registerChurchSchema.validate(input);
    expect(error).toBeUndefined();
  });


  it('should fail if email is invalid format', () => {
    const input = { ...baseChurch, email: 'not-an-email' };
    const { error } = registerChurchSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Please provide a valid email address');
  });


  it('should fail if groupId contains invalid characters (non-hex)', () => {
    const input = { ...baseChurch, groupId: 'ZZZf1f77bcf86cd799439011' };
    const { error } = registerChurchSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Invalid Group ID format');
  });


  it('should fail if groupId is the wrong length', () => {
    const input = { ...baseChurch, groupId: '12345' };
    const { error } = registerChurchSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Invalid Group ID format');
  });

});