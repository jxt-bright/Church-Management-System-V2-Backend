import { describe, it, expect } from 'vitest';
import { monthlyReportSchema, generalReportSchema } from '../../validators/reports_schema.js'; // Update path

describe('Report Schemas Validation', () => {

  describe('monthlyReportSchema', () => {
    const validId = '507f1f77bcf86cd799439011';

    it('should validate successfully with a valid groupId and date', () => {
      const data = { groupId: validId, date: '2024-01-01' };
      const { error } = monthlyReportSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should validate successfully with a valid churchId and date', () => {
      const data = { churchId: validId, date: '2024-01-01' };
      const { error } = monthlyReportSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should fail if both groupId and churchId are provided', () => {
      const data = { groupId: validId, churchId: validId, date: '2024-01-01' };
      const { error } = monthlyReportSchema.validate(data);
      expect(error.message).toContain('You cannot select both a Group and a Church');
    });

it('should fail if neither groupId nor churchId is provided (keys missing)', () => {
    const data = { date: '2024-01-01' };
    const { error } = monthlyReportSchema.validate(data);
    
    expect(error).toBeDefined();
    expect(error.details[0].type).toBe('object.missing');
  });
  });

  describe('generalReportSchema', () => {
    const validId = '507f1f77bcf86cd799439011';

    it('should validate successfully with valid range and one ID', () => {
      const data = { 
        groupId: validId, 
        startMonth: '2023-01', 
        endMonth: '2023-05' 
      };
      const { error } = generalReportSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should fail if endMonth is NOT strictly after startMonth', () => {
      const data = { 
        churchId: validId, 
        startMonth: '2023-05', 
        endMonth: '2023-01' 
      };
      const { error } = generalReportSchema.validate(data);
      expect(error.message).toContain('End Month must be strictly after the Start Month');
    });

    it('should fail if startMonth and endMonth are identical', () => {
      const data = { 
        churchId: validId, 
        startMonth: '2023-01', 
        endMonth: '2023-01' 
      };
      const { error } = generalReportSchema.validate(data);
      expect(error.message).toContain('End Month must be strictly after the Start Month');
    });

    it('should fail if an invalid hex ID is provided', () => {
      const data = { 
        groupId: 'not-a-hex-id-123', 
        startMonth: '2023-01', 
        endMonth: '2023-02' 
      };
      const { error } = generalReportSchema.validate(data);
      expect(error).toBeDefined();
    });
  });
});