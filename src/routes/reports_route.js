import { Router } from 'express';

import { monthlyReport } from '../controllers/reports_controller.js'
import authenticate from '../middlewares/authentication.js';
import verifyAccessLevel from '../middlewares/authorisation.js';
import validate from '../middlewares/validate.js';
import { monthlyReportSchema } from '../validators/reports_schema.js'



const router = Router();


router.use(authenticate);

router.get('/monthly', verifyAccessLevel('churchAdmin'), validate(monthlyReportSchema), monthlyReport)



export default router;