import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userService from '../../services/users.service.js';
import { User } from "../../models/users_model.js";
import { Member } from "../../models/members_model.js";
import mongoose from 'mongoose';

vi.mock("../../models/users_model.js");
vi.mock("../../models/members_model.js");


describe('Users Service', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('createUser', () => {
        it('should throw error if non-manager tries to create a manager', async () => {
            const data = { status: 'manager' };
            await expect(userService.createUser(data, 'churchPastor'))
                .rejects.toThrow("Cannot Register a user with status of Manager.");
        });

        it('should create user with IDs from member record', async () => {
            User.findOne.mockResolvedValue(null);
            Member.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue({ churchId: 'c1', groupId: 'g1' })
            });

            await userService.createUser({ username: 'test', memberId: 'm1' }, 'manager');

            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
                churchId: 'c1',
                groupId: 'g1'
            }));
        });
    });


    describe('fetchUsers (Aggregation Logic)', () => {
        it('should filter by churchId for churchPastor role', async () => {
            const currentUser = { status: 'churchPastor', churchId: new mongoose.Types.ObjectId().toString() };
            User.aggregate.mockResolvedValue([{ metadata: [], data: [] }]);

            await userService.fetchUsers({}, currentUser);

            const pipeline = User.aggregate.mock.calls[0][0];
            const matchStage = pipeline.find(s => s.$match).$match;
            expect(matchStage.churchId.toString()).toBe(currentUser.churchId);
        });
    });


    describe('removeUser', () => {
        it('should throw error if user tries to delete themselves', async () => {
            const userId = 'user123';
            User.findById.mockResolvedValue({ _id: userId });

            await expect(userService.removeUser(userId, userId))
                .rejects.toThrow("You cannot delete your own account");
        });
    });
});