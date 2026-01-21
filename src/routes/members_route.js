import { Router } from 'express';
import authenticate from '../middlewares/authentication.js';
import validate from '../middlewares/validate.js';
import { registerMemberSchema } from '../validators/members_schema.js';
import verifyAccessLevel from '../middlewares/authorisation.js';

import { registerMember, getMembers, getMemberById, updateMember, deleteMember } from '../controllers/members_controller.js';


const router = Router();



// Authentication middleware
router.use(authenticate)


router.post('/register', verifyAccessLevel('churchAdmin'), validate(registerMemberSchema), registerMember);

router.get('/', verifyAccessLevel('churchAdmin'), getMembers);

router.get('/:id', verifyAccessLevel('churchAdmin'), getMemberById);

router.put('/edit/:id', verifyAccessLevel('churchAdmin'), validate(registerMemberSchema), updateMember);

router.delete('/:id', verifyAccessLevel('churchAdmin'), deleteMember);

export default router;