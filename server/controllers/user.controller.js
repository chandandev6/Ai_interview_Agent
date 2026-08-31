import User from "../models/user.model.js";

// yaha par user ki details ko get karne ka controller function hai 
export const getCurrentUser = async (req, res) => {
    try{
        const userId = req.userId;
        const user = await User.findById(userId)
    .select("-password");
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    }
    catch(error){
        console.error("Error in getCurrentUser:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
