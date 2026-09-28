import User from "./user.model.js";
import AppError from "../../utils/AppError.js";

export const getUserById = async (userId) => {
    const user = await User.findById(userId).select("-password").lean();
    if(!user){
        throw new AppError(404, "User not found");
    }
    return user;
}

// Google login ke baad user lao, nahi hai to bna do
export const findOrCreateByEmail = async ({ email, name }) => {
    let user = await User.findOne({ email }).select("-password").lean();
    if(!user){
        const created = await User.create({ name, email });
        const { password, ...safeUser } = created.toObject();
        user = safeUser;
    }
    return user;
}
