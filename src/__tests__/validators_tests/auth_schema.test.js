import { describe, it, expect } from 'vitest';
import { loginUserSchema,
    passwordResetSchema,
    authenticateCodeSchema,
    resetPasswordSchema } from '../../validators/auth_schema.js';

describe('Login User Schema', () => {

    it('should validate successfully with correct data', () => {
        const validData = {
            username: 'Pastorkofi',
            password: 'securePassword123'
        };

        const { error, value } = loginUserSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value.username).toBe('Pastorkofi');
    });


    it('should trim whitespace from the username', () => {
        const dataWithSpaces = {
            username: '   Pastorkofi   ',
            password: '123'
        };

        const { error, value } = loginUserSchema.validate(dataWithSpaces);

        expect(error).toBeUndefined();
        expect(value.username).toBe('Pastorkofi');
    });


    it('should show custom error if username is missing', () => {
        const missingUser = {
            password: '123'
        };

        const { error } = loginUserSchema.validate(missingUser);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Username is required');
    });

    it('should show custom error if password is empty', () => {
        const emptyPass = {
            username: 'Pastorkofi',
            password: ''
        };

        const { error } = loginUserSchema.validate(emptyPass);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Password is required');
    });

    it('should fail if unknown fields are present (if validation options are strict)', () => {

        const hackerInput = {
            username: 'Pastorkofi',
            password: '123',
            isAdmin: true
        };

    });

});



describe('passwordResetSchema', () => {
    it('should validate a correct username and 10-digit phone number', () => {
      const valid = { username: 'kofiman', phoneNumber: '0241234567' };
      const { error, value } = passwordResetSchema.validate(valid);
      expect(error).toBeUndefined();
      expect(value.phoneNumber).toBe('0241234567');
    });

    it('should fail if phone number is not exactly 10 characters', () => {
      const invalid = { username: 'kofiman', phoneNumber: '123' };
      const { error } = passwordResetSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].type).toBe('string.length');
    });
  });



  describe('authenticateCodeSchema', () => {
    it('should validate a 6-digit numeric string', () => {
      const valid = { username: 'kofiman', code: '123456' };
      const { error } = authenticateCodeSchema.validate(valid);
      expect(error).toBeUndefined();
    });

    it('should fail if the code contains non-digits', () => {
      const invalid = { username: 'kofiman', code: '123a56' };
      const { error } = authenticateCodeSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].type).toBe('string.pattern.base');
    });

    it('should fail if the code is not exactly 6 digits', () => {
      const invalid = { username: 'kofiman', code: '12345' };
      const { error } = authenticateCodeSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].type).toBe('string.length');
    });
  });

  

  describe('resetPasswordSchema', () => {
    it('should validate a password with 6 or more characters', () => {
      const valid = { username: 'kofiman', password: 'newSecurePass' };
      const { error } = resetPasswordSchema.validate(valid);
      expect(error).toBeUndefined();
    });

    it('should fail if password is less than 6 characters', () => {
      const invalid = { username: 'kofiman', password: '12345' };
      const { error } = resetPasswordSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Password must be at least 6 characters');
    });

    it('should show custom error for missing password', () => {
      const missing = { username: 'kofiman' };
      const { error } = resetPasswordSchema.validate(missing);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Password is required');
    });
  });