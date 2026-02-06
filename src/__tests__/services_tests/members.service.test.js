import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Member } from '../../models/members_model.js';
import { Church } from '../../models/churches_model.js';
import cloudinary from '../../config/cloudinary.js';

import {
    createMember,
    uploadMemberImage,
    fetchAllMembers,
    fetchMemberById,
    modifyMemberDetails,
    handleImageUpdate,
    removeMember
} from '../../services/members.service.js';

vi.mock('../../models/members_model.js');
vi.mock('../../models/churches_model.js');
vi.mock('../../config/cloudinary.js', () => ({
    default: {
        uploader: {
            upload: vi.fn(),
            destroy: vi.fn()
        }
    }
}));


describe('Members Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });


    describe('createMember', () => {
        it('should create member if church exists', async () => {
            Church.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue({ groupId: 'g1' })
            });
            Member.create.mockResolvedValue({ _id: 'm1' });

            const result = await createMember(
                { firstName: 'Kwame' },
                { churchId: 'c1' }
            );

            expect(result._id).toBe('m1');
        });

        it('should throw if church missing', async () => {
            await expect(
                createMember({}, {})
            ).rejects.toThrow('Church is required');
        });
    });


    describe('uploadMemberImage', () => {
        it('should upload and update member', async () => {
            cloudinary.uploader.upload.mockResolvedValue({
                secure_url: 'url',
                public_id: 'pid'
            });

            await uploadMemberImage('m1', 'img');

            expect(cloudinary.uploader.upload).toHaveBeenCalled();
        });
    });


    describe('fetchAllMembers', () => {
        it('should return paginated members', async () => {
            Member.countDocuments.mockResolvedValue(1);
            Member.find.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                populate: vi.fn().mockReturnThis(),
                sort: vi.fn().mockReturnThis(),
                collation: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue([])
            });

            const result = await fetchAllMembers({}, { status: 'churchAdmin', churchId: 'c1' });

            expect(result.totalMembers).toBe(1);
        });
    });


    describe('fetchMemberById', () => {
        it('should throw if not found', async () => {
            Member.findById.mockResolvedValue(null);

            await expect(fetchMemberById('x'))
                .rejects.toThrow('Member not found');
        });
    });


    describe('modifyMemberDetails', () => {
        it('should update member', async () => {
            Member.findById.mockResolvedValue({});
            Member.findByIdAndUpdate.mockResolvedValue({});

            await modifyMemberDetails('id', { firstName: 'Ama' });

            expect(Member.findByIdAndUpdate).toHaveBeenCalled();
        });
    });


    describe('handleImageUpdate', () => {
        it('should overwrite image if exists', async () => {
            Member.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue({
                    profileImage: { public_id: 'old' }
                })
            });

            cloudinary.uploader.upload.mockResolvedValue({
                secure_url: 'new',
                public_id: 'old'
            });

            await handleImageUpdate('id', 'img');

            expect(cloudinary.uploader.upload).toHaveBeenCalled();
        });
    });


    describe('removeMember', () => {
        it('should delete member and return id', async () => {
            const deleteOneMock = vi.fn().mockResolvedValue(true);

            Member.findById.mockResolvedValue({
                deleteOne: deleteOneMock
            });

            const result = await removeMember('id');

            expect(Member.findById).toHaveBeenCalledWith('id');
            expect(deleteOneMock).toHaveBeenCalled();
            expect(result).toBe('id');
        });
    });
});
