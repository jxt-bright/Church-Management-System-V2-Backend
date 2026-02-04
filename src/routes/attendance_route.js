import { Router } from "express";
import verifyAccessLevel from "../middlewares/authorisation.js";
import authenticate from "../middlewares/authentication.js";
import { saveAttendanceSchema, updateAttendanceSchema } from "../validators/attendance_schema.js";
import validate from "../middlewares/validate.js";

import { saveAttendance, getAttendance, updateAttendance, deleteAttendance } from "../controllers/attendance_controller.js";

const router = Router();

// Authentication middleware
router.use(authenticate);

// Protected Routes
router.post('/save', verifyAccessLevel('churchAdmin'), validate(saveAttendanceSchema), saveAttendance);

router.get('/', verifyAccessLevel('churchAdmin'), getAttendance);

router.put('/:id', verifyAccessLevel('churchAdmin'), validate(updateAttendanceSchema), updateAttendance);

router.delete('/:id', verifyAccessLevel('churchAdmin'), deleteAttendance);


export default router;