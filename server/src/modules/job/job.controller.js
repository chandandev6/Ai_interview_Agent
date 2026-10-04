import { sendSuccess } from "../../utils/response.js";
import { getJobStatus } from "./job.service.js";

// client har ~2s me poochta hai: "mera kaam hua?"
export const getJob = async (req, res) => {
    const job = await getJobStatus(req.userId, req.params.id);
    return sendSuccess(res, { data: job });
};
