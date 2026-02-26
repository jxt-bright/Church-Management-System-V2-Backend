import { describe, it, expect } from 'vitest';
import { dashboardStatsSchema } from '../../validators/dashboard_schema.js';

describe('dashboardStatsSchema Validation', () => {
  
  describe('Manager Role', () => {
    it('should validate a valid manager request', () => {
      const data = { status: 'manager' };
      const { error } = dashboardStatsSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should fail if manager provides a target or id', () => {
      const data = { 
        status: 'manager', 
        target: 'group', 
        id: '65d1234567890abcdef12345' 
      };
      const { error } = dashboardStatsSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toMatch(/"target" is not allowed/);
    });
  });

  describe('Group/Church Roles', () => {
    const validId = '65d1234567890abcdef12345';

    it('should validate a valid groupAdmin request', () => {
      const data = { 
        status: 'groupAdmin', 
        target: 'group', 
        id: validId 
      };
      const { error } = dashboardStatsSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should validate a valid churchPastor request', () => {
      const data = { 
        status: 'churchPastor', 
        target: 'church', 
        id: validId 
      };
      const { error } = dashboardStatsSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should fail if target is missing for churchAdmin', () => {
      const data = { status: 'churchAdmin', id: validId };
      const { error } = dashboardStatsSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toMatch(/"target" is required/);
    });

    it('should fail if id is missing for groupPastor', () => {
      const data = { status: 'groupPastor', target: 'group' };
      const { error } = dashboardStatsSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toMatch(/"id" is required/);
    });
  });

  describe('Invalid Inputs', () => {
    it('should fail on invalid status', () => {
      const data = { status: 'superAdmin' };
      const { error } = dashboardStatsSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toMatch(/"status" must be one of/);
    });

    it('should fail on malformed ObjectID', () => {
      const data = { 
        status: 'churchAdmin', 
        target: 'church', 
        id: 'invalid-id-123' 
      };
      const { error } = dashboardStatsSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toBe('Invalid ID format');
    });

    it('should fail on invalid target string', () => {
      const data = { 
        status: 'groupAdmin', 
        target: 'invalid-target', 
        id: '65d1234567890abcdef12345' 
      };
      const { error } = dashboardStatsSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toMatch(/"target" must be one of \[group, church\]/);
    });
  });
});