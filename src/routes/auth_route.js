import { Router } from 'express';
import { loginUser, refreshToken } from "../controllers/auth_controller.js";
import authenticate from '../middlewares/authentication.js';
import verifyAccessLevel from '../middlewares/authorisation.js';
import { loginUserSchema } from '../validators/auth_schema.js';
import validate from '../middlewares/validate.js';



const router = Router();

router.post('/login', validate(loginUserSchema), loginUser);

// router.post('/logout', verifyAccessLevel('churchAdmin'), logoutUser);

router.route('/refreshToken').post( refreshToken);

// Authentication middleware
router.use(authenticate)



export default router;