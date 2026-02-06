import { describe, it, expect } from 'vitest';
import specialServiceSchema from '../../validators/specialService_schema.js';



describe('Special Service Joi Schemas', () => {

    describe('Create Schema', () => {
        it('should validate a valid creation object', () => {
            const payload = {
                date: '2026-02-05',
                adults: 50,
                youths: 30,
                children: 20,
                category: 'GCK',
                churchId: '507f1f77bcf86cd799439011' // Valid ObjectId format
            };
            const { error, value } = specialServiceSchema.create.validate(payload);
            expect(error).toBeUndefined();
            expect(value.category).toBe('GCK');
        });

        it('should fail if a required field is missing', () => {
            const payload = { adults: 10 }; // Missing date, churchId
            const { error } = specialServiceSchema.create.validate(payload);
            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('is required');
        });

        it('should fail if category is not in the enum', () => {
            const payload = {
                date: '2026-02-05',
                category: 'InvalidCategory',
                churchId: '507f1f77bcf86cd799439011',
                adults: 10,
                youths: 10,
                children: 10
            };
            const { error } = specialServiceSchema.create.validate(payload);

            // This checks the internal Joi code
            expect(error.details[0].type).toBe('any.only');
        });
    });


    describe('Update Schema', () => {
        it('should validate when only one field is provided', () => {
            const payload = { adults: 100 };
            const { error } = specialServiceSchema.update.validate(payload);
            expect(error).toBeUndefined();
        });

        it('should fail if an empty object is provided', () => {
            const payload = {};
            const { error } = specialServiceSchema.update.validate(payload);
            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('must have at least 1 key');
        });

        it('should fail if invalid churchId format is used', () => {
            const payload = { churchId: 'short-id' };
            const { error } = specialServiceSchema.update.validate(payload);
            expect(error).toBeDefined();
        });
    });


    describe('Fetch Schema', () => {
        it('should validate correct YYYY-MM format for month', () => {
            const query = { month: '2026-02', category: 'Seminar' };
            const { error } = specialServiceSchema.fetch.validate(query);
            expect(error).toBeUndefined();
        });

        it('should fail if month format is incorrect', () => {
            const query = { month: '02-2026', category: 'Seminar' };
            const { error } = specialServiceSchema.fetch.validate(query);
            expect(error).toBeDefined();
            expect(error.details[0].message).toBe('Month must be in YYYY-MM format');
        });

        it('should apply default values for page and limit', () => {
            const query = { month: '2026-02', category: 'Seminar' };
            const { value } = specialServiceSchema.fetch.validate(query);
            expect(value.page).toBe(1);
            expect(value.limit).toBe(6);
        });
    });
});