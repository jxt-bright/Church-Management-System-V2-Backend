import { describe, it, expect } from 'vitest';
import { registerGroupSchema } from './groups_schema.js';

describe('Register Group Schema', () => {

  // BASE OBJECT: A valid group used as a template
  const baseGroup = {
    name: 'Ashanti Regional Group',
    location: 'Kumasi, Ghana',
    pastor: 'Rev. Kwesi Mensah',
    phoneNumber: '0244123456',
    email: 'ashanti@example.com'
  };


  it('should validate a correct group object', () => {
    const { error, value } = registerGroupSchema.validate(baseGroup);

    expect(error).toBeUndefined();
    expect(value.name).toBe('Ashanti Regional Group');
  });


  it('should trim whitespace from the group name', () => {
    const input = { ...baseGroup, name: '   Western Region   ' };
    const { value } = registerGroupSchema.validate(input);

    expect(value.name).toBe('Western Region');
  });


  it('should fail if name is too short', () => {
    const input = { ...baseGroup, name: 'A' };
    const { error } = registerGroupSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Group name must be at least 2 characters');
  });


  it('should fail if name is too long', () => {
    const input = { ...baseGroup, name: 'a'.repeat(101) };
    const { error } = registerGroupSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Group name cannot exceed 100 characters');
  });


  it('should fail if name is missing', () => {
    // Destructure to remove 'name' from the base object
    const { name, ...missingNameGroup } = baseGroup;
    const { error } = registerGroupSchema.validate(missingNameGroup);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Group name is required');
  });


  it('should fail if location is missing', () => {
    const { location, ...input } = baseGroup;
    const { error } = registerGroupSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Location is required');
  });


  it('should fail if pastor is missing', () => {
    const { pastor, ...input } = baseGroup;
    const { error } = registerGroupSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Pastor name is required');
  });


  it('should fail if phone number has invalid characters', () => {
    const input = { ...baseGroup, phoneNumber: '0244-ABC-56' };
    const { error } = registerGroupSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Phone number contains invalid characters');
  });


  it('should fail if phone number is too short', () => {
    const input = { ...baseGroup, phoneNumber: '123' };
    const { error } = registerGroupSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Phone number must be at least 10 digits');
  });


  it('should pass if email is empty string (optional)', () => {
    const input = { ...baseGroup, email: '' };
    const { error } = registerGroupSchema.validate(input);
    expect(error).toBeUndefined();
  });
  

  it('should fail if email is invalid format', () => {
    const input = { ...baseGroup, email: 'not-an-email-address' };
    const { error } = registerGroupSchema.validate(input);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Please provide a valid email address');
  });

});