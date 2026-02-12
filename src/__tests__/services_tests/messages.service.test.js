import { describe, it, expect, vi, beforeEach } from 'vitest'

import { sendMessages } from '../../services/messages.service.js'
import smsProvider from '../../utils/smsProvider.utils.js';
import { formatMessage } from '../../utils/messageFormatter.utils.js';
import { Member } from '../../models/members_model.js'

// Mock dependencies
vi.mock('../../models/members_model.js', () => ({
    Member: { find: vi.fn() }
}));

vi.mock('../../utils/smsProvider.utils.js', () => ({
    default: { send: vi.fn() }
}));

vi.mock('../../utils/messageFormatter.utils.js', () => ({
    formatMessage: vi.fn()
}));



describe('sendMessages Service', () => {
    const mockData = {
        groupId: 'group123',
        churchId: null,
        category: 'males',
        message: 'Hello',
        salutation: 'Hi',
        addNames: true,
        targetType: 'group'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const setupMockCursor = (members) => {
        let index = 0;
        const cursor = {
            next: vi.fn(async () => (index < members.length ? members[index++] : null))
        };

        Member.find.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            lean: vi.fn().mockReturnThis(),
            cursor: vi.fn().mockReturnValue(cursor)
        });

        return cursor;
    };


    it('should process members in batches and return recipient count', async () => {
        const mockMembers = [
            { phoneNumber: '0241', firstName: 'John' },
            { phoneNumber: '0242', firstName: 'Sarah' }
        ];
        setupMockCursor(mockMembers);

        formatMessage.mockReturnValue('Formatted Message');
        smsProvider.send.mockResolvedValue({ success: true });

        const result = await sendMessages(mockData);

        expect(result.recipientCount).toBe(2);
        expect(Member.find).toHaveBeenCalledWith(expect.objectContaining({ groupId: 'group123', gender: 'Male' }));
        expect(smsProvider.send).toHaveBeenCalledTimes(2);
        expect(formatMessage).toHaveBeenCalledTimes(2);
    });


    it('should apply the correct filters based on category', async () => {
        const memberData = [{ phoneNumber: '0241', firstName: 'John' }];

        Member.find.mockImplementation(() => {
            let index = 0;
            const cursor = {
                next: vi.fn(async () => (index < memberData.length ? memberData[index++] : null))
            };
            return {
                select: vi.fn().mockReturnThis(),
                lean: vi.fn().mockReturnThis(),
                cursor: vi.fn().mockReturnValue(cursor)
            };
        });

        await sendMessages({ ...mockData, category: 'workers' });
        await sendMessages({ ...mockData, category: 'youths' });

        expect(Member.find).toHaveBeenCalledTimes(2);
    });


    it('should throw a 404 error if no recipients are found', async () => {
        setupMockCursor([]); // Empty list

        await expect(sendMessages(mockData)).rejects.toThrow('No recipients found.');
        try {
            await sendMessages(mockData);
        } catch (error) {
            expect(error.statusCode).toBe(404);
        }
    });


    it('should handle batching correctly (triggers Promise.allSettled at BATCH_SIZE)', async () => {
        // Create 31 members to trigger one batch of 30 and one remaining of 1
        const manyMembers = Array.from({ length: 31 }, (_, i) => ({
            phoneNumber: `num${i}`,
            firstName: `name${i}`
        }));

        setupMockCursor(manyMembers);
        smsProvider.send.mockResolvedValue({ success: true });

        const result = await sendMessages(mockData);

        expect(result.recipientCount).toBe(31);
        // Promise.allSettled is internal, but we verify all 31 sends were initiated
        expect(smsProvider.send).toHaveBeenCalledTimes(31);
    });
});