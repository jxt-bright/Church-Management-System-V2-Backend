import { describe, it, expect } from 'vitest';
import { registerMemberSchema } from '../../validators/members_schema.js';

// Mock member
const getValidMember = () => ({
  firstName: 'Kwame',
  lastName: 'Mensah',
  email: 'kwame@test.com',
  phoneNumber: '0244123456',
  gender: 'Male',              
  relationshipStatus: 'Single', 
  category: 'Adult', 
  memberStatus: 'Worker',
  
  emergencyName: 'Papa Mensah',
  emergencyContact: '0200987654',
  emergencyRelation: 'Father',
  
  churchId: '507f1f77bcf86cd799439011', 

  profileImage: null,
  workOrSchool: ''
});

describe('Register Member Schema', () => {

  it('should validate a correct member object', () => {
    const validMember = getValidMember();
    const { error, value } = registerMemberSchema.validate(validMember);

    expect(error).toBeUndefined();
    expect(value.firstName).toBe('Kwame');
  });

  
  it('should accept all valid Genders', () => {
    ['Male', 'Female'].forEach(g => {
      const input = { ...getValidMember(), gender: g };
      const { error } = registerMemberSchema.validate(input);
      expect(error).toBeUndefined();
    });
  });


  it('should reject invalid Gender (Case Sensitive)', () => {
    const input = { ...getValidMember(), gender: 'male' }; // Lowercase 'm'
    const { error } = registerMemberSchema.validate(input);
    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('Gender must be either Male or Female');
  });


  it('should accept all valid Categories', () => {
    ['Adult', 'Youth', 'Children'].forEach(cat => {
      const input = { ...getValidMember(), category: cat };
      const { error } = registerMemberSchema.validate(input);
      expect(error).toBeUndefined();
    });
  });


  it('should accept all valid Member Statuses', () => {
    ['Worker', 'Non-worker'].forEach(status => {
      const input = { ...getValidMember(), memberStatus: status };
      const { error } = registerMemberSchema.validate(input);
      expect(error).toBeUndefined();
    });
  });


  it('should reject invalid Member Status', () => {
    const input = { ...getValidMember(), memberStatus: 'Visitor' };
    const { error } = registerMemberSchema.validate(input);
    expect(error).toBeDefined();
  });


  it('should fail if phone number is not exactly 10 digits', () => {
    const shortPhone = { ...getValidMember(), phoneNumber: '024' };
    const { error } = registerMemberSchema.validate(shortPhone);
    expect(error).toBeDefined();
  });


  it('should fail if email is invalid format', () => {
    const badEmail = { ...getValidMember(), email: 'not-an-email' };
    const { error } = registerMemberSchema.validate(badEmail);
    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('valid email address');
  });


  it('should allow null or empty email', () => {
    const noEmail = { ...getValidMember(), email: '' };
    const { error } = registerMemberSchema.validate(noEmail);
    expect(error).toBeUndefined();
  });


  it('should accept a valid Base64 string', () => {
    const input = getValidMember();
    // A valid base64 string pattern
    input.profileImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    
    const { error } = registerMemberSchema.validate(input);
    expect(error).toBeUndefined();
  });


  it('should fail if image is a regular URL', () => {
    const input = { ...getValidMember(), profileImage: 'https://example.com/pic.jpg' };
    const { error } = registerMemberSchema.validate(input);
    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('valid base64 image string');
  });

  
  it('should fail if churchId is missing', () => {
    const { churchId, ...missingId } = getValidMember();
    const { error } = registerMemberSchema.validate(missingId);
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Church ID is required');
  });
  

  it('should fail if churchId is invalid format', () => {
    const invalidId = { ...getValidMember(), churchId: '12345' };
    const { error } = registerMemberSchema.validate(invalidId);
    expect(error).toBeDefined();
    expect(error.details[0].message).toBe('Invalid Church ID format');
  });

});