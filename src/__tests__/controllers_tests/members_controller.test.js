import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Member } from "../../models/members_model.js";
import { Church } from "../../models/churches_model.js";
import cloudinary from '../../config/cloudinary.js';
import {
  registerMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember
} from '../../controllers/members_controller.js';


// Mock dependencies
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



describe('Members Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock req
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        churchId: 'church-123',
        groupId: 'group-456',
        status: 'churchAdmin'
      }
    };

    // Mock res
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      headersSent: false
    };
  });



  // Tests for register Member endpoint
  describe('registerMember', () => {
    beforeEach(() => {
      req.body = { firstName: 'Kwame', lastName: 'Mensah' };

      Church.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue({ _id: 'church-123', groupId: 'group-456' })
      });
    });


    it('should register member successfully (without image)', async () => {
      Member.create.mockResolvedValue({ _id: 'new-mem-id', firstName: 'Kwame' });

      await registerMember(req, res);

      // Check Church Lookup
      expect(Church.findById).toHaveBeenCalledWith('church-123');

      // Check Creation
      expect(Member.create).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'Kwame',
        churchId: 'church-123',
        groupId: 'group-456',
        profileImage: { url: null, public_id: null }
      }));

      // Check Response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
    });


    it('should register member and trigger background image upload', async () => {
      req.body.profileImage = 'data:image/png;base64,fakeimage';
      Member.create.mockResolvedValue({ _id: 'new-mem-id' });

      // Mock Cloudinary success
      cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'http://url', public_id: '123' });

      await registerMember(req, res);

      // Response should be sent immediately (201)
      expect(res.status).toHaveBeenCalledWith(201);

      // Cloudinary should be called (Background process)
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        'data:image/png;base64,fakeimage',
        expect.objectContaining({ folder: "members" })
      );
    });


    it('should return 404 if Church is not found', async () => {
      // Mock Church.select returning null
      Church.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      });

      await registerMember(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Church not found" }));
    });
  });



  // Tests for getMembers endpoint
  describe('getMembers', () => {
    it('should return paginated members with correct chaining', async () => {
      req.query = { page: '1', limit: '10' };

      // Mock Promise.all
      Member.countDocuments.mockResolvedValue(20);

      // Mock the Mongoose Chaining
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        collation: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ firstName: 'Kwame' }, { firstName: 'Ama' }])
      };
      Member.find.mockReturnValue(mockChain);

      await getMembers(req, res);

      expect(Member.find).toHaveBeenCalledWith(expect.objectContaining({ churchId: 'church-123' }));
      expect(mockChain.limit).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        totalMembers: 20,
        totalPages: 2
      }));
    });


    it('should filter by group if user is GroupAdmin', async () => {
      req.user.status = 'groupAdmin';
      req.user.groupId = 'group-999';

      // Mock finding churches in group
      Church.find.mockReturnValue({
        distinct: vi.fn().mockResolvedValue(['church-A', 'church-B'])
      });

      Member.countDocuments.mockResolvedValue(0);

      // Mock Chain
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        collation: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      };
      Member.find.mockReturnValue(mockChain);

      await getMembers(req, res);

      // Assert that the query used the list of church IDs
      const findCallArgs = Member.find.mock.calls[0][0];
      expect(findCallArgs.churchId.$in).toEqual(['church-A', 'church-B']);
    });
  });



  // Tests for getMemberById endpoint
  describe('getMemberById', () => {
    it('should return member if found', async () => {
      req.params.id = 'mem-1';
      Member.findById.mockResolvedValue({ _id: 'mem-1', firstName: 'Test' });

      await getMemberById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ _id: 'mem-1', firstName: 'Test' });
    });


    it('should return 404 if not found', async () => {
      req.params.id = 'mem-1';
      Member.findById.mockResolvedValue(null);

      await getMemberById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });



  // Tests for updateMember endpoint
  describe('updateMember', () => {
    beforeEach(() => {
      req.params.id = 'mem-1';
      req.body = { firstName: 'Updated' };
    });

    it('should update member text fields immediately', async () => {
      // Mock Find (Check existence)
      Member.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue({ _id: 'mem-1' })
      });

      // Mock Update
      Member.findByIdAndUpdate.mockResolvedValue({ _id: 'mem-1', firstName: 'Updated' });

      await updateMember(req, res);

      expect(Member.findByIdAndUpdate).toHaveBeenCalledWith(
        'mem-1',
        { $set: { firstName: 'Updated' } },
        expect.anything()
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });


    it('should trigger image upload if profileImage is provided', async () => {
      req.body.profileImage = 'data:image/new';

      // Mock Find (Found member)
      Member.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue({ _id: 'mem-1', profileImage: { public_id: 'old_id' } })
      });

      // Mock Update
      Member.findByIdAndUpdate.mockResolvedValue({});

      // Mock Upload
      cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'new-url' });

      await updateMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200); // Response sent first

      // Verify upload logic triggered
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        'data:image/new',
        expect.objectContaining({ public_id: 'old_id', overwrite: true })
      );
    });
  });



  // Tests for delete Member endpoint
  describe('deleteMember', () => {
    it('should delete member if found', async () => {
      req.params.id = 'mem-1';

      const mockMemberInstance = {
        _id: 'mem-1',
        deleteOne: vi.fn().mockResolvedValue(true)
      };
      Member.findById.mockResolvedValue(mockMemberInstance);

      await deleteMember(req, res);

      expect(Member.findById).toHaveBeenCalledWith('mem-1');
      expect(mockMemberInstance.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });


    it('should return 404 if member not found', async () => {
      Member.findById.mockResolvedValue(null);
      await deleteMember(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

});