import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as messagesController from '../../controllers/messages_controller.js';
import * as messagesService from '../../services/messages.service.js';


// Mock the service module
vi.mock('../../services/messages.service.js', () => ({
    sendMessages: vi.fn().mockReturnValue(Promise.resolve({ recipientCount: 10 }))
}));



describe('messagesController.sendMessages', () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock req and res
        req = {
            body: {
                message: 'Test Message',
                category: 'members',
                targetType: 'church',
                churchId: '123'
            }
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
    });

    it('should return 202 status and success message immediately', async () => {
        await messagesController.sendMessages(req, res);

        // Verify status code is 202 (Accepted)
        expect(res.status).toHaveBeenCalledWith(202);
        
        // Verify response body
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Message sent successfully"
        });

        // Verify the service was actually called with the request body
        expect(messagesService.sendMessages).toHaveBeenCalledWith(req.body);
    });

    it('should handle immediate errors with 500 status', async () => {
        // Force an immediate error 
        messagesService.sendMessages.mockImplementationOnce(() => {
            throw new Error('Sync Error');
        });

        await messagesController.sendMessages(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false
        }));
    });
});