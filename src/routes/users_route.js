import { Router } from 'express';
import authenticate from '../middlewares/authentication.js';
import validate from '../middlewares/validate.js';
import { registerUserSchema, updateUserSchema } from '../validators/users_schema.js';
import verifyAccessLevel from '../middlewares/authorisation.js';

import { registerUser, getUsers, getUserById, updateUser, deleteUser } from '../controllers/users_controller.js';

const router = Router();



// Authentication middleware
router.use(authenticate)

// User protected routes
router.post('/register', verifyAccessLevel('churchPastor'), validate(registerUserSchema), registerUser);

router.get('/', verifyAccessLevel('churchPastor'), getUsers);

router.get('/:id', verifyAccessLevel('churchPastor'), getUserById);

router.put('/:id', verifyAccessLevel('churchPastor'), validate(updateUserSchema), updateUser);

router.delete('/:id', verifyAccessLevel('churchPastor'), deleteUser);

export default router;