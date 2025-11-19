import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { chatIdSchema, createChatSchema } from "../validators/chat.validator";
import { createChatService, getSingleChatService, getUserChatsService } from "../services/chat.service";


export const createChatController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;
        const parsed = createChatSchema.parse(req.body);

        const body: {
            participantId?: string;
            isGroup?: boolean;
            participants?: string[];
            groupName?: string;
        } = {
            ...(typeof parsed.groupName === "string" ? { groupName: parsed.groupName } : {}),
            ...(typeof parsed.participantId === "string" ? { participantId: parsed.participantId } : {}),
            ...(typeof parsed.isGroup === "boolean" ? { isGroup: parsed.isGroup } : {}),
            ...(Array.isArray(parsed.participants) ? { participants: parsed.participants } : {}),
        };

        const chat = await createChatService(
            userId,
            body
        );  

        return res.status(HTTPSTATUS.OK).json({
            message: "Chat created successfully",
            chat,
        });
    }
)

export const getUserChatsController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;

        const chats = await getUserChatsService(userId);  

        return res.status(HTTPSTATUS.OK).json({
            message: "Users chat retrived successfully",
            chats,
        });
    }
)

export const getSingleChatController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;
        const { id } = chatIdSchema.parse(req.params);

        const {chat, messages} = await getSingleChatService(id,userId);  

        return res.status(HTTPSTATUS.OK).json({
            message: "User chat retrived successfully",
            chat,
            messages
        });
    }
)