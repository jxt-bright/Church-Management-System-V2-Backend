import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authController from '../../controllers/auth_controller.js';
import * as authService from '../../services/auth.service.js';

vi.mock('../../services/auth.service.js');



describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, cookies: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn()
    };
  });



  describe('loginUser', () => {
    it('logs in user and sets refreshToken cookie with correct security flags', async () => {
      req.body = { username: 'PastorKofi', password: 'password123' };
      const mockResult = {
        user: { id: '1', name: 'Kofi' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      authService.authenticateUser.mockResolvedValue(mockResult);

      await authController.loginUser(req, res);

      // Verify Service Call
      expect(authService.authenticateUser).toHaveBeenCalledWith('PastorKofi', 'password123');

      // Verify Cookie Security
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: "Strict",
          maxAge: 43200000 // 12 hrs in ms
        })
      );

      // Verify Response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "User Logged In",
        user: mockResult.user,
        accessToken: mockResult.accessToken
      });
    });

    it('returns 400 on invalid credentials', async () => {
      authService.authenticateUser.mockRejectedValue(new Error('Invalid Credentials'));
      await authController.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Credentials' });
    });

    it('returns 500 on unexpected service failure', async () => {
        authService.authenticateUser.mockRejectedValue(new Error('Database Down'));
        await authController.loginUser(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
    });
  });


  
  describe('refreshToken', () => {
    it('returns 401 if refresh cookie is missing', async () => {
      req.cookies = {}; // No token
      await authController.refreshToken(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('returns 403 if service rejects the token', async () => {
      req.cookies = { refreshToken: 'expired-token' };
      authService.refreshUserToken.mockRejectedValue(new Error('Forbidden'));

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith('Forbidden');
    });

    it('returns 200 and new accessToken on success', async () => {
      req.cookies = { refreshToken: 'valid-token' };
      const mockResult = { user: { id: '1' }, accessToken: 'new-access' };
      authService.refreshUserToken.mockResolvedValue(mockResult);

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: mockResult.user,
        accessToken: mockResult.accessToken
      });
    });
  });
});