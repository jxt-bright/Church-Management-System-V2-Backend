import { Router } from 'express';

import { monthlyReport, generalReport } from '../controllers/reports_controller.js'
import authenticate from '../middlewares/authentication.js';
import verifyAccessLevel from '../middlewares/authorisation.js';
import validate from '../middlewares/validate.js';
import { monthlyReportSchema, generalReportSchema } from '../validators/reports_schema.js'



const router = Router();


router.use(authenticate);

router.get('/monthly', verifyAccessLevel('churchAdmin'), validate(monthlyReportSchema), monthlyReport)

router.get('/general', verifyAccessLevel('churchAdmin'), validate(generalReportSchema), generalReport)



export default router;