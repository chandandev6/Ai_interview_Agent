import { getCurrentUserCached } from "./user.service.js";
import { sendSuccess } from "../../utils/response.js";

// yaha par user ki details ko get karne ka controller function hai
export const getCurrentUser = async (req, res) => {
    const user = await getCurrentUserCached(req.userId);
    return sendSuccess(res, { data: { user } });
};
