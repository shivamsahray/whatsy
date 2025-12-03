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

    fetchAllUsers: () => void;
    fetchChats: () => void;
    createChat: (payload: CreateChatType) => Promise<ChatState | null>;
    fetchSingleChat: (chatId: string) => void;
    sendMessage: (payload: CreateMessageType) => void;
    addNewChat: (newChat: ChatType) => void;
    updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
    addNewMessage: (chatId: string, message: MessageType) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
    chats: [],
    users: [],
    SingleChat: null,

    isChatsLoading: false,
    isUsersLoading: false,
    isCreatingChat: false,
    isSingleChatLoading: false,
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
    sendMessage: async(payload: CreateMessageType) => {
        const {chatId, replyTo, content, image } = payload;
        const { user } = useAuth.getState();
        // const currentChat = get().SingleChat

        if(!chatId || !user?._id) return;
        const tempMsgId = generateUUID();

        const tempMessage = {
            _id: tempMsgId,
            chatId,
            content: content || null,
            image: image || null,
            sender: user,
            replyTo: replyTo || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "sending..."

        }

        set((state) => {
            if(state.SingleChat?.chat?._id !== chatId) return state;
            return {
                SingleChat: {
                    ...state.SingleChat,
                    message: [...state.SingleChat.message, tempMessage]
                }
            }
        });

        try {
            const { data } = await API.post("/chat/message/send", {
                chatId,
                content,
                image,
                replyToId: replyTo?._id,
            })

            const { userMessage } = data;
            set((state) => {
            if(!state.SingleChat) return state;
            return {
                SingleChat: {
                    ...state.SingleChat,
                    message: state.SingleChat.message.map((msg) => msg._id === tempMsgId ? userMessage : msg)
                }
            }
            });
            
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to send message")
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
}))