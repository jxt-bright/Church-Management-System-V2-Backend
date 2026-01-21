import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { User } from "../models/users_model.js";
import { Member } from "../models/members_model.js";
import { 
    registerUser, 
    getUsers, 
    getUserById, 
    updateUser, 
    deleteUser 
} from './users_controller.js';

// Mock models
vi.mock('../models/users_model.js');
vi.mock('../models/members_model.js');



describe('Users Controller', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        //  Mock req
        req = {
            body: {},
            params: {},
            query: {},
            user: { 
                _id: 'manager-admin-id', 
                status: 'manager', 
                groupId: 'group-123', 
                churchId: 'church-123' 
            }
        };

        // Mock res
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });



    // Tests for register user endpoint
    describe('registerUser', () => {
        beforeEach(() => {
            req.body = { 
                username: 'NewUser', 
                password: 'password123', 
                memberId: 'member-123',
                status: 'churchAdmin'
            };
        });

        it('should register a new user successfully', async () => {
            // mock user existence check (Not found)
            User.findOne.mockResolvedValue(null);

            // Mock Member lookup (Must return churchId & groupId)
            const mockMember = { _id: 'member-123', churchId: 'church-A', groupId: 'group-B' };
            Member.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue(mockMember)
            });

            // Mock User Creation
            User.create.mockResolvedValue({ _id: 'new-user-id', ...req.body });

            await registerUser(req, res);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ username: 'NewUser' });
            expect(Member.findById).toHaveBeenCalledWith('member-123');
            
            // Created user should get its IDs from the member
            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
                username: 'NewUser',
                churchId: 'church-A',
                groupId: 'group-B'
            }));

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });


        it('should return 400 if user already exists', async () => {
            User.findOne.mockResolvedValue({ username: 'NewUser' });
            
            await registerUser(req, res);

            expect(User.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
        });


        it('should return 400 if non-manager tries to register a manager', async () => {
            req.user = 'churchAdmin';
            req.body.status = 'manager';

            await registerUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Cannot Register a user with status of Manager." });
        });
    });



    // Tests for getUsers endpoint
    describe('getUsers', () => {
        it('should return paginated users and metadata', async () => {
            req.query = { page: '1', limit: '10' };

            // Mock Aggregation Result
            const mockResult = [{
                metadata: [{ total: 5 }],
                data: [{ username: 'User1' }, { username: 'User2' }]
            }];
            User.aggregate.mockResolvedValue(mockResult);

            await getUsers(req, res);

            expect(User.aggregate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                users: mockResult[0].data,
                totalPages: 1,
                totalUsers: 5
            });
        });


        it('should filter by group if user is GroupAdmin', async () => {
            req.user.status = 'groupAdmin';
            req.user.groupId = new mongoose.Types.ObjectId(); // Generate valid ID

            User.aggregate.mockResolvedValue([{ metadata: [], data: [] }]);

            await getUsers(req, res);

            // Access the $match stage passed to aggregate
            const pipeline = User.aggregate.mock.calls[0][0];
            const matchStage = pipeline[0].$match;

            expect(matchStage.groupId.toString()).toBe(req.user.groupId.toString());
        });


        it('should handle search query', async () => {
            req.query.search = 'John';
            User.aggregate.mockResolvedValue([{ metadata: [], data: [] }]);

            await getUsers(req, res);

            const pipeline = User.aggregate.mock.calls[0][0];
            const matchStage = pipeline[0].$match;

            expect(matchStage.$or[0].username.$regex).toBe('^John');
        });


        it('should return 500 on aggregation error', async () => {
            User.aggregate.mockRejectedValue(new Error('DB Fail'));
            await getUsers(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });



    // Tests for getUserById endpoint
    describe('getUserById', () => {
        it('should return user with populated member data', async () => {
            req.params.id = 'user-1';
            
            const mockChain = {
                populate: vi.fn().mockResolvedValue({ _id: 'user-1', username: 'Test' })
            };
            User.findById.mockReturnValue(mockChain);

            await getUserById(req, res);

            expect(User.findById).toHaveBeenCalledWith('user-1');
            expect(mockChain.populate).toHaveBeenCalledWith('memberId', 'firstName lastName');
            expect(res.status).toHaveBeenCalledWith(200);
        });


        it('should return 404 if user not found', async () => {
            req.params.id = 'user-1';
            const mockChain = { populate: vi.fn().mockResolvedValue(null) };
            User.findById.mockReturnValue(mockChain);

            await getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });



    // Tests for updateUser endpoint
    describe('updateUser', () => {
        beforeEach(() => {
            req.params.id = 'user-1';
            req.body = { username: 'UpdatedUser' };
        });

        it('should update user if username is available', async () => {

            User.findOne.mockResolvedValue(null);
            const mockChain = {
                populate: vi.fn().mockResolvedValue({ _id: 'user-1', username: 'UpdatedUser' })
            };
            User.findByIdAndUpdate.mockReturnValue(mockChain);

            await updateUser(req, res);

            expect(User.findByIdAndUpdate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User updated successfully' }));
        });


        it('should return 400 if username is taken by another user', async () => {
            User.findOne.mockResolvedValue({ _id: 'user-2', username: 'UpdatedUser' });

            await updateUser(req, res);

            expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Username is already taken' });
        });


        it('should return 404 if user to update does not exist', async () => {
            User.findOne.mockResolvedValue(null);
            
            const mockChain = { populate: vi.fn().mockResolvedValue(null) };
            User.findByIdAndUpdate.mockReturnValue(mockChain);

            await updateUser(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });



    // Tests for delete user endpoint
    describe('deleteUser', () => {
        it('should delete user if found and not self', async () => {
            req.params.id = 'target-user-id';
            req.user._id = 'admin-user-id';

            const mockUserInstance = { 
                _id: 'target-user-id', 
                deleteOne: vi.fn().mockResolvedValue(true) 
            };
            User.findById.mockResolvedValue(mockUserInstance);

            await deleteUser(req, res);

            expect(mockUserInstance.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });


        it('should return 400 if user tries to delete themselves', async () => {
            req.params.id = 'my-id';
            req.user._id = 'my-id';

            const mockUserInstance = { _id: 'my-id' };
            User.findById.mockResolvedValue(mockUserInstance);

            await deleteUser(req, res);

            // Should not delete
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'You cannot delete your own account' });
        });


        it('should return 404 if user not found', async () => {
            User.findById.mockResolvedValue(null);
            await deleteUser(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});