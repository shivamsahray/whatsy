import AppWrapper from "@/components/app-wrapper";
import ChatList from "@/components/chat/chat-list";
import { cn } from "@/lib/utils";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
    return (
    <AppWrapper>
        <div className="h-full ">
            {/* ChatList */}
            <div className="block">
                <ChatList />
            </div>
            <div className={cn("lg:!pl-95 pl-7")}>
                <Outlet />
            </div>
        </div>
    </AppWrapper>
        
    )
}

export default AppLayout;