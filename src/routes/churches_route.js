import { Router } from 'express';
import authenticate from '../middlewares/authentication.js';
import validate from '../middlewares/validate.js';
import { registerChurchSchema } from '../validators/churches_schema.js';
import verifyAccessLevel from '../middlewares/authorisation.js';

import { registerChurch, getChurches, getChurchById, updateChurch, deleteChurch } from '../controllers/churches_controller.js';


const router = Router();



// Authentication middleware
router.use(authenticate)

// Church protected routes
router.post('/register', verifyAccessLevel('groupAdmin'), validate(registerChurchSchema), registerChurch);

router.get('/', verifyAccessLevel('groupAdmin'), getChurches);

router.get('/:id', verifyAccessLevel('groupAdmin'), getChurchById);

router.put('/:id', verifyAccessLevel('groupAdmin'), validate(registerChurchSchema), updateChurch);

router.delete('/:id', verifyAccessLevel('groupAdmin'), deleteChurch);

export default router;