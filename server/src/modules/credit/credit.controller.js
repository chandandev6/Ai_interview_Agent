import { sendSuccess } from "../../utils/response.js";
import { getTransactions } from "./credit.service.js";

export const listTransactions = async (req, res) => {
    const result = await getTransactions(req.userId, req.query);
    return sendSuccess(res, { data: result });
};
