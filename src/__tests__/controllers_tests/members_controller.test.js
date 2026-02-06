import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as memberService from '../../services/members.service.js';
import {
  registerMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember
} from '../../controllers/members_controller.js';

vi.mock('../../services/members.service.js');



describe('Members Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { churchId: 'c1', groupId: 'g1', status: 'churchAdmin' }
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      headersSent: false
    };
  });



  describe('registerMember', () => {
    it('should register member and return 201 immediately', async () => {
      req.body = { name: 'John Doe', profileImage: 'base64-data' };
      memberService.createMember.mockResolvedValue({ _id: 'm1' });

      await registerMember(req, res);

      expect(memberService.createMember).toHaveBeenCalledWith(req.body, req.user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Member registered successfully',
        memberId: 'm1'
      });
      // Verify background task triggered
      expect(memberService.uploadMemberImage).toHaveBeenCalledWith('m1', 'base64-data');
    });

    it('should return 400 if church is required but missing', async () => {
      memberService.createMember.mockRejectedValue(new Error('Church is required'));
      await registerMember(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });



  describe('getMembers', () => {
    it('should return 200 and member data', async () => {
      const mockResult = { members: [{ name: 'Member A' }], totalMembers: 1 };
      memberService.fetchAllMembers.mockResolvedValue(mockResult);

      await getMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });



  describe('getMemberById', () => {
    it('should return 404 for invalid ObjectId or missing member', async () => {
      // Simulate Mongoose ObjectId error
      const mongoError = new Error('Member not found');
      mongoError.kind = 'ObjectId';
      memberService.fetchMemberById.mockRejectedValue(mongoError);

      await getMemberById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Member not found' });
    });
  });




  describe('updateMember', () => {
    it('should update details and trigger background image update', async () => {
      req.params.id = 'm1';
      req.body = { name: 'Jane Updated', profileImage: 'new-image-data' };
      const { profileImage, ...updates } = req.body;
      
      memberService.modifyMemberDetails.mockResolvedValue({ _id: 'm1', ...updates });

      await updateMember(req, res);

      expect(memberService.modifyMemberDetails).toHaveBeenCalledWith('m1', updates);
      expect(res.status).toHaveBeenCalledWith(200);
      // Verify background image handler called with correct ID
      expect(memberService.handleImageUpdate).toHaveBeenCalledWith('m1', 'new-image-data');
    });

    it('should not send 500 error if headers were already sent', async () => {
        req.params.id = 'm1';
        memberService.modifyMemberDetails.mockResolvedValue({});
        
        // Simulate response already sent
        res.headersSent = true; 
        
        await updateMember(req, res);
        
        // This ensures that even if something fails after res.json, 
        // the catch block doesn't crash the app by sending another status
        expect(res.status).toHaveBeenCalledTimes(1); 
    });
  });



  describe('deleteMember', () => {
    it('should return 200 on successful deletion', async () => {
      req.params.id = 'm1';
      memberService.removeMember.mockResolvedValue('m1');

      await deleteMember(req, res);

      expect(memberService.removeMember).toHaveBeenCalledWith('m1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 'm1', message: 'Member removed successfully' });
    });
  });
});