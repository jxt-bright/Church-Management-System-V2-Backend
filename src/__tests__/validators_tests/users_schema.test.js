import { describe, it, expect } from 'vitest';
import { registerUserSchema, updateUserSchema } from '../../validators/users_schema.js'; 

// Mock user
const getValidUser = () => ({
  username: 'GroupAdminUser',
  password: 'securePassword123',
  status: 'groupAdmin',
  memberId: '507f1f77bcf86cd799439011'
});

describe('Register User Schema', () => {

  it('should validate a correct user object', () => {
    const validUser = getValidUser();
    const { error, value } = registerUserSchema.validate(validUser);

    expect(error).toBeUndefined();
    expect(value.username).toBe('GroupAdminUser');
  });


  it('should fail if username is too short (< 4 chars)', () => {
    const input = { ...getValidUser(), username: 'abc' };
    const { error } = registerUserSchema.validate(input);
    
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Username must be at least 4 characters');
  });


  it('should fail if username is too long (> 20 chars)', () => {
    const input = { ...getValidUser(), username: 'A'.repeat(21) };
    const { error } = registerUserSchema.validate(input);
    
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Username must not exceed 20 characters');
  });


  it('should fail if username is missing', () => {
    const { username, ...missingUsername } = getValidUser();
    const { error } = registerUserSchema.validate(missingUsername);

    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Username is required');
  });


  it('should fail if password is too short less than 6 characters', () => {
    const input = { ...getValidUser(), password: '12345' };
    const { error } = registerUserSchema.validate(input);
    
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Password must be at least 6 characters');
  });


  it('should accept all valid status roles', () => {
    const validRoles = ["manager", "groupPastor", "groupAdmin", "churchPastor", "churchAdmin"];
    
    validRoles.forEach(role => {
      const input = { ...getValidUser(), status: role };
      const { error } = registerUserSchema.validate(input);
      expect(error).toBeUndefined();
    });
  });


  it('should reject an invalid status', () => {
    const input = { ...getValidUser(), status: 'SuperAdmin' };
    const { error } = registerUserSchema.validate(input);
    
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Invalid User Status');
  });


  it('should fail if memberId is not a valid ObjectId (regex check)', () => {
    const input = { ...getValidUser(), memberId: 'invalid-id-123' };
    const { error } = registerUserSchema.validate(input);
    
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Invalid ObjectId format');
  });


  it('should fail if memberId is missing', () => {
    const { memberId, ...missingId } = getValidUser();
    const { error } = registerUserSchema.validate(missingId);
    
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Member ID is required');
  });

});



describe('Update User Schema', () => {
  
  it('should allow update without password', () => {
    const userWithoutPassword = {
      username: 'UpdatedName',
      status: 'manager',
      memberId: '507f1f77bcf86cd799439011'
    };

    const { error } = updateUserSchema.validate(userWithoutPassword);
    expect(error).toBeUndefined();
  });


  it('should still enforce validation on other fields', () => {
    const invalidUpdate = {
      username: 'abc',
      status: 'manager',
      memberId: '507f1f77bcf86cd799439011'
    };

    const { error } = updateUserSchema.validate(invalidUpdate);
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Username must be at least 4 characters');
  });
});