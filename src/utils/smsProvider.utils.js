import axios from 'axios';

const smsProvider = {
    send: async (phoneNumber, message) => {
        try {
            // Format phone number
            const cleanNumber = phoneNumber.trim();
            const formattedNumber = cleanNumber.startsWith('0')
                ? `233${cleanNumber.slice(1)}`
                : cleanNumber;

            const response = await axios.get(process.env.MESSAGE_API, {
                params: {
                    action: 'send-sms',
                    api_key: process.env.MESSAGE_API_KEY,
                    to: formattedNumber,
                    from: process.env.SENDER,
                    sms: message.trim()
                }
            });

            return { success: true, data: response.data };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export default smsProvider;