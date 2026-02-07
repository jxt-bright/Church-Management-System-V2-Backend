import { Router } from 'express';
import { loginUser, refreshToken, logoutUser } from "../controllers/auth_controller.js";
import authenticate from '../middlewares/authentication.js';
import verifyAccessLevel from '../middlewares/authorisation.js';
import { loginUserSchema } from '../validators/auth_schema.js';
import validate from '../middlewares/validate.js';



const router = Router();


// Middleware to prevent browser from caching protected content
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

router.post('/login', validate(loginUserSchema), loginUser);

router.post('/logout', logoutUser);

router.route('/refreshToken').post( refreshToken);

// Authentication middleware
// router.use(authenticate)



export default router;