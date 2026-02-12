import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios';

import smsProvider from '../../utils/smsProvider.utils.js'


// Mock axios
vi.mock('axios');

describe('SMS API Provider', () => {
    const mockApiKey = 'test_api_key';
    const mockApiUrl = 'https://api.smsprovider.com/sms';
    const mockSender = 'CHURCH';

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup environment variables
        process.env.MESSAGE_API = mockApiUrl;
        process.env.MESSAGE_API_KEY = mockApiKey;
        process.env.SENDER = mockSender;
    });

    describe('Phone Number Formatting', () => {
        it('should format local numbers starting with 0 to 233 format', async () => {
            axios.get.mockResolvedValue({ data: { status: 'success' } });

            await smsProvider.send('0244111222', 'Test message');

            expect(axios.get).toHaveBeenCalledWith(mockApiUrl, expect.objectContaining({
                params: expect.objectContaining({
                    to: '233244111222'
                })
            }));
        });

        it('should not change the number if it does not start with 0', async () => {
            axios.get.mockResolvedValue({ data: { status: 'success' } });

            await smsProvider.send('233500000000', 'Test message');

            expect(axios.get).toHaveBeenCalledWith(mockApiUrl, expect.objectContaining({
                params: expect.objectContaining({
                    to: '233500000000'
                })
            }));
        });
    });


    describe('API Integration', () => {
        it('should return success: true when the API call succeeds', async () => {
            const mockResponse = { data: { code: 'ok', message: 'Successfully Sent' } };
            axios.get.mockResolvedValue(mockResponse);

            const result = await smsProvider.send('0244111222', ' Hello World ');

            // Verify params sent to Arkesel
            expect(axios.get).toHaveBeenCalledWith(mockApiUrl, {
                params: {
                    action: 'send-sms',
                    api_key: mockApiKey,
                    to: '233244111222',
                    from: mockSender,
                    sms: 'Hello World'
                }
            });

            expect(result).toEqual({ success: true, data: mockResponse.data });
        });

        it('should return success: false and the error message when the API call fails', async () => {
            const errorMessage = 'Network Error';
            axios.get.mockRejectedValue(new Error(errorMessage));

            const result = await smsProvider.send('0244111222', 'Test');

            expect(result).toEqual({ success: false, error: errorMessage });
        });
    })

})

