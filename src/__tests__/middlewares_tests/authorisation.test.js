import { describe, it, expect, vi, beforeEach } from 'vitest';
import verifyAccessLevel from '../../middlewares/authorisation.js'; // Adjust path as needed

describe('Authorisation Middleware', () => {
  let req, res, next;

  // Reset mocks before every single test so they don't interfere with each other
  beforeEach(() => {
    req = {
      user: { status: 'manager' } // Default valid user for most tests
    };
    res = {
      status: vi.fn().mockReturnThis(), // Allows chaining .status().json()
      json: vi.fn()
    };
    next = vi.fn(); // The "next" function
  });

  // SCENARIO 1
  it('should call next() if user status is higher than required status', () => {
    // Manager (5) accessing Church Admin (1) route (5 >= 1 is TRUE -> Allow)
    req.user.status = 'manager'; 
    const middleware = verifyAccessLevel('churchAdmin');
    
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled(); // Should not send an error
  });

  it('should call next() if user status is equal to required status', () => {
    // Church Admin (1) accessing Church Admin (1) route
    req.user.status = 'churchAdmin';
    const middleware = verifyAccessLevel('churchAdmin');
    
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // SCENARIO 2: FORBIDDEN (403)
  it('should return 403 if user status is lower than required status', () => {
    // Church Admin (1) trying to access Manager (5) route
    req.user.status = 'churchAdmin';
    const middleware = verifyAccessLevel('manager');
    
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled(); // Should not let it through
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Forbidden')
    }));
  });

  // SCENARIO 3: UNAUTHORIZED (401)
  it('should return 401 if req.user is missing (not logged in)', () => {
    req.user = undefined; // User not logged in
    const middleware = verifyAccessLevel('churchAdmin');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized: User status missing" });
  });

  it('should return 401 if req.user.status is missing', () => {
    req.user = {}; // Logged in, but no role assigned
    const middleware = verifyAccessLevel('churchAdmin');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // SCENARIO 4: CONFIGURATION ERROR (500)
  it('should return 500 if the route is configured with a NON-EXISTENT role', () => {
    req.user.status = 'manager';
    // Developer made a typo in the route definition: 'superAdmin' doesn't exist in ROLE_LEVELS
    const middleware = verifyAccessLevel('superAdmin');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Internal Server Error: Invalid route configuration"
    }));
  });
  
  // SCENARIO 5: UNKNOWN USER ROLE
  it('should treat unknown user roles as rank 0 and return 403', () => {
    req.user.status = 'hacker'; // Role not in list -> defaults to 0
    const middleware = verifyAccessLevel('churchAdmin'); // Requires 1
    
    middleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
  });
});