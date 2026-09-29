//token bnao userid le kar aur sign kar do
import jwt from "jsonwebtoken";
import { env } from "./env.js";

const genToken = (userId) => {
    // error aaye to caller tak jaane do — undefined token cookie me save nahi hona chahiye
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });
};

export default genToken;
