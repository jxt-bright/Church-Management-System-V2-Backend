import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { User } from '../../models/users_model.js';
import { PasswordReset } from '../../models/passwordReset_model.js';
import {
  authenticateUser,
  refreshUserToken,
  requestPasswordReset,
  authenticateCode,
  resetPassword
} from '../../services/auth.service.js';
import smsProvider from '../../utils/smsProvider.utils.js';

vi.mock('../../models/users_model.js');
vi.mock('../../models/passwordReset_model.js');
vi.mock('../../utils/smsProvider.utils.js');
vi.mock('jsonwebtoken');



describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  describe('authenticateUser', () => {
    it('authenticates user and returns tokens', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'PastorKofi',
        churchId: 'c1',
        groupId: 'g1',
        status: 'manager',
        comparePassword: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValueOnce('access-token');
      jwt.sign.mockReturnValueOnce('refresh-token');

      const result = await authenticateUser('PastorKofi', 'password123');

      expect(User.findOne).toHaveBeenCalledWith({ username: 'PastorKofi' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(mockUser.save).toHaveBeenCalled();

      expect(result).toEqual({
        user: {
          id: mockUser._id,
          churchId: 'c1',
          groupId: 'g1',
          status: 'manager'
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });

    it('throws error if user does not exist', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        authenticateUser('unknown', '123')
      ).rejects.toThrow('Invalid Credentials');
    });

    it('throws error if password is incorrect', async () => {
      const mockUser = {
        comparePassword: vi.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockUser);

      await expect(
        authenticateUser('PastorKofi', 'wrong')
      ).rejects.toThrow('Invalid Credentials');
    });
  });



  describe('refreshUserToken', () => {
    it('returns new access token if refresh token is valid', async () => {
      const mockUser = {
        _id: 'user123',
        churchId: 'c1',
        groupId: 'g1',
        status: 'manager',
        refreshToken: 'valid-token'
      };

      jwt.verify.mockImplementation((token, secret, cb) => {
        cb(null, { id: 'user123' });
      });

      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      });

      jwt.sign.mockReturnValue('new-access-token');

      const result = await refreshUserToken('valid-token');

      expect(jwt.verify).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();

      expect(result).toEqual({
        user: {
          id: 'user123',
          churchId: 'c1',
          groupId: 'g1',
          status: 'manager'
        },
        accessToken: 'new-access-token'
      });
    });

    it('throws Forbidden if jwt verification fails', async () => {
      jwt.verify.mockImplementation((t, s, cb) => {
        cb(new Error('Invalid'), null);
      });

      await expect(
        refreshUserToken('bad-token')
      ).rejects.toThrow('Forbidden');
    });

    it('throws Forbidden if user not found', async () => {
      jwt.verify.mockImplementation((t, s, cb) => {
        cb(null, { id: 'user123' });
      });

      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      });

      await expect(
        refreshUserToken('valid-token')
      ).rejects.toThrow('Forbidden');
    });

    it('throws Forbidden if refresh token mismatch (reuse detected)', async () => {
      jwt.verify.mockImplementation((t, s, cb) => {
        cb(null, { id: 'user123' });
      });

      const mockUser = {
        refreshToken: 'db-token'
      };

      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      });

      await expect(
        refreshUserToken('cookie-token')
      ).rejects.toThrow('Forbidden');
    });
  });



  describe('requestPasswordReset', () => {
    const credentials = { username: 'PastorKofi', phoneNumber: '0241234567' };

    it('sends an SMS and saves reset record if credentials match', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'PastorKofi',
        memberId: { phoneNumber: '0241234567' }
      };

      // Mock the populate chain
      User.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockUser)
      });
      
      PasswordReset.deleteOne.mockResolvedValue({});
      // Mock the save method on the new instance
      vi.spyOn(PasswordReset.prototype, 'save').mockResolvedValue({});

      await requestPasswordReset(credentials);

      expect(smsProvider.send).toHaveBeenCalledWith(
        expect.stringContaining('0241234567'), 
        expect.stringContaining('Password reset code')
      );
      expect(PasswordReset.deleteOne).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('throws 404 if user is not found', async () => {
      User.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      });

      await expect(requestPasswordReset(credentials)).rejects.toSatisfy((err) => {
        return err.message === 'Invalid credentials' && err.statusCode === 404;
      });
    });

    it('throws 400 if phone number does not match member record', async () => {
      const mockUser = {
        _id: 'user123',
        memberId: { phoneNumber: 'wrong-number' }
      };

      User.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockUser)
      });

      await expect(requestPasswordReset(credentials)).rejects.toSatisfy((err) => {
        return err.message === 'Invalid credentials' && err.statusCode === 400;
      });
    });
  });



  describe('authenticateCode', () => {
    const credentials = { username: 'PastorKofi', code: '123456' };

    it('returns valid:true if code matches', async () => {
      User.findOne.mockResolvedValue({ _id: 'user123' });
      const mockResetRecord = {
        compareCode: vi.fn().mockResolvedValue(true)
      };
      PasswordReset.findOne.mockResolvedValue(mockResetRecord);

      const result = await authenticateCode(credentials);

      expect(result).toEqual({ valid: true });
      expect(mockResetRecord.compareCode).toHaveBeenCalledWith('123456');
    });

    it('throws 400 if code is incorrect', async () => {
      User.findOne.mockResolvedValue({ _id: 'user123' });
      PasswordReset.findOne.mockResolvedValue({
        compareCode: vi.fn().mockResolvedValue(false)
      });

      await expect(authenticateCode(credentials)).rejects.toSatisfy((err) => {
        return err.message === 'Invalid verification code' && err.statusCode === 400;
      });
    });
  });



  describe('resetPassword', () => {
    it('updates user password and saves successfully', async () => {
      const mockUser = {
        username: 'PastorKofi',
        password: 'oldPassword',
        save: vi.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(mockUser);

      const result = await resetPassword({ username: 'PastorKofi', password: 'newPassword123' });

      expect(mockUser.password).toBe('newPassword123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: "Password updated successfully" });
    });

    it('throws 404 if user is not found during password reset', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(resetPassword({ username: 'ghost', password: '123' })).rejects.toSatisfy((err) => {
        return err.message === 'User not found' && err.statusCode === 404;
      });
    });
  });
});
