import mongoose from "mongoose"
import { Env } from "./env.config";


export const connectDatabase = async() => {
    try {
        await mongoose.connect(Env.MONGO_URI);
        console.log("Database connected");
    } catch (error) {
        console.log("Database Connection Error: ", error);
        process.exit();
    }
}

export default connectDatabase;