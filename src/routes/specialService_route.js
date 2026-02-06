import Router from 'express';
import verifyAccessLevel from '../middlewares/authorisation.js';
import authenticate from '../middlewares/authentication.js';
import specialServiceSchema from '../validators/specialService_schema.js';
import validate from '../middlewares/validate.js';

import { saveSpecialService, 
    getSpecialService, 
    updateSpecialService, 
    deleteAttendance } from '../controllers/specialService_controller.js';


const router = Router();


// Authentication middleware
router.use(authenticate);

// Protected routes
router.post('/save', verifyAccessLevel('churchAdmin'), validate(specialServiceSchema.create), saveSpecialService)

router.get('/', verifyAccessLevel('churchAdmin'), validate(specialServiceSchema.fetch), getSpecialService)

router.put('/:id', verifyAccessLevel('churchAdmin'), validate(specialServiceSchema.update), updateSpecialService)

router.delete('/:id', verifyAccessLevel('churchAdmin'), deleteAttendance)

export default router;