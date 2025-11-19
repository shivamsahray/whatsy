import "dotenv/config";
import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import cors from "cors"
import passport from "passport";
import { Env } from "./config/env.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import connectDatabase from "./config/database.config";
import router from "./routes/index";
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true
}))
app.use("/api", router);
app.use(errorHandler);
app.use(passport.initialize())
app.get('/health', asyncHandler(async(req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
        status: "OK", 
        message: "Server is healthy", 
    })
}))

app.listen(Env.PORT,async () => {
    await connectDatabase();
    console.log(`Server running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
})