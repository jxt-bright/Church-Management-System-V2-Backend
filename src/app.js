import express from "express";
import passport from "passport";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

// Import routers from their various files in the routes folder
import userRouter from './routes/users_route.js'
import authRouter from './routes/auth_route.js'
import memberRouter from './routes/members_route.js'
import groupRouter from './routes/groups_route.js'
import churchRouter from './routes/churches_route.js'
import attendanceRouter from './routes/attendance_route.js'
import specialServiceRouter from './routes/specialService_route.js'
import messagesRouter from './routes/messages_route.js'
import reportsRouter from './routes/reports_route.js'
import dashboardRouter from './routes/dashboard_route.js'

// Import other files
import passportConfig from "./config/passport.js";




// start express app
const app = express();


// Middlewares
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))
app.use(cookieParser());
app.use(passport.initialize());
passportConfig(passport);



// routes declaration
app.use("/api/v2/auth", authRouter);
app.use("/api/v2/users", userRouter);
app.use("/api/v2/members", memberRouter);
app.use("/api/v2/groups", groupRouter);
app.use("/api/v2/churches", churchRouter);
app.use('/api/v2/attendance', attendanceRouter);
app.use('/api/v2/specialService', specialServiceRouter);
app.use("/api/v2/messages", messagesRouter);
app.use("/api/v2/reports", reportsRouter)
app.use("/api/v2/dashboard", dashboardRouter)


export default app;