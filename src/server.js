import dotenv from "dotenv";
dotenv.config({path: './.env'});
import connectDB from "./config/database.js"
import app from "./app.js"



const startServer = async() => {
    try {
        await connectDB();
        
        app.listen(process.env.PORT || 4000, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        // console.log("Connection failed", error);
    }
}
startServer();
