import * as messagesService from '../services/messages.service.js'

const sendMessages = async (req, res) => {
try {
        messagesService.sendMessages(req.body).catch(() => {});

        // Send response immediately
        return res.status(202).json({
            success: true,
            message: "Message sent successfully"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error while sending messages' });
    }

}


export {
    sendMessages,
}