import { Router } from 'express'
import { dashboardStats } from '../controllers/dashboard_controller.js'
import authenticate from '../middlewares/authentication.js'
import verifyAccessLevel from '../middlewares/authorisation.js'
import validate from '../middlewares/validate.js'
import { dashboardStatsSchema } from '../validators/dashboard_schema.js'




const router = Router()

router.use(authenticate)

router.get('/stats', verifyAccessLevel('churchAdmin'), validate(dashboardStatsSchema), dashboardStats)


export default router;