import "dotenv/config";
import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import cors from "cors"
import http from 'http'
import passport from "passport";
import { Env } from "./config/env.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import connectDatabase from "./config/database.config";
import router from "./routes/index";
import "./config/passport.config";
import { initializeSocket } from "./lib/socket";
import path from "path";

const app = express();
const server = http.createServer(app);

initializeSocket(server);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true
}))
app.use(passport.initialize())
app.use("/api", router);
app.use(errorHandler);

app.get('/health', asyncHandler(async(req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
        status: "OK", 
        message: "Server is healthy", 
    })
}))
if(Env.NODE_ENV === "production"){
    const clientPath = path.resolve(__dirname, "../../client/dist");

    //server static files
    app.use(express.static(clientPath))
    
    app.get(/^(?!\/api).*/, (req: Request, res: Response) => {
        res.sendFile(path.join(clientPath, "index.html"));
    })
}
server.listen(Env.PORT,async () => {
    await connectDatabase();
    console.log(`Server running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
})