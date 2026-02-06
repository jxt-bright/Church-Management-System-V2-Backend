import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userController from '../../controllers/users_controller.js';
import * as userService from '../../services/users.service.js';

vi.mock('../../services/users.service.js');



describe('Users Controller', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();
        req = { body: {}, params: {}, query: {}, user: { _id: 'admin123', status: 'manager' } };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });



    describe('registerUser', () => {
        it('should return 201 on success', async () => {
            userService.createUser.mockResolvedValue({ _id: '1' });
            await userController.registerUser(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 400 when registering a manager is forbidden', async () => {
            userService.createUser.mockRejectedValue(new Error("Cannot Register a user with status of Manager."));
            await userController.registerUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Cannot Register a user with status of Manager." });
        });
    });



    describe('getUsers', () => {
        it('should return 200 and result data', async () => {
            const mockData = { users: [], totalPages: 1 };
            userService.fetchUsers.mockResolvedValue(mockData);
            await userController.getUsers(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockData);
        });
    });



    describe('deleteUser', () => {
        it('should return 400 if user tries to delete themselves', async () => {
            userService.removeUser.mockRejectedValue(new Error("You cannot delete your own account"));
            await userController.deleteUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'You cannot delete your own account' });
        });
    });
});