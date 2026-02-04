import { describe, it, expect } from "vitest";

import { saveAttendanceSchema, updateAttendanceSchema } from "../../validators/attendance_schema.js";

// Declearing variables
const validId = "507f1f77bcf86cd799439011";

const allStats = {
    adultmale: 10,
    adultfemale: 10,
    youthmale: 5,
    youthfemale: 5,
    childrenmale: 2,
    childrenfemale: 2,
    newcomersmales: 0,
    newcomersfemales: 0,
    firstoffering: 100,
    secondoffering: 50
};



describe('Attendance Validation Schemas', () => {

    // Tests for Save attendance Schema
    describe('Save attendance Schema', () => {

        it('should pass when reason is null and attendance fields are provided', () => {
            // Arrange
            const payload = {
                churchId: validId,
                date: Date.now(),
                reason: null,
                ...allStats
            }

            // Act
            const { error } = saveAttendanceSchema.validate(payload);

            // Assert
            expect(error).toBeUndefined();
        })

        it('should pass when reason is provided and attendance fields are not', () => {
            // Arrange
            const payload = {
                reason: "Joint service",
                churchId: validId,
                date: Date.now()
            }

            // Act
            const { error } = saveAttendanceSchema.validate(payload);

            // Assert
            expect(error).toBeUndefined();
        })

        it('should fail when neither reason nor attendance fields are provided', () => {
            // Arrange
            const payload = {
                churchId: validId,
                date: Date.now(),
                reason: null
            }

            // Act
            const { error } = saveAttendanceSchema.validate(payload);

            // Assert
            expect(error).toBeDefined()
        })

        it('should fail when both reason and attendance fields are provided', () => {
            // Arrange
            const payload = {
                churchId: validId,
                date: Date.now(),
                reason: "Joint Service",
                ...allStats
            }

            // Act 
            const { error } = saveAttendanceSchema.validate(payload);

            // Assert
            expect(error).toBeDefined()
        })

        it('should fail when reason and some attendance fields are provided', () => {
            // Arrange
            const payload = {
                churchId: validId,
                date: Date.now(),
                reason: "Joint Service",
                childrenfemale: 2,
                newcomersmales: 0,
            }

            // Act 
            const { error } = saveAttendanceSchema.validate(payload);

            // Assert
            expect(error).toBeDefined()
        })

        it('should fail when reason is null but some attendance fields are missing', () => {
            // Arrange
            const payload = {
                churchId: validId,
                date: Date.now(),
                reason: null,
                childrenfemale: 2,
                newcomersmales: 0,
            }

            // Act 
            const { error } = saveAttendanceSchema.validate(payload);

            // Assert
            expect(error).toBeDefined()
        })

        it('should fail if churchId is not valid', () => {
            // Arrange
            const payload = {
                churchId: "507f1f77bcfcd799439011",
                date: Date.now(),
                reason: "Joint Service",
            }

            // Act 
            const { error } = saveAttendanceSchema.validate(payload);

            // Assert
            expect(error).toBeDefined();
            expect(error.details[0].message).toBe('churchId is not valid');
        })
    })



    // Test for Update Attendance Schema
    describe('Update Attendance Schema', () => {

        it('should pass with a valid update payload', () => {
            // Arrange
            const payload_1 = {
                reason: null,
                ...allStats
            }
            const payload_2 = {
                reason: "Joint Service",
            }

            // Act
            const { error: error_1 } = updateAttendanceSchema.validate(payload_1);
            const { error: error_2 } = updateAttendanceSchema.validate(payload_2);

            // Assert
            expect(error_1).toBeUndefined();
            expect(error_2).toBeUndefined();
        })

        it('should fail with an invalid update payload', () => {
            // Arrange
            const payload_1 = {
                reason: "Joint Service",
                ...allStats
            }
            const payload_2 = {
                reason: "Joint Service",
                childrenfemale: 2,
                newcomersmales: 0,
            }

            // Act
            const { error: error_1 } = updateAttendanceSchema.validate(payload_1);
            const { error: error_2 } = updateAttendanceSchema.validate(payload_2);

            // Assert
            expect(error_1).toBeDefined()
            expect(error_2).toBeDefined()
        })

        it('should fail when date or churchId is in payload', () => {
            // Arrange
            const payload_1 = {
                reason: "Joint Service",
                churchId: validId
            }
            const payload_2 = {
                reason: "Joint Service",
                date: Date.now()
            }

            // Act
            const { error: error_1 } = updateAttendanceSchema.validate(payload_1);
            const { error: error_2 } = updateAttendanceSchema.validate(payload_2);

            // Assert
            expect(error_1).toBeDefined()
            expect(error_2).toBeDefined()
        })
    })
})