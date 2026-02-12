import Router from 'express';
import { sendMessages } from '../controllers/messages_controller.js';
import authenticate from '../middlewares/authentication.js';
import verifyAccessLevel from '../middlewares/authorisation.js';
import validate from '../middlewares/validate.js';
import { sendMessageSchema } from '../validators/messages_schema.js';


const router = Router();



// Authentication middleware
router.use(authenticate)


router.post('/send', verifyAccessLevel('churchAdmin'), validate(sendMessageSchema), sendMessages)


export default router;