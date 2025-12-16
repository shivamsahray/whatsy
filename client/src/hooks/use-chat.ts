import { API } from "@/lib/axios-client";
import type { UserType } from "@/types/auth.type";
import type { ChatType, MessageType, CreateChatType, CreateMessageType } from "@/types/chat.type";
import { toast } from "sonner";
import { create } from "zustand";
import { useAuth } from "./use-auth";
import { generateUUID } from "@/lib/helper";
interface ChatState {
    chats: ChatType[];
    users: UserType[];
    SingleChat: {
        chat: ChatType;
        message: MessageType[];
    } | null;
    isChatsLoading: boolean;
    isUsersLoading: boolean;
    isCreatingChat: boolean;
    isSingleChatLoading: boolean;
    isSendingMsg: boolean;

    fetchAllUsers: () => void;
    fetchChats: () => void;
    createChat: (payload: CreateChatType) => Promise<ChatState | null>;
    fetchSingleChat: (chatId: string) => void;
    sendMessage: (payload: CreateMessageType, isAIChat?: boolean) => void;
    addNewChat: (newChat: ChatType) => void;
    updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
    addNewMessage: (chatId: string, message: MessageType) => void;

    addOrUpdateMessage: (
        chatId: string,
        msg: MessageType,
        tempId?: string
    ) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
    chats: [],
    users: [],
    SingleChat: null,

    isChatsLoading: false,
    isUsersLoading: false,
    isCreatingChat: false,
    isSingleChatLoading: false,
    isSendingMsg: false,
    fetchAllUsers: async() => {
        set({ isUsersLoading: true});
        try {
            const { data } = await API.get("/users/all");
            set({ users: data.users})
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to fetch users")
        } finally {
            set({ isUsersLoading: false})
        }
    },
    fetchChats: async() => {
        set({ isChatsLoading: true});
        try {
            const { data } = await API.get("/chat/all");
            set({ chats: data.chats });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to fetch chats");
        } finally {
            set({ isChatsLoading: false});
        }
    },
    createChat: async(payload: CreateChatType) => {
        set({ isCreatingChat: true});
        try {
            const response = await API.post("/chat/create", {
                ...payload,
            })
            get().addNewChat(response.data.chat);
            toast.success("Chat created successfully")
            return response.data.chat;
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create chat.");
            return null;
        }finally{
            set({ isCreatingChat: false })
        }
    },
    fetchSingleChat: async(chatId: string) => {
        set({ isSingleChatLoading: true});
        try {
            const { data }  = await API.get(`/chat/${chatId}`);
            set({SingleChat: {
                chat: data.chat,
                message: data.messages || []
            }})
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to fetch chat");
        }finally{
            set({isSingleChatLoading: false})
        }
    },
    sendMessage: async(payload: CreateMessageType, isAIChat?: boolean) => {
        set({ isSendingMsg: true })
        const {chatId, replyTo, content, image } = payload;
        const { user } = useAuth.getState();
        const chat = get().SingleChat?.chat;
        const aiSender = chat?.participants.find((p) => p.isAI);
        // const currentChat = get().SingleChat

        if(!chatId || !user?._id) return;
        const tempUserId = generateUUID();
        const tempAIId = generateUUID();
        const tempMessage = {
            _id: tempUserId,
            chatId,
            content: content || null,
            image: image || null,
            sender: user,
            replyTo: replyTo || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: !isAIChat ? "sending..." : "",
        }
        get().addOrUpdateMessage(chatId, tempMessage, tempUserId);

        if(isAIChat && aiSender){
            const tempAIMessage = {
                _id: tempAIId,
                chatId,
                content: content || null,
                image: image || null,
                sender: user,
                replyTo: replyTo || null,
                streaming: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: !isAIChat ? "sending..." : "",
            }

            get().addOrUpdateMessage(chatId, tempAIMessage, tempAIId);
        }
        // set((state) => {
        //     if(state.SingleChat?.chat?._id !== chatId) return state;
        //     return {
        //         SingleChat: {
        //             ...state.SingleChat,
        //             message: [...state.SingleChat.message, tempMessage]
        //         }
        //     }
        // });

        try {
            const { data } = await API.post("/chat/message/send", {
                chatId,
                content,
                image,
                replyToId: replyTo?._id,
            })

            const { userMessage, aiResponse } = data;

            get().addOrUpdateMessage(chatId, userMessage, tempUserId);

            if(isAIChat && aiResponse){
                get().addOrUpdateMessage(chatId, aiResponse, tempAIId);
            }
            // set((state) => {
            // if(!state.SingleChat) return state;
            // return {
            //     SingleChat: {
            //         ...state.SingleChat,
            //         message: state.SingleChat.message.map((msg) => msg._id === tempUserId ? userMessage : msg)
            //     }
            // }
            // });
            
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to send message")
        }finally {
            set({ isSendingMsg: false})
        }

    },
    addNewChat: (newChat: ChatType) => {
        set((state) => {
            const existingChatIndex = state.chats.findIndex((c) => c._id === newChat._id)
            if(existingChatIndex !== -1){
                return{
                    chats: [newChat, ...state.chats.filter((c) => c._id !== newChat._id)],
                };
            }else{
                return {
                    chats: [newChat, ...state.chats]
                }
            }
        })
    },
    updateChatLastMessage: (chatId, lastMessage)=> {
        set((state) => {
            const chat = state.chats.find((c) => c._id === chatId);
            if(!chat) return state;
            return {
                chats: [
                    {...chat, lastMessage},
                    ...state.chats.filter((c) => c._id !== chatId)
                ]
            }
        })
    },
    addNewMessage: (chatId, message) => {
        const chat = get().SingleChat;

        if(chat?.chat._id === chatId){
            set({
                SingleChat: {
                    chat: chat.chat,
                    message: [
                        ...chat.message, message 
                    ]
                }
            })
        }
    },

    addOrUpdateMessage: (chatId: string, msg: MessageType, 
        tempId?: string
    ) => {
        const singleChat = get().SingleChat;
        if(!singleChat || singleChat.chat._id !== chatId) return;

        const messages = singleChat.message;
        const msgIndex = tempId ? messages.findIndex((msg) => msg._id === tempId): -1;

        let updatedMessages;

        if(msgIndex !== -1){
            updatedMessages = messages.map((message,i) => (
                i=== msgIndex ? {...msg} : message
            ));
        }else {
            updatedMessages = [...messages, msg]
        }

        set({
            SingleChat: {
                chat: singleChat.chat,
                message: updatedMessages 
            }
        })
    }

}))