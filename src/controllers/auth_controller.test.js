import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authController from './auth_controller.js';
import { User } from "../models/users_model.js";
import jwt from 'jsonwebtoken';



vi.mock('../models/users_model.js');
vi.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      cookies: {},
      user: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn(),
      clearCookie: vi.fn()
    };
  });



  // Login user endpoint tests
  describe('Login User', () => {
    it('should login successfully and set the refreshToken cookie', async () => {
      req.body = { username: 'PastorKofi', password: 'password123' };

      // Setup fake user
      const mockUser = {
        _id: 'user123',
        username: 'PastorKofi',
        status: 'churchAdmin',
        churchId: 'c1',
        groupId: 'g1',
        comparePassword: vi.fn().mockResolvedValue(true), // Password matches
        save: vi.fn().mockResolvedValue(true)             // Save works
      };

      // Mock JWT
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-token-string');

      await authController.loginUser(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ username: 'PastorKofi' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'fake-token-string', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'fake-token-string' }));
    });

    it('should return 400 if user not found', async () => {
      req.body = { username: 'Unknown', password: '123' };
      User.findOne.mockResolvedValue(null);

      await authController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid Credentials" });
    });

    it('should return 400 if password does not match', async () => {
      req.body = { username: 'PastorKofi', password: 'wrong' };
      const mockUser = { comparePassword: vi.fn().mockResolvedValue(false) };
      User.findOne.mockResolvedValue(mockUser);

      await authController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });



  // Refresh Token endpoint tests
  describe('RefreshToken', () => {
    
    it('should return 401 if refreshToken cookie is missing', async () => {
      req.cookies = {};
      
      await authController.refreshToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });


    it('should return 403 if token verification fails', async () => {
      // Simulate incoming cookie named 'refreshToken'
      req.cookies = { refreshToken: 'invalid-token' };

      // Mock Verify Error
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid'), null);
      });

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith("Forbidden");
    });


    it('should return 200 and new accessToken if valid', async () => {
      req.cookies = { refreshToken: 'valid-token' };

      // Mock Verify Success
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 'user123' });
      });

      // Mock User Find (with chaining .select())
      const mockUser = {
        _id: 'user123',
        refreshToken: 'valid-token',
        churchId: 'c1', 
        groupId: 'g1', 
        status: 'manager'
      };

      // Helper to mock User.findById().select()
      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      });

      // Mock Sign
      jwt.sign.mockReturnValue('new-access-token');

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        accessToken: 'new-access-token'
      }));
    });


    it('should return 403 if token reuse detected (Cookie != DB)', async () => {
      req.cookies = { refreshToken: 'old-cookie-token' };

      jwt.verify.mockImplementation((t, s, cb) => cb(null, { id: 'user123' }));

      const mockUser = {
        refreshToken: 'new-db-token'
      };

      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      });

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

});