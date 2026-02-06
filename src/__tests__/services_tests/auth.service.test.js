import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { User } from '../../models/users_model.js';
import {
  authenticateUser,
  refreshUserToken
} from '../../services/auth.service.js';

vi.mock('../../models/users_model.js');
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
});
