import { Router } from "express";
import authRoutes from "./auth.route";
import chatRoutes from "./chat.router";
import userRoutes from "./user.chat";

const router = Router();
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/user", userRoutes)


export default router;


