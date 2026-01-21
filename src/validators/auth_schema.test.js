import { describe, it, expect } from 'vitest';
import { loginUserSchema } from './auth_schema.js'; // Adjust path to your file

describe('Login User Schema', () => {

    it('should validate successfully with correct data', () => {
        const validData = {
            username: 'Pastorkofi',
            password: 'securePassword123'
        };

        const { error, value } = loginUserSchema.validate(validData);

        expect(error).toBeUndefined(); // No error means pass
        expect(value.username).toBe('Pastorkofi');
    });

    // TRIMMING TEST (Joi Feature)
    it('should trim whitespace from the username', () => {
        const dataWithSpaces = {
            username: '   Pastorkofi   ', // User accidentally added spaces
            password: '123'
        };

        const { error, value } = loginUserSchema.validate(dataWithSpaces);

        expect(error).toBeUndefined();
        // Verify that Joi actually removed the spaces in the output 'value'
        expect(value.username).toBe('Pastorkofi');
    });

    // ERROR MESSAGES (Custom Messages)
    it('should show custom error if username is missing', () => {
        const missingUser = {
            password: '123'
            // username is missing
        };

        const { error } = loginUserSchema.validate(missingUser);

        expect(error).toBeDefined();
        // Check if the custom message is returned
        expect(error.details[0].message).toBe('Username is required');
    });

    it('should show custom error if password is empty', () => {
        const emptyPass = {
            username: 'Pastorkofi',
            password: '' // Empty string
        };

        const { error } = loginUserSchema.validate(emptyPass);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Password is required');
    });

    it('should fail if unknown fields are present (if validation options are strict)', () => {

        const hackerInput = {
            username: 'Pastorkofi',
            password: '123',
            isAdmin: true // Malicious field
        };

    });

});