
import User from "../models/user.model.js";
import genToken from "../config/token.js";

export const googleAuth = async (req , res) =>{
    try {
        // form ka data lao
        const { name, email, imageUrl } = req.body;
        let user = await User.findOne({ email });
        //user bna do database me
        if(!user){
            user = await User.create({
                name,
                email
            })
        }
        //token do aur cookie me save kar do
        let token = await genToken(user._id);
        res.cookie("token", token, {
           httpOnly: true,
            secure:false,
            sameSite:"strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds  
        });

        //user ko response bhej do
        return res.status(200).json({ message: "Google authentication successful", user, token });

    }
    catch (error) {
        console.error("Error in googleAuth:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}



export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
        });

        return res.status(200).json({
            message: "Logout successful"
        });
    }
    catch (error) {
        console.error("Error in logout:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

