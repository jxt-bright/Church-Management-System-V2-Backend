import { Router } from 'express';
import { loginUser, refreshToken, logoutUser, requestPasswordReset, authenticateCode, resetPassword } from "../controllers/auth_controller.js";
import authenticate from '../middlewares/authentication.js';
import verifyAccessLevel from '../middlewares/authorisation.js';
import { loginUserSchema, passwordResetSchema, authenticateCodeSchema, resetPasswordSchema } from '../validators/auth_schema.js';
import validate from '../middlewares/validate.js';



const router = Router();


// Middleware to prevent browser from caching protected content
// router.use((req, res, next) => {
//     res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
//     next();
// });

router.post('/login', validate(loginUserSchema), loginUser);

router.post('/logout', verifyAccessLevel('churchAdmin'), logoutUser);

router.post('/reqResetPassword', validate(passwordResetSchema), requestPasswordReset);

router.post('/authCode', validate(authenticateCodeSchema), authenticateCode);

router.post('/resetPassword', validate(resetPasswordSchema), resetPassword);

router.post('/refreshToken', refreshToken);

// Authentication middleware
// router.use(authenticate)



export default router;