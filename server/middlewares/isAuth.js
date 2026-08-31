//token se id nikal ke user ko authenticate karne ka middleware
import jwt from "jsonwebtoken";

const isAuth = async (req , res , next) =>{
    try{
        let {token} = req.cookies;
        if(!token){
            return res.status(401).json({message : "User dosent have token Unauthorized"})
        }

        let verifyToken = jwt.verify(token , process.env.JWT_SECRET);
        if(!verifyToken){
            return res.status(401).json({message : "Unauthorized"})
        }

        req.userId = verifyToken.userId;


        next();
    }
    catch(error){
        console.error("Error in isAuth middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default isAuth;