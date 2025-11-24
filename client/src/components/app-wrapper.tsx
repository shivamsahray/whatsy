import type React from "react";

interface Props {
    children: React.ReactNode;
}
const AppWrapper = ({children}: Props) => {
    return (
        <div className="h-full">
            <main className=" h-full">
                {/* Toolbar */}
                {children}
            </main>
            
        </div>
    )
}

export default AppWrapper;