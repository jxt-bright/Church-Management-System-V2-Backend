import { Router } from 'express';
import authenticate from '../middlewares/authentication.js';
import validate from '../middlewares/validate.js';
import { registerGroupSchema } from '../validators/groups_schema.js';
import verifyAccessLevel from '../middlewares/authorisation.js';

import { registerGroup, getGroups, getGroupById, updateGroup, deleteGroup } from '../controllers/groups_controller.js';


const router = Router();



// Authentication middleware
router.use(authenticate)

router.post('/register', verifyAccessLevel('manager'), validate(registerGroupSchema), registerGroup);

router.get('/', verifyAccessLevel('manager'), getGroups);

router.get('/:id', verifyAccessLevel('manager'), getGroupById);

router.put('/:id', verifyAccessLevel('manager'), validate(registerGroupSchema), updateGroup);

router.delete('/:id', verifyAccessLevel('manager'), deleteGroup);

export default router;