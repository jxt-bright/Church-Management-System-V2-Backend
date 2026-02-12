import { describe, it, expect } from 'vitest'

import { sendMessageSchema } from '../../validators/messages_schema.js'


describe('Messages Joi Schemas', () => {
    const validObjectId = '507f1f77bcf86cd799439011';

    const baseValidData = {
        category: 'members',
        addNames: false,
        message: 'Message for testing',
        targetType: 'church'
    };

    describe('Send Message Schema', () => {

        it('should validate when only churchId is provided', () => {
            const data = { ...baseValidData, churchId: validObjectId };
            const { error } = sendMessageSchema.validate(data);
            expect(error).toBeUndefined();
        });

        it('should validate when only groupId is provided', () => {
            const data = { ...baseValidData, groupId: validObjectId, targetType: 'group' };
            const { error } = sendMessageSchema.validate(data);
            expect(error).toBeUndefined();
        });

        it('should allow optional salutation', () => {
            const data = {
                ...baseValidData,
                churchId: validObjectId,
                salutation: 'Hello'
            };
            const { error } = sendMessageSchema.validate(data);
            expect(error).toBeUndefined();
        });

        it('should fail if both churchId and groupId are provided', () => {
            const data = {
                ...baseValidData,
                churchId: validObjectId,
                groupId: validObjectId
            };
            const { error } = sendMessageSchema.validate(data);
            expect(error).toBeDefined();
        });

        it('should fail if neither churchId nor groupId are provided (XOR violation)', () => {
            const data = baseValidData;
            const { error } = sendMessageSchema.validate(data);
            expect(error).toBeDefined();
        });

        it('should fail if category is invalid', () => {
            const data = { ...baseValidData, churchId: validObjectId, category: 'aliens' };
            const { error } = sendMessageSchema.validate(data);
            expect(error).toBeDefined();
        });

        it('should fail if message is an empty string', () => {
            const data = { ...baseValidData, churchId: validObjectId, message: '' };
            const { error } = sendMessageSchema.validate(data);
            expect(error).toBeDefined();
            expect(error.details[0].message).toBe('Message content cannot be empty.');
        });

        it('should fail if an ID is not a valid 24-character hex string', () => {
            const data = { ...baseValidData, churchId: 'too-short' };
            const { error } = sendMessageSchema.validate(data);
            expect(error).toBeDefined();
        });

    })
})